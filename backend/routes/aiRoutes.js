const express = require("express");
 const {
   summarizeEmail,
   generateReply,
   extractTasks,
 } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

 const router = express.Router();

-router.post("/summarize", summarizeEmail);
-router.post("/reply", generateReply);
-router.post("/tasks", extractTasks);
+router.post("/summarize", protect, summarizeEmail);
+router.post("/reply", protect, generateReply);
+router.post("/tasks", protect, extractTasks);

 module.exports = router;
