const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Path to local JSON file
const DATA_FILE = path.join(__dirname, "data.json");

// Helper to read current data
function readData() {
  try {
    const json = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(json);
  } catch (err) {
    return []; // return empty array if file doesn't exist
  }
}

// Helper to write data
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

// Test route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Register route
app.post("/api/register", (req, res) => {
  try {
    const data = readData();
    const newEntry = req.body;

    // Check for duplicate ID
    const exists = data.some(entry => entry.id === newEntry.id);
    if (exists) {
      return res.status(400).json({ message: "Duplicate ID detected. Registration not saved." });
    }

    // Add new entry to the **top** of the array
    data.unshift(newEntry);

    writeData(data);

    res.status(201).json({ message: "Registration saved successfully!", entry: newEntry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save registration." });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
