const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { google } = require('googleapis');

const {
  createOAuthClient,
  REQUIRED_GMAIL_SCOPES,
  hasRequiredGmailScopes,
} = require('../config/googleOAuth');

const GmailConnection = require('../models/GmailConnection');

const FRONTEND_URL =
  process.env.FRONTEND_URL || 'http://localhost:5173';

// =====================================================
// OAuth STATE
// =====================================================

const makeState = (userId) => {
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret';

  return jwt.sign(
    { userId },
    secret,
    { expiresIn: '10m' }
  );
};

const verifyState = (state) => {
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret';

  return jwt.verify(state, secret);
};

// =====================================================
// GET GMAIL AUTH URL
// =====================================================

const getAuthUrl = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    console.log('===== GMAIL AUTH URL =====');
    console.log('User ID:', req.user._id.toString());

    const state = makeState(req.user._id.toString());

    const oAuth2Client = createOAuthClient();

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      include_granted_scopes: true,
      prompt: 'consent',
      scope: REQUIRED_GMAIL_SCOPES,
      state,
    });

    console.log('Gmail auth URL generated successfully');
    console.log('==========================');

    return res.json({
      success: true,
      authUrl,
    });

  } catch (error) {
    console.error('❌ Gmail auth URL error:', error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Unable to generate Gmail authorization URL',
    });
  }
};

// =====================================================
// GMAIL OAUTH CALLBACK
// =====================================================

