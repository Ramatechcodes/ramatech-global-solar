const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// Data file
const DATA_FILE = path.join(__dirname, "data.json");

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

// API route
app.post("/api/register", (req, res) => {
  try {
    const data = readData();
    const newEntry = req.body;
    if (data.some(e => e.id === newEntry.id))
      return res.status(400).json({ message: "Duplicate ID detected." });

    data.unshift(newEntry);
    writeData(data);
    res.status(201).json({ message: "Registration saved successfully!", entry: newEntry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save registration." });
  }
});

// Serve frontend for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
