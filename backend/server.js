// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
//nst { sendWhatsAppMessage } = require("./whatsapp");//

const cors = require("cors");

app.use(cors({
  origin: "https://ramatech-globalsolar.onrender.com"
}));

app.use(express.json());

// ===== Test Route =====
app.get("/", (req, res) => res.send("✅ EasyBuy backend running"));

// ===== Admin Login =====
const ADMIN = { username: "admin", password: "admin123" };
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) {
    return res.json({ message: "Login successful" });
  }
  res.status(401).json({ message: "Invalid login details" });
});

// ===== Register Customer =====
app.post("/api/register", async (req, res) => {
  try {
    const data = req.body;
    if (!data.fullName || !data.phoneNumber || !data.installationType) {
      return res.status(400).json({ message: "Full name, phone number and installation type are required" });
    }

    // Solar pricing
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

    const balance = Math.round(totalAmount * 0.6);
    const weeks = 16;
    const weeklyPayment = Math.round(balance / weeks);

    await db.read();
    const newCustomer = {
      id: Date.now(),
      ...data,
      totalAmount,
      balance,
      weeks,
      weeklyPayment,
      createdAt: new Date().toISOString(),
    };

    db.data.customers.push(newCustomer);
    await db.write();

    // WhatsApp Message
    const msg = `
Hello ${newCustomer.fullName}!
Thank you for registering with EasyBuy.

Phone: ${newCustomer.phoneNumber}
Email: ${newCustomer.email || "-"}
Installation: ${newCustomer.installationType}
${newCustomer.installationType === "solar" ? `Package: ${newCustomer.solarPackage}` : ""}
Total Amount: ₦${newCustomer.totalAmount.toLocaleString()}
Balance: ₦${newCustomer.balance.toLocaleString()}
Weekly Payment: ₦${newCustomer.weeklyPayment.toLocaleString()}
`;

   //endWhatsAppMessage(newCustomer.phoneNumber, msg);//

    res.json({ message: "✅ Customer registered successfully", customer: newCustomer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== Get all customers =====
app.get("/api/customers", async (req, res) => {
  try {
    await db.read();
    const customers = db.data.customers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== Start Server =====
const PORT = 5000; // force 5000 for now
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
