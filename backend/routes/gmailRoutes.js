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
  const pageToken = req.body.pageToken || null;
  if (isNaN(limit) || limit <= 0 || limit > 50) return res.status(400).json({ success: false, message: 'Invalid limit' });
  try {
    const result = await gmailService.syncGmailForUser(req.user, limit, pageToken);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('======== SYNC ERROR ========', err);
    if (err && err.code === 'NO_CONNECTION') {
      return res.status(409).json({ success: false, message: 'Gmail not connected' });
    }
    if (err && err.code === 'INVALID_GMAIL_TOKEN') {
      return res.status(401).json({ success: false, message: err.message });
    }
    const message = err?.message || 'Sync failed';
    return res.status(500).json({ success: false, message });
  }
});

router.post('/disconnect', protect, gmailDisconnect);

module.exports = router;
