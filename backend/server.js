/* ===================== IMPORTS ===================== */
const express = require("express");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const { createClient } = require("@supabase/supabase-js");

/* ===================== CONFIG ===================== */
const app = express();
const PORT = process.env.PORT || 5000;

/* ===================== SUPABASE ===================== */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Supabase URL or KEY not set in environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ===================== ADMIN CREDENTIALS ===================== */
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/* ===================== MIDDLEWARE ===================== */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "ramatech-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

/* ===================== AUTH MIDDLEWARE ===================== */
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    res.redirect("/admin-login");
  }
}

/* ===================== AUTH ROUTES ===================== */

// Login page
app.get("/admin-login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-login.html"));
});

// Handle login
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ message: "Invalid login details" });
  }
});

// Logout
app.get("/admin-logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin-login");
  });
});

/* ===================== API ROUTES ===================== */

// Register customer
app.post("/api/register", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("registrations")
      .insert([
        {
          ...req.body,
          created_at: new Date().toISOString(), // ensures created_at column is filled
        },
      ]);

    if (error) throw error;

    res.status(201).json({
      message: "Registration saved successfully",
      data,
    });
  } catch (err) {
    console.error("Error saving registration:", err);
    res.status(500).json({ message: "Failed to save registration" });
  }
});

// Admin: view registrations (PROTECTED)
app.get("/api/registrations", requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Error fetching registrations:", err);
    res.status(500).json({ message: "Failed to fetch registrations" });
  }
});

/* ===================== ADMIN PAGE (PROTECTED) ===================== */
app.get("/admin", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

/* ===================== FRONTEND ===================== */
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ===================== START SERVER ===================== */
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
