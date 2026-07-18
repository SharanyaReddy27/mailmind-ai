const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

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
    status: "success",
    message: "Frontend successfully connected to backend",
  });
});

app.get("/api/emails", (req, res) => {
  const emails = [
    {
      id: 1,
      senderName: "Rahul Kumar",
      senderEmail: "rahul@example.com",
      subject: "Project meeting",
      snippet: "Can we schedule the project discussion tomorrow?",
      priority: "High",
      unread: true,
    },
    {
      id: 2,
      senderName: "Placement Cell",
      senderEmail: "placement@college.edu",
      subject: "Internship opportunity",
      snippet: "Applications are open for the software internship.",
      priority: "Medium",
      unread: true,
    },
    {
      id: 3,
      senderName: "Amazon",
      senderEmail: "orders@amazon.in",
      subject: "Your order has been shipped",
      snippet: "Your package is on the way.",
      priority: "Low",
      unread: false,
    },
  ];

  res.json(emails);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`MailMind server running at http://localhost:${PORT}`);
});