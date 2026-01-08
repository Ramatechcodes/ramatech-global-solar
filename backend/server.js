require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 5000;

/* ===================== ADMIN CREDENTIALS ===================== */
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/* ===================== MIDDLEWARE ===================== */
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use(
  session({
    secret: "ramatech-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

/* ===================== SUPABASE SETUP ===================== */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/* ===================== AUTH MIDDLEWARE ===================== */
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) next();
  else res.redirect("/admin-login");
}

/* ===================== AUTH ROUTES ===================== */
app.get("/admin-login", (req, res) => {
  res.sendFile(__dirname + "/public/admin-login.html");
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ message: "Invalid login" });
  }
});

app.get("/admin-logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin-login"));
});

/* ===================== API ROUTES ===================== */
app.post("/api/register", async (req, res) => {
  try {
    const data = req.body;

    const newEntry = {
      name: data.fullName || "",
      phone: data.phoneNumber || "",
      email: data.email || "",
      nationality: data.nationality || "",
      state: data.state || "",
      lga: data.lga || "",
      postal_code: data.postalCode || "",
      nearest_landmark: data.busStop || "",
      full_address: data.address || "", // store full address
      installation_type: data.installationType
        ? `${data.installationType} ${data.solarPackage ? '(' + data.solarPackage + ')' : ''}`
        : "",
      total: data.payment?.total || 0,
      upfront: data.payment?.upfront || 0,
      weekly: data.payment?.weekly || 0,
      date: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("registration")
      .insert([newEntry]);

    if (error) throw error;

    res.status(201).json({ message: "Registration saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save registration" });
  }
});

// Admin: view registrations
app.get("/api/registrations", requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("registration")
      .select("*")
      .order("date", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch registrations" });
  }
});

/* ===================== ADMIN PAGE ===================== */
app.get("/admin", requireAdmin, (req, res) => {
  res.sendFile(__dirname + "/public/admin.html");
});

/* ===================== FRONTEND ===================== */
app.get(/.*/, (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

/* ===================== START SERVER ===================== */
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
