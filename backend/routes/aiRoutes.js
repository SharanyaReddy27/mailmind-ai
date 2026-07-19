const express = require("express");
const router = express.Router();

const buildSummary = (email) => {
  const subject = email?.subject || "this email";
  const sender = email?.sender || email?.senderName || email?.senderEmail || "the sender";
  const body = email?.body || email?.content || email?.message || "";

  return `Summary for ${subject}: ${sender} shared a message about ${body.slice(0, 120) || "the requested topic"}.`;
};

const buildReply = (email) => {
  const sender = email?.sender || email?.senderName || email?.senderEmail || "there";
  const subject = email?.subject || "your message";

  return `Hi ${sender},\n\nThanks for your email about \"${subject}\". I’ve reviewed the details and will follow up shortly.\n\nBest regards,\nMailMind AI`;
};

const buildTasks = (email) => {
  const body = email?.body || email?.content || email?.message || "";
  const lowerBody = body.toLowerCase();
  const tasks = [];

  if (lowerBody.includes("schedule") || lowerBody.includes("meeting")) {
    tasks.push({ title: "Schedule the follow-up meeting", completed: false });
  }

  if (lowerBody.includes("review") || lowerBody.includes("project")) {
    tasks.push({ title: "Review the shared details", completed: false });
  }

  if (lowerBody.includes("submit") || lowerBody.includes("application")) {
    tasks.push({ title: "Submit the requested information", completed: false });
  }

  if (tasks.length === 0) {
    tasks.push({ title: "No actionable tasks found", completed: false });
  }

  return tasks;
};

router.post("/summarize", (req, res) => {
  const email = req.body || {};
  res.json({ success: true, summary: buildSummary(email) });
});

router.post("/reply", (req, res) => {
  const email = req.body || {};
  res.json({ success: true, reply: buildReply(email) });
});

router.post("/tasks", (req, res) => {
  const email = req.body || {};
  res.json({ success: true, tasks: buildTasks(email) });
});

module.exports = router;
