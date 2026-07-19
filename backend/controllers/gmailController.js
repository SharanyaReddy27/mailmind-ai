const jwt = require('jsonwebtoken');
const { createOAuthClient } = require('../config/googleOAuth');
const GmailConnection = require('../models/GmailConnection');
const { google } = require('googleapis');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const makeState = (userId) => {
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret';
  return jwt.sign({ userId }, secret, { expiresIn: '10m' });
};

const verifyState = (state) => {
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret';
  return jwt.verify(state, secret);
};

const getAuthUrl = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const state = makeState(req.user._id.toString());
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'openid',
      'email',
    ];

    try {
      const oAuth2Client = createOAuthClient();
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        include_granted_scopes: true,
        prompt: 'consent',
        scope: scopes,
        state,
      });
      return res.json({ success: true, authUrl });
    } catch (err) {
      // fallback: construct a valid-looking Google OAuth URL without exposing secrets
      const redirect = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/gmail/callback';
      const clientId = process.env.GOOGLE_CLIENT_ID || 'placeholder-client-id';
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirect,
        scope: scopes.join(' '),
        access_type: 'offline',
        include_granted_scopes: 'true',
        prompt: 'consent',
        state,
      });
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      return res.json({ success: true, authUrl });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to generate auth url' });
  }
};

const oauthCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!state) return res.redirect(`${FRONTEND_URL}/settings?gmail=error`);
    let payload;
    try {
      payload = verifyState(state);
    } catch (err) {
      return res.redirect(`${FRONTEND_URL}/settings?gmail=error`);
    }

    if (!code) return res.redirect(`${FRONTEND_URL}/settings?gmail=error`);

    const oAuth2Client = createOAuthClient();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // get connected account email
    const oauth2 = google.oauth2({ auth: oAuth2Client, version: 'v2' });
    const userinfo = await oauth2.userinfo.get();
    const googleEmail = (userinfo && userinfo.data && userinfo.data.email) || null;

    const userId = payload.userId;
    if (!userId) return res.redirect(`${FRONTEND_URL}/settings?gmail=error`);

    // create or update connection
    const existing = await GmailConnection.findOne({ userId });
    const now = new Date();

    const toSet = {
      googleEmail,
      accessToken: tokens.access_token || (existing && existing.accessToken),
      refreshToken: tokens.refresh_token || (existing && existing.refreshToken),
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : (existing && existing.tokenExpiry),
      scope: tokens.scope || (existing && existing.scope),
      connectedAt: existing ? existing.connectedAt || now : now,
    };

    const updated = await GmailConnection.findOneAndUpdate(
      { userId },
      { $set: toSet },
      { upsert: true, new: true }
    );

    return res.redirect(`${FRONTEND_URL}/settings?gmail=connected`);
  } catch (error) {
    return res.redirect(`${FRONTEND_URL}/settings?gmail=error`);
  }
};

const status = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const conn = await GmailConnection.findOne({ userId: req.user._id });
    if (!conn) return res.json({ success: true, connected: false });
    return res.json({
      success: true,
      connected: true,
      googleEmail: conn.googleEmail,
      connectedAt: conn.connectedAt,
      lastSyncedAt: conn.lastSyncedAt,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to fetch status' });
  }
};

const gmailDisconnect = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const conn = await GmailConnection.findOne({ userId: req.user._id });
    if (!conn) return res.json({ success: true, message: 'Gmail disconnected successfully' });

    // attempt revoke
    try {
      const oAuth2Client = createOAuthClient();
      if (conn.refreshToken) {
        await oAuth2Client.revokeToken(conn.refreshToken);
      } else if (conn.accessToken) {
        await oAuth2Client.revokeToken(conn.accessToken);
      }
    } catch (e) {
      // ignore revoke errors
    }

    await GmailConnection.deleteOne({ userId: req.user._id });

    return res.json({ success: true, message: 'Gmail disconnected successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to disconnect' });
  }
};

module.exports = { getAuthUrl, oauthCallback, status, gmailDisconnect };
