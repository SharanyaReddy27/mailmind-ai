const express = require("express");
const {
  summarizeEmail,
  generateReply,
  extractTasks,
} = require("../controllers/aiController");

const router = express.Router();

router.post("/summarize", summarizeEmail);
router.post("/reply", generateReply);
router.post("/tasks", extractTasks);

module.exports = router;
