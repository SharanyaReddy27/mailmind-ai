const express = require('express');
const { getAuthUrl, oauthCallback, status, gmailDisconnect } = require('../controllers/gmailController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/auth-url', protect, getAuthUrl);
router.get('/callback', oauthCallback);
router.get('/status', protect, status);
router.post('/sync', protect, async (req, res) => {
  const gmailService = require('../services/gmailService');
  const limit = parseInt(req.body.limit, 10) || 20;
  if (isNaN(limit) || limit <= 0 || limit > 50) return res.status(400).json({ success: false, message: 'Invalid limit' });
  try {
    const result = await gmailService.syncGmailForUser(req.user, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err && err.code === 'NO_CONNECTION') return res.status(409).json({ success: false, message: 'Gmail not connected' });
    return res.status(500).json({ success: false, message: 'Sync failed' });
  }
});

router.post('/disconnect', protect, gmailDisconnect);

module.exports = router;
