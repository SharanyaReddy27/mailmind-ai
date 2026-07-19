const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);

    console.log(
      `MongoDB connected: ${connection.connection.host}`
    );
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    // Do not exit process here to allow the server to run in demo/fallback mode
    // The application can still operate with demo emails when MongoDB is unavailable.
    return;
  }
};

module.exports = connectDB;