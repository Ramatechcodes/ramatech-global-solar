const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

/* ===================== MIDDLEWARE ===================== */
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

/* ===================== DATA STORAGE ===================== */
const DATA_FILE = path.join(__dirname, "data.json");

// Ensure data.json exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// Read data
function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (err) {
    console.error("Read error:", err);
    return [];
  }
}

// Write data
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

/* ===================== API ROUTES ===================== */

// Register customer
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
    console.error(err);
    res.status(500).json({ message: "Failed to save registration" });
  }
});

// Get all registrations (ADMIN)
app.get("/api/registrations", (req, res) => {
  try {
    const data = readData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to load registrations" });
  }
});

/* ===================== ADMIN PAGE ===================== */

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

/* ===================== FRONTEND ROUTING ===================== */
/*
⚠️ THIS MUST BE LAST
This prevents Render crash and allows SPA routing
*/
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ===================== START SERVER ===================== */

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
