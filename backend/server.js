const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./config/db");
const emailRoutes = require("./routes/emailRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

connectDB();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
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
    status: "success",
    message: "Frontend successfully connected to backend",
  });
});

app.use("/api/emails", emailRoutes);
app.use("/api/ai", aiRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`MailMind server running at http://localhost:${PORT}`);
});