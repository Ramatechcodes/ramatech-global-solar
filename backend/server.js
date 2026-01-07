const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 5000;

/* ===================== ADMIN CREDENTIALS ===================== */
/*
CHANGE THESE TO YOUR OWN
(You can later move them to Render ENV vars)
*/
const ADMIN_USERNAME = "ramatech";
const ADMIN_PASSWORD = "secure123"; // change this

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

/* ===================== DATA STORAGE ===================== */
const DATA_FILE = path.join(__dirname, "data.json");

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

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
app.post("/api/register", (req, res) => {
  try {
    const data = readData();

    const newEntry = {
      ...req.body,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    data.unshift(newEntry);
    writeData(data);

    res.status(201).json({
      message: "Registration saved successfully",
    });
  } catch {
    res.status(500).json({ message: "Failed to save registration" });
  }
});

// Admin: view registrations (PROTECTED)
app.get("/api/registrations", requireAdmin, (req, res) => {
  res.json(readData());
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
