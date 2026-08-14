const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      console.warn('MongoDB URI not provided. Skipping DB connection. Set MONGO_URI in backend/.env to enable database features.');
      return false;
    }

    if (mongoose.connection.readyState === 1) {
      return true;
    }

    const connection = await mongoose.connect(uri);

    console.log(
      `MongoDB connected: ${connection.connection.host}`
    );
    return true;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    // Do not exit the process here so the server can boot for local debugging.
    // The application will surface DB-related errors on API calls if the DB is unavailable.
    return false;
  }
};

const ensureDbConnected = async () => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  return connectDB();
};

module.exports = connectDB;
module.exports.ensureDbConnected = ensureDbConnected;