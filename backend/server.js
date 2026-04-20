import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const API_SECRET_KEY = process.env.API_SECRET_KEY || "edu-bridge-secret"; // Local dev fallback

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ─── SSE Event Clients ───────────────────────────────────────
let clients = [];

app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  
  // Send initial connected payload
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  clients.push(res);
  req.on("close", () => {
    clients = clients.filter((client) => client !== res);
  });
});

const broadcast = (data) => {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach((client) => client.write(payload));
};

// ─── Scan Receiver Logic ─────────────────────────────────────
const SCAN_TIMEOUT = 5000; // 5 seconds
const recentScans = new Set(); // Prevent duplicate scans

app.post("/api/scan", async (req, res) => {
  const { uid, branch_id, secret_key } = req.body;

  if (secret_key !== API_SECRET_KEY) {
    return res.status(403).json({ error: "Invalid API Secret Key" });
  }

  if (!uid || !branch_id) {
    return res.status(400).json({ error: "uid and branch_id are required" });
  }

  // 1. Debounce hardware scans
  const idKey = `${branch_id}_${uid}`;
  if (recentScans.has(idKey)) {
    return res.status(200).json({ status: "ignored_duplicate" });
  }
  recentScans.add(idKey);
  setTimeout(() => recentScans.delete(idKey), SCAN_TIMEOUT);

  try {
    // 2. Fetch User by RFID
    const { data: rfidRow, error: rfidErr } = await supabase
      .from("rfid_details")
      .select("user_id, users(user_name, user_type)")
      .eq("uid", uid)
      .maybeSingle();

    if (rfidErr) throw rfidErr;

    if (!rfidRow) {
      console.log(`⚠️ [Branch ${branch_id}] Unregistered card: ${uid}`);
      broadcast({ type: "unregistered", uid, branch_id });
      // Always broadcast general scan so frontend inputs populate
      broadcast({ type: "scan", uid, branch_id });
      return res.status(200).json({ status: "unregistered_card" });
    }

    const { user_id, users } = rfidRow;
    const user_name = users?.user_name || user_id;
    const user_type = users?.user_type || "unknown";
    const tzConfig = { timeZone: 'Asia/Kolkata', hour12: false };
    const today = new Date().toLocaleDateString('en-CA', tzConfig); // YYYY-MM-DD
    const time = new Date().toLocaleTimeString('en-GB', tzConfig); // HH:MM:SS

    // 3. Find Open Attendance Log
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
      await supabase
        .from("attendance_log")
        .update({ logout_time: time })
        .eq("log_id", openLog.log_id);
      
      console.log(`🚪 [Branch ${branch_id}] LOGOUT: ${user_name} (${user_id})`);
      broadcast({ type: "logout", uid, branch_id, user_id, user_name, user_type });
    } else {
      // ── LOGIN ──
      // Security: Only create log if the user belongs to this branch OR the user doesn't have a specific branch lock?
      // Since it's attendance, we log where they tapped. We don't have branch_id on attendance_log right now?
      // Wait, attendance logs don't have a branch_id column in supabase? 
      // Actually, they don't, but we can't add it easily if schema is locked. We will just insert.
      await supabase
        .from("attendance_log")
        .insert({ user_id, log_date: today, login_time: time });

      console.log(`✅ [Branch ${branch_id}] LOGIN: ${user_name} (${user_id})`);
      broadcast({ type: "login", uid, branch_id, user_id, user_name, user_type });
    }

    // Always broadcast scan for raw inputs
    broadcast({ type: "scan", uid, branch_id });
    res.status(200).json({ status: "success" });

  } catch (err) {
    console.error(`❌ [Branch ${branch_id}] Error for ${uid}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 EduLibrary Nexus Real-Time Backend running`);
  console.log(`   Port: ${PORT}`);
  console.log(`   API Secret: ${API_SECRET_KEY}`);
  console.log(`   Waiting for scans...\n`);
});
