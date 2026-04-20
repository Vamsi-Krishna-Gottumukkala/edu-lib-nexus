/**
 * EduLibrary Nexus — RFID Edge Node (Bridge)
 * Reads RFID UIDs from Arduino over serial port and securely relays them
 * to the centralized backend API via HTTP POST.
 *
 * Setup:
 *   1. Fill in your .env variables (ARDUINO_PORT, BACKEND_URL, API_SECRET_KEY, BRANCH_ID)
 *   2. npm start
 */

import "dotenv/config";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

// Environment Configuration
const ARDUINO_PORT    = process.env.ARDUINO_PORT    || "COM17";
const BAUD_RATE       = parseInt(process.env.BAUD_RATE || "9600");
const BACKEND_URL     = process.env.BACKEND_URL     || "http://localhost:4000/api/scan";
const API_SECRET_KEY  = process.env.API_SECRET_KEY  || "edu-bridge-secret";
const BRANCH_ID       = parseInt(process.env.BRANCH_ID || "1"); // Represents this physical campus
const SCAN_TIMEOUT    = 5000; // ms to debounce dupes locally at the edge

if (isNaN(BRANCH_ID)) {
  console.error("❌ BRANCH_ID in .env must be a valid number!");
  process.exit(1);
}

const recentScans = new Set();

// ─── Post Scan to Backend ──────────────────────────────────────
async function handleScan(uid) {
  // Prevent duplicate edge scans within window
  if (recentScans.has(uid)) {
    console.log(`↩️  [${uid}] Duplicate scan ignored locally (${SCAN_TIMEOUT / 1000}s cooldown)`);
    return;
  }
  recentScans.add(uid);
  setTimeout(() => recentScans.delete(uid), SCAN_TIMEOUT);

  console.log(`📡 [${uid}] Forwarding to Cloud Backend...`);

  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        branch_id: BRANCH_ID,
        secret_key: API_SECRET_KEY
      })
    });

    if (!response.ok) {
      const txt = await response.text();
      console.error(`❌ [${uid}] Server Error (${response.status}): ${txt}`);
    } else {
      console.log(`✅ [${uid}] Relay successful`);
    }
  } catch (err) {
    console.error(`❌ [${uid}] Network Error: Cannot reach ${BACKEND_URL}. Check if the backend is running.`);
  }
}

// ─── Serial port setup ────────────────────────────────────────
console.log(`\n🔌 EduLibrary RFID Edge Node [Branch ID: ${BRANCH_ID}]`);
console.log(`   Port   : ${ARDUINO_PORT} | Baud: ${BAUD_RATE}`);
console.log(`   Backend: ${BACKEND_URL}\n`);

try {
  const port   = new SerialPort({ path: ARDUINO_PORT, baudRate: BAUD_RATE });
  const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

  port.on("open",  () => console.log(`🟢 Serial port ${ARDUINO_PORT} opened. Waiting for cards...\n`));
  port.on("error", err => console.error(`🔴 SerialPort error: ${err.message}`));

  parser.on("data", (line) => {
    // Expected Arduino format: "RFID Tag UID: A3F2C109"
    if (line.startsWith("RFID Tag UID:")) {
      const uid = line.split(":")[1].trim();
      handleScan(uid);
    }
  });
} catch (err) {
  console.error(`❌ Could not open ${ARDUINO_PORT}: ${err.message}`);
  console.error(`   Check that the Arduino is connected and the COM port is correct.`);
  process.exit(1);
}
