const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

/* ===================== MIDDLEWARE ===================== */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ===================== DATA STORAGE ===================== */
const DATA_FILE = path.join(__dirname, "data.json");

// Ensure data.json exists
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

/* ===================== API ROUTES ===================== */

// Save registration
app.post("/api/register", (req, res) => {
  try {
    const data = readData();

    const newEntry = {
      ...req.body,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    data.unshift(newEntry);
    writeData(data);

    res.status(201).json({
      message: "Registration saved successfully",
      entry: newEntry
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to save registration" });
  }
});

// Admin: view registrations
app.get("/api/registrations", (req, res) => {
  try {
    res.json(readData());
  } catch {
    res.status(500).json({ message: "Failed to load registrations" });
  }
});

/* ===================== ADMIN PAGE ===================== */

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

/* ===================== FRONTEND ROUTING (LAST!) ===================== */

// ⚠️ DO NOT USE "*"
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ===================== START SERVER ===================== */

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
