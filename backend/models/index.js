const mongoose = require("mongoose");

async function connectDB(MONGO_URL) {
  try {
    await mongoose.connect(MONGO_URL); 
    console.log("Database connected successfully.");
  } catch (err) {
    console.error("Connection error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;