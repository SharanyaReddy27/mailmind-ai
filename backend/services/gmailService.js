const { google } = require('googleapis');
const GmailConnection = require('../models/GmailConnection');
const Email = require('../models/Email');
const { createOAuthClient } = require('../config/googleOAuth');

const connectGmail = async (req, res) => {
  try {
    const oauth2Client = createOAuthClient();

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/gmail.modify'
      ]
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Gmail connect error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

function decodeBase64Url(str) {
  if (!str) return '';
  // base64url to base64
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

function parseHeaders(headers) {
  const map = {};
  (headers || []).forEach((h) => {
    map[h.name.toLowerCase()] = h.value;
  });
  return map;
}

function extractBody(payload) {
  if (!payload) return '';
  // if body is directly in payload
  if (payload.body && payload.body.data) return decodeBase64Url(payload.body.data);

  if (!payload.parts) return '';
  // recursive search: prefer text/plain
  const stack = [...payload.parts];
  let html = '';
  while (stack.length) {
    const part = stack.shift();
    if (part.parts) stack.push(...part.parts);
    if (part.mimeType === 'text/plain' && part.body && part.body.data) return decodeBase64Url(part.body.data);
    if (part.mimeType === 'text/html' && part.body && part.body.data) html = decodeBase64Url(part.body.data);
  }
  // fallback to html converted to text (strip tags)
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function syncGmailForUser(user, limit = 20) {
  const conn = await GmailConnection.findOne({ userId: user._id });
  if (!conn) {
    const e = new Error('No connection');
    e.code = 'NO_CONNECTION';
    throw e;
  }

  const oAuth2Client = createOAuthClient();
  oAuth2Client.setCredentials({
    refresh_token: conn.refreshToken,
    access_token: conn.accessToken,
  });

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  // ensure token is refreshed if needed
  try {
    const tokens = await oAuth2Client.getAccessToken();
    if (tokens && tokens.token) {
      conn.accessToken = tokens.token;
      // expiry not provided reliably here
      await conn.save();
    }
  } catch (e) {
    // ignore refresh errors here; will surface on message fetch
  }

  // list messages
  const listRes = await gmail.users.messages.list({ userId: 'me', maxResults: limit });
  const messages = (listRes && listRes.data && listRes.data.messages) || [];
  let created = 0, skipped = 0, failed = 0;

  for (const m of messages) {
    try {
      const msgRes = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
      const gm = msgRes.data;
      if (!gm) { failed++; continue; }

      const headers = parseHeaders(gm.payload && gm.payload.headers);
      const from = headers['from'] || '';
      const to = headers['to'] || '';
      const subject = headers['subject'] || '(no subject)';
      const date = headers['date'] ? new Date(headers['date']) : (gm.internalDate ? new Date(parseInt(gm.internalDate, 10)) : new Date());
      const messageId = headers['message-id'] || gm.id;

      // prepare email doc
      const emailDoc = {
        userId: user._id,
        source: 'gmail',
        externalMessageId: gm.id,
        externalThreadId: gm.threadId,
        gmailLabels: gm.labelIds || [],
        snippet: gm.snippet || '',
        receivedAt: date,
        subject,
        body: extractBody(gm.payload) || '',
      };

      // parse sender name/email roughly
      const match = from.match(/(.*)<(.+@.+)>/);
      if (match) {
        emailDoc.senderName = match[1].trim().replace(/\"/g, '');
        emailDoc.senderEmail = match[2].trim();
      } else {
        emailDoc.senderName = from;
        emailDoc.senderEmail = '';
      }

      // try insert, skip duplicates
      try {
        await Email.create(emailDoc);
        created++;
      } catch (err) {
        // duplicate key or other
        skipped++;
        continue;
      }
    } catch (err) {
      failed++;
      continue;
    }
  }

  conn.lastSyncedAt = new Date();
  await conn.save();

  return { message: 'Gmail synchronization completed', fetched: messages.length, created, skipped, failed, lastSyncedAt: conn.lastSyncedAt };
}

module.exports = { syncGmailForUser };
