/**
 * EduLibrary Nexus — RFID Bridge
 * Reads RFID UIDs from Arduino over serial port and posts to Supabase.
 *
 * Setup:
 *   1. Copy .env.example → .env and fill in your values
 *   2. npm install
 *   3. node bridge.js
 */

import "dotenv/config";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import { createClient } from "@supabase/supabase-js";

const ARDUINO_PORT   = process.env.ARDUINO_PORT   || "COM17";
const BAUD_RATE      = parseInt(process.env.BAUD_RATE || "9600");
const SUPABASE_URL   = process.env.SUPABASE_URL;
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY; // needs service role to bypass RLS
const SCAN_TIMEOUT   = 5000; // ms — ignore duplicate scans within this window

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const recentScans = new Set();

// ─── Card scan handler ────────────────────────────────────────
async function handleScan(uid) {
  if (recentScans.has(uid)) {
    console.log(`↩️  [${uid}] Duplicate scan — ignored (${SCAN_TIMEOUT / 1000}s cooldown)`);
    return;
  }
  recentScans.add(uid);
  setTimeout(() => recentScans.delete(uid), SCAN_TIMEOUT);

  try {
    // 1. Look up user by UID
    const { data: rfidRow, error: rfidErr } = await supabase
      .from("rfid_details")
      .select("user_id")
      .eq("uid", uid)
      .maybeSingle();

    if (rfidErr) throw rfidErr;
    if (!rfidRow) {
      console.log(`⚠️  [${uid}] UNREGISTERED card — not in rfid_details`);
      return;
    }

    const user_id   = rfidRow.user_id;
    const today     = new Date().toISOString().split("T")[0];
    const now       = new Date();
    const time      = now.toTimeString().slice(0, 8); // HH:MM:SS

    // 2. Check for an open (no logout) entry today
    const { data: openLog, error: logErr } = await supabase
      .from("attendance_log")
      .select("log_id")
      .eq("user_id", user_id)
      .eq("log_date", today)
      .is("logout_time", null)
      .maybeSingle();

    if (logErr) throw logErr;

    if (openLog) {
      // ── LOGOUT ──
      const { error: updErr } = await supabase
        .from("attendance_log")
        .update({ logout_time: time })
        .eq("log_id", openLog.log_id);
      if (updErr) throw updErr;
      console.log(`🚪  [${uid}] LOGOUT  — user ${user_id} at ${time}`);
    } else {
      // ── LOGIN ──
      const { error: insErr } = await supabase
        .from("attendance_log")
        .insert({ user_id, log_date: today, login_time: time });
      if (insErr) throw insErr;
      console.log(`✅  [${uid}] LOGIN   — user ${user_id} at ${time}`);
    }
  } catch (err) {
    console.error(`❌  [${uid}] Error:`, err.message);
  }
}

// ─── Serial port setup ────────────────────────────────────────
console.log(`\n🔌  EduLibrary RFID Bridge`);
console.log(`    Port : ${ARDUINO_PORT}  |  Baud : ${BAUD_RATE}`);
console.log(`    Supabase : ${SUPABASE_URL}\n`);

try {
  const port   = new SerialPort({ path: ARDUINO_PORT, baudRate: BAUD_RATE });
  const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

  port.on("open",  () => console.log(`🟢  Serial port ${ARDUINO_PORT} opened. Waiting for cards...\n`));
  port.on("error", err => console.error(`🔴  SerialPort error: ${err.message}`));

  parser.on("data", (line) => {
    // Arduino sends: "RFID Tag UID: A3F2C109"
    if (line.startsWith("RFID Tag UID:")) {
      const uid = line.split(":")[1].trim();
      handleScan(uid);
    }
  });
} catch (err) {
  console.error(`❌  Could not open ${ARDUINO_PORT}: ${err.message}`);
  console.error(`    Check that the Arduino is connected and the port is correct.`);
  process.exit(1);
}
