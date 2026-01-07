 // whatsapp.js
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

// Use LocalAuth to keep your session
const client = new Client({ authStrategy: new LocalAuth() });

client.on("qr", qr => {
  console.log("Scan this QR code with WhatsApp:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => console.log("✅ WhatsApp Client is ready"));

client.initialize();

async function sendWhatsAppMessage(number, message) {
  try {
    if (!number.startsWith("+")) {
      if (number.startsWith("0")) number = "+234" + number.slice(1);
      else number = "+" + number;
    }
    const chatId = number + "@c.us";
    await client.sendMessage(chatId, message);
    console.log("WhatsApp sent to:", number);
  } catch (err) {
    console.error("WhatsApp error:", err);
  }
}

module.exports = { sendWhatsAppMessage };