const oauthCallback = async (req, res) => {
  console.log('');
  console.log('==========================================');
  console.log('🔥 GMAIL OAUTH CALLBACK HIT');
  console.log('==========================================');
  console.log('Query:', req.query);

  try {
    const { code, state, error } = req.query;

    // -------------------------------------------------
    // Google returned an OAuth error
    // -------------------------------------------------

    if (error) {
      console.error('❌ Google OAuth error:', error);

      return res.redirect(
        `${FRONTEND_URL}/settings?gmail=error`
      );
    }

    // -------------------------------------------------
    // Validate state
    // -------------------------------------------------

    if (!state) {
      console.error('❌ OAuth state missing');

      return res.redirect(
        `${FRONTEND_URL}/settings?gmail=error`
      );
    }

    let payload;

    try {
      payload = verifyState(state);

      console.log('✅ OAuth state verified');
      console.log('State payload:', payload);

    } catch (err) {
      console.error('❌ Invalid OAuth state:', err.message);

      return res.redirect(
        `${FRONTEND_URL}/settings?gmail=error`
      );
    }

    // -------------------------------------------------
    // Validate authorization code
    // -------------------------------------------------

    if (!code) {
      console.error('❌ Authorization code missing');

      return res.redirect(
        `${FRONTEND_URL}/settings?gmail=error`
      );
    }

    console.log('✅ Authorization code received');

    // -------------------------------------------------
    // Exchange authorization code for tokens
    // -------------------------------------------------

    const oAuth2Client = createOAuthClient();

    console.log('🔄 Exchanging authorization code for tokens...');

    const { tokens } = await oAuth2Client.getToken(code);

    console.log('✅ Tokens received');

    console.log('Token information:', {
      access_token: Boolean(tokens.access_token),
      refresh_token: Boolean(tokens.refresh_token),
      expiry_date: tokens.expiry_date,
      scope: tokens.scope,
    });

    oAuth2Client.setCredentials(tokens);

    // -------------------------------------------------
    // Get Google account information
    // -------------------------------------------------

    console.log('🔄 Fetching Google account information...');

    const oauth2 = google.oauth2({
      auth: oAuth2Client,
      version: 'v2',
    });

    const userinfo = await oauth2.userinfo.get();

    const googleEmail =
      userinfo &&
      userinfo.data &&
      userinfo.data.email
        ? userinfo.data.email
        : null;

    console.log('✅ Google account:', googleEmail);

    // -------------------------------------------------
    // Get user ID from OAuth state
    // -------------------------------------------------

    const userId = payload.userId;

    if (!userId) {
      console.error('❌ User ID missing from OAuth state');

      return res.redirect(
        `${FRONTEND_URL}/settings?gmail=error`
      );
    }

    console.log('Application user ID:', userId);

    // -------------------------------------------------
    // Convert user ID to MongoDB ObjectId
    // -------------------------------------------------

    let userObjectId;

    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (err) {
      console.error('❌ Invalid MongoDB user ID:', userId);

      return res.redirect(
        `${FRONTEND_URL}/settings?gmail=error`
      );
    }

    // -------------------------------------------------
    // Find existing Gmail connection
    // -------------------------------------------------

    const existing = await GmailConnection.findOne({
      userId: userObjectId,
    });

    console.log(
      existing
        ? 'ℹ️ Existing Gmail connection found'
        : 'ℹ️ No existing Gmail connection found'
    );

    // -------------------------------------------------
    // IMPORTANT:
    // Calculate grantedScopes BEFORE using it
    // -------------------------------------------------

    const grantedScopes =
      tokens.scope ||
      (existing && existing.scope) ||
      '';

    console.log('');
    console.log('========== GMAIL OAUTH DETAILS ==========');
    console.log('Google email:', googleEmail);

    console.log('Tokens received:', {
      access_token: Boolean(tokens.access_token),
      refresh_token: Boolean(tokens.refresh_token),
      expiry_date: tokens.expiry_date,
    });

    console.log('Granted scopes:', grantedScopes);

    console.log(
      'Required scopes:',
      REQUIRED_GMAIL_SCOPES
    );

    console.log(
      'Scopes valid:',
      hasRequiredGmailScopes(grantedScopes)
    );

    console.log('=========================================');
    console.log('');

    // -------------------------------------------------
    // Prepare database document
    // -------------------------------------------------

    const now = new Date();

    const toSet = {
      userId: userObjectId,

      googleEmail:
        googleEmail ||
        (existing && existing.googleEmail) ||
        null,

      accessToken:
        tokens.access_token ||
        (existing && existing.accessToken) ||
        null,

      refreshToken:
        tokens.refresh_token ||
        (existing && existing.refreshToken) ||
        null,

      tokenExpiry:
        tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : existing && existing.tokenExpiry
            ? existing.tokenExpiry
            : null,

      scope: grantedScopes,

      connectedAt:
        existing && existing.connectedAt
          ? existing.connectedAt
          : now,
    };

    // -------------------------------------------------
    // Save Gmail connection
    // -------------------------------------------------

    console.log('🔄 Saving Gmail connection to MongoDB...');

    const savedConnection =
      await GmailConnection.findOneAndUpdate(
        { userId: userObjectId },
        { $set: toSet },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

    console.log('');
    console.log('🔥 GMAIL CONNECTION SAVED');
    console.log({
      id: savedConnection._id.toString(),
      userId: savedConnection.userId.toString(),
      googleEmail: savedConnection.googleEmail,
      hasAccessToken: Boolean(
        savedConnection.accessToken
      ),
      hasRefreshToken: Boolean(
        savedConnection.refreshToken
      ),
      scope: savedConnection.scope,
      connectedAt: savedConnection.connectedAt,
    });
    console.log('');

    // -------------------------------------------------
    // Verify what was actually saved
    // -------------------------------------------------

    const verifyConnection =
      await GmailConnection.findOne({
        userId: userObjectId,
      });

    console.log('========== DATABASE VERIFICATION ==========');

    if (!verifyConnection) {
      console.error(
        '❌ ERROR: Gmail connection was NOT found after saving!'
      );

      return res.redirect(
        `${FRONTEND_URL}/settings?gmail=error`
      );
    }

    console.log('✅ Gmail connection exists in MongoDB');
    console.log('Google email:', verifyConnection.googleEmail);
    console.log(
      'Has refresh token:',
      Boolean(verifyConnection.refreshToken)
    );
    console.log('Scope:', verifyConnection.scope);
    console.log('===========================================');

    // -------------------------------------------------
    // Check scopes
    // -------------------------------------------------

    const scopesValid =
      hasRequiredGmailScopes(
        verifyConnection.scope || ''
      );

    if (!verifyConnection.refreshToken) {
      console.error(
        '❌ Gmail connected but refresh token is missing'
      );

      return res.redirect(
        `${FRONTEND_URL}/settings?gmail=needs_reconnect`
      );
    }

    if (!scopesValid) {
      console.error(
        '❌ Required Gmail scopes are missing'
      );

      return res.redirect(
        `${FRONTEND_URL}/settings?gmail=needs_reconnect`
      );
    }

    // -------------------------------------------------
    // SUCCESS
    // -------------------------------------------------

    console.log('');
    console.log('🎉 GMAIL CONNECTION SUCCESSFUL');
    console.log('');

    return res.redirect(
      `${FRONTEND_URL}/settings?gmail=connected`
    );

  } catch (error) {

    console.error('');
    console.error('==========================================');
    console.error('❌ GMAIL OAUTH CALLBACK ERROR');
    console.error('==========================================');
    console.error('Message:', error.message);
    console.error('Name:', error.name);
    console.error('Stack:', error.stack);
    console.error('==========================================');
    console.error('');

    return res.redirect(
      `${FRONTEND_URL}/settings?gmail=error`
    );
  }
};

// =====================================================
// GMAIL STATUS
// =====================================================

const status = async (req, res) => {
  try {

    if (!req.user) {
      console.error(
        '❌ Gmail status: user not authenticated'
      );

      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    console.log('');
    console.log('===== GMAIL STATUS CHECK =====');
    console.log(
      'User ID:',
      req.user._id.toString()
    );

    const conn = await GmailConnection.findOne({
      userId: req.user._id,
    });

    // -------------------------------------------------
    // No Gmail connection
    // -------------------------------------------------

    if (!conn) {

      console.log(
        '❌ No GmailConnection document found'
      );

      console.log(
        '=============================='
      );

      return res.json({
        success: true,
        connected: false,
        needsReconnect: false,
      });
    }

    // -------------------------------------------------
    // Check scopes/token
    // -------------------------------------------------

    const scopeGranted = conn.scope || '';

    const needsReconnect =
      !conn.refreshToken ||
      !hasRequiredGmailScopes(scopeGranted);

    const connected =
      Boolean(conn.refreshToken) &&
      !needsReconnect;

    console.log('Gmail connection found:', {
      googleEmail: conn.googleEmail,
      hasRefreshToken: Boolean(
        conn.refreshToken
      ),
      scope: scopeGranted,
      needsReconnect,
      connected,
    });

    console.log(
      '=============================='
    );

    return res.json({
      success: true,

      connected,

      needsReconnect,

      googleEmail: conn.googleEmail,

      connectedAt: conn.connectedAt,

      lastSyncedAt: conn.lastSyncedAt,

      hasRefreshToken:
        Boolean(conn.refreshToken),

      scope: scopeGranted,

      status:
        needsReconnect
          ? 'needs_reconnect'
          : 'connected',

      message:
        needsReconnect
          ? 'Your Gmail permission needs to be renewed. Reconnect Gmail.'
          : 'Connected',
    });

  } catch (error) {

    console.error(
      '❌ Gmail status error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch status',
    });
  }
};

// =====================================================
// DISCONNECT GMAIL
// =====================================================

const gmailDisconnect = async (req, res) => {
  try {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    console.log('');
    console.log('===== GMAIL DISCONNECT =====');

    const conn = await GmailConnection.findOne({
      userId: req.user._id,
    });

    if (!conn) {

      console.log(
        'No Gmail connection found'
      );

      return res.json({
        success: true,
        message: 'Gmail disconnected successfully',
      });
    }

    // -------------------------------------------------
    // Attempt to revoke Google token
    // -------------------------------------------------

    try {

      const oAuth2Client =
        createOAuthClient();

      if (conn.refreshToken) {

        await oAuth2Client.revokeToken(
          conn.refreshToken
        );

        console.log(
          '✅ Gmail refresh token revoked'
        );

      } else if (conn.accessToken) {

        await oAuth2Client.revokeToken(
          conn.accessToken
        );

        console.log(
          '✅ Gmail access token revoked'
        );
      }

    } catch (error) {

      console.warn(
        '⚠️ Could not revoke Google token:',
        error.message
      );

      // Continue deleting local connection
    }

    // -------------------------------------------------
    // Delete MongoDB connection
    // -------------------------------------------------

    await GmailConnection.deleteOne({
      userId: req.user._id,
    });

    console.log(
      '✅ Gmail connection deleted from MongoDB'
    );

    console.log(
      '============================'
    );

    return res.json({
      success: true,
      message: 'Gmail disconnected successfully',
    });

  } catch (error) {

    console.error(
      '❌ Gmail disconnect error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to disconnect',
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  getAuthUrl,
  oauthCallback,
  status,
  gmailDisconnect,
};