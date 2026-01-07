// db.js
const { Low, JSONFile } = require("lowdb");
const path = require("path");

// Path to JSON file
const file = path.join(__dirname, "easybuy.json");
const adapter = new JSONFile(file);
const db = new Low(adapter);

// Initialize default structure
(async () => {
  await db.read();
  db.data ||= { customers: [] };
  await db.write();
})();

module.exports = db;
