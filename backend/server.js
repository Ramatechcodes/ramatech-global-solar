// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ================= MONGODB CONNECTION (RAILWAY) =================
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ Railway MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });

// ================= CUSTOMER SCHEMA =================
const customerSchema = new mongoose.Schema({
  // Personal Info
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String },

  dob: String,
  nationality: String,

  // Address Info
  address: String,
  state: String,
  lga: String,
  postalCode: String,
  busStop: String,

  // Installation Info
  installationType: { type: String, required: true }, // solar or cctv
  solarPackage: String,

  // Payment Info
  totalAmount: Number,
  balance: Number,
  weeks: { type: Number, default: 16 },
  weeklyPayment: Number,

  createdAt: { type: Date, default: Date.now },
});

const Customer = mongoose.model("Customer", customerSchema);

// ================= ADMIN LOGIN =================
const ADMIN = {
  username: "admin",
  password: "admin123", // change later
};

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN.username && password === ADMIN.password) {
    return res.json({ message: "Login successful" });
  }

  res.status(401).json({ message: "Invalid login details" });
});

// ================= REGISTER CUSTOMER =================
app.post("/api/register", async (req, res) => {
  try {
    const data = req.body;

    if (!data.fullName || !data.phoneNumber || !data.installationType) {
      return res.status(400).json({
        message: "Full name, phone number and installation type are required",
      });
    }

    let totalAmount = 0;

    if (data.installationType === "solar") {
      const packages = {
        "1kva_sachet": 600000,
        "1kva_transformer": 950000,
        "2.5kva_hybrid": 1600000,
        "3.5kva_hybrid": 1900000,
        "5kva_hybrid": 3500000,
        "7.5kva_hybrid": 5800000,
        "10kva_hybrid": 7800000,
      };

      totalAmount = packages[data.solarPackage] || 0;
    }

    const balance = totalAmount * 0.6;
    const weeklyPayment = balance / 16;

    const customer = await Customer.create({
      ...data,
      totalAmount,
      balance,
      weeks: 16,
      weeklyPayment,
    });

    res.json({
      message: "Customer registered successfully",
      customer,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= GET ALL CUSTOMERS =================
app.get("/api/customers", async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= SERVER =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
