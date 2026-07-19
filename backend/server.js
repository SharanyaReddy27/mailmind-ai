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
    origin: "http://localhost:5173",
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