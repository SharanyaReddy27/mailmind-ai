const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  if (!process.env.MONGO_URI) {
    console.warn("No MONGO_URI provided. Running with demo data.");
    return false;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.warn(
      `MongoDB connection failed. Running with demo data: ${error.message}`
    );
    return false;
  }
};

const isDbConnected = () => isConnected || mongoose.connection.readyState === 1;

module.exports = { connectDB, isDbConnected };