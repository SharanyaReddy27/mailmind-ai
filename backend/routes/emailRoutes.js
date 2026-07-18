const express = require("express");
const {
  getEmails,
  getEmailById,
  seedEmails,
  createEmail,
  updateEmail,
  deleteEmail,
} = require("../controllers/emailController");
const router = express.Router();

router.post("/seed", seedEmails);
router.get("/", getEmails);
router.get("/:id", getEmailById);
router.post("/", createEmail);
router.put("/:id", updateEmail);
router.delete("/:id", deleteEmail);

module.exports = router;