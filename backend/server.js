const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const emailRoutes = require("./routes/emailRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

connectDB();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow browser dev servers on localhost (any port) and 127.0.0.1
      if (!origin) return callback(null, true);
      try {
        const u = new URL(origin);
        if (
          (u.hostname === "localhost" || u.hostname === "127.0.0.1") &&
          (u.protocol === "http:" || u.protocol === "https:")
        ) {
          return callback(null, true);
        }
      } catch (e) {
        // fall through to disallow
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "MailMind backend is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "MailMind backend is running",
  });
});

app.use("/api/emails", emailRoutes);
app.use("/api/ai", aiRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`MailMind server running at http://localhost:${PORT}`);
});