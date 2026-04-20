require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;


// store hashed password in .env
const app = express();
const PORT = process.env.PORT || 5000;

/* ===================== ADMIN CREDENTIALS ===================== */
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = "Ramadan@14";

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
  const { password } = req.body;

  if (password === "Ramadan@14") {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ message: "Wrong password" });
  }
});

app.get("/admin-logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin-login"));
});

/* ===================== API ROUTES ===================== */


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
app.post("/api/register", async (req, res) => {
  try {
    const data = req.body;

  const total = data.payment?.total || 0;

// Outright price (display only)
const outright = 1500000;

// Installment calculation (REAL LOGIC)
const upfront = total * 0.6;
const balance = total * 0.4;
const weekly = balance / 16;
    // ✅ 1. Save FULL registration
    const { error: regError } = await supabase
      .from("registration")
      .insert([{
  name: data.fullName,
  phone: data.phoneNumber,
  email: data.email,
  nationality: data.nationality,
  state: data.state,
  lga: data.lga,
  postal_code: data.postalCode,
  full_address: data.address,
  nearest_landmark: data.busStop,

  installation_type: data.installationType + 
    (data.solarPackage ? ` (${data.solarPackage})` : ""),

  total,
  upfront,
  weekly,
  balance,
outreach_fee: 300000, // display only
  
  date: new Date().toISOString()
}]);

    if (regError) throw regError;

    // ✅ 2. Create user (password = Ramadan@14)
    const hashed = await bcrypt.hash("Ramadan@14", 10);

    const { data: user, error: userError } = await supabase
      .from("users")
      .insert([{
        name: data.fullName,
        email: data.email,
        password: hashed,
        phone: data.phoneNumber
      }])
      .select()
      .single();

    if (userError) throw userError;

    // ✅ 3. Create payment record
   await supabase.from("payments").insert([{
  user_id: user.id,
  total,
  balance,
  weekly,
  weeks_paid: 0
}]);

    res.json({ message: "Registration + user created" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving registration" });
  }
});
app.post("/api/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    // ✅ FIX: check BEFORE using data
    if (error || !data) {
      return res.status(401).json({ message: "User not found" });
    }

    const valid = await bcrypt.compare(password, data.password);

    if (!valid) {
      return res.status(401).json({ message: "Wrong password" });
    }

    const token = jwt.sign({ id: data.id }, JWT_SECRET);

    res.json({ token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
function auth(req, res, next) {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}
app.get("/api/user/dashboard", auth, async (req, res) => {
  const userId = req.user.id;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .single();

  const { data: registration } = await supabase
  .from("registration")
  .select("*")
  .eq("email", user.email)
  .single();
  res.json({ user, payment, registration });
});
app.post("/api/user/pay", auth, async (req, res) => {
  const userId = req.user.id;

  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .single();

  let newWeeks = data.weeks_paid + 1;
  let newBalance = data.balance - data.weekly;

  await supabase
    .from("payments")
    .update({
      weeks_paid: newWeeks,
      balance: newBalance
    })
    .eq("user_id", userId);

  res.json({ message: "Payment recorded" });
  if (!data) {
  return res.status(404).json({ message: "No payment record" });
}
});
app.get("/api/users/by-email", async (req, res) => {
  const { email } = req.query;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", user.id)
    .single();

  res.json({
    id: user.id,
    weeks_paid: payment?.weeks_paid || 0
  });
});
/* ===================== ADMIN PAGE ===================== */
app.post("/api/admin/pay-week", requireAdmin, async (req, res) => {
  const { user_id } = req.body;

  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", user_id)
    .single();

  let newWeeks = data.weeks_paid + 1;
  let newBalance = data.balance - data.weekly;

  await supabase
    .from("payments")
    .update({
      weeks_paid: newWeeks,
      balance: newBalance
    })
    .eq("user_id", user_id);

  res.json({ message: "Week marked" });
});

/* ===================== FRONTEND ===================== */
app.get(/.*/, (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

/* ===================== START SERVER ===================== */
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
