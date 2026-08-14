const express = require("express");
const {
  getEmails,
  getEmailById,
  seedEmails,
  createEmail,
  updateEmail,
  deleteEmail,
} = require('../controllers/emailController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Seed route is protected to avoid accidental/public demo data injection
router.post('/seed', protect, seedEmails);
router.get('/', protect, getEmails);
router.get('/:id', protect, getEmailById);
router.post('/', protect, createEmail);
router.put('/:id', protect, updateEmail);
router.delete('/:id', protect, deleteEmail);

module.exports = router;