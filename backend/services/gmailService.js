const { google } = require('googleapis');
const GmailConnection = require('../models/GmailConnection');
const Email = require('../models/Email');
const { createOAuthClient, hasRequiredGmailScopes } = require('../config/googleOAuth');

function decodeBase64Url(str) {
  if (!str) return '';
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
  if (payload.body && payload.body.data) return decodeBase64Url(payload.body.data);

  if (!payload.parts) return '';
  const stack = [...payload.parts];
  let html = '';
  while (stack.length) {
    const part = stack.shift();
    if (part.parts) stack.push(...part.parts);
    if (part.mimeType === 'text/plain' && part.body && part.body.data) return decodeBase64Url(part.body.data);
    if (part.mimeType === 'text/html' && part.body && part.body.data) html = decodeBase64Url(part.body.data);
  }
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const isInvalidGrantError = (error) => {
  const message = String(
    error?.message ||
    error?.errors?.[0]?.message ||
    error?.response?.data?.error_description ||
    error?.response?.data?.error ||
    ''
  ).toLowerCase();

  return (
    message.includes('invalid_grant') ||
    message.includes('invalid grant') ||
    message.includes('invalid refresh token') ||
    message.includes('expired credentials') ||
    message.includes('unauthorized')
  );
};

const createInvalidGmailTokenError = () => {
  const error = new Error(
    'Your Gmail permission needs to be renewed. Reconnect Gmail.'
  );
  error.code = 'INVALID_GMAIL_TOKEN';
  error.status = 401;
  return error;
};

async function syncGmailForUser(user, limit = 20, pageToken = null) {
  console.log('======== SYNC REQUEST ========', { userId: user?._id?.toString(), limit, pageToken: pageToken ? '(provided)' : null });
  const conn = await GmailConnection.findOne({ userId: user._id });
  if (!conn) {
    const e = new Error('No connection');
    e.code = 'NO_CONNECTION';
    throw e;
  }

  if (!conn.refreshToken || !hasRequiredGmailScopes(conn.scope || '')) {
    const e = createInvalidGmailTokenError();
    e.code = 'INVALID_GMAIL_TOKEN';
    throw e;
  }

  const oAuth2Client = createOAuthClient();
  oAuth2Client.setCredentials({
    refresh_token: conn.refreshToken,
    access_token: conn.accessToken,
  });

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  try {
    const tokens = await oAuth2Client.getAccessToken();
    if (tokens && tokens.token) {
      conn.accessToken = tokens.token;
      conn.tokenExpiry = tokens.res ? tokens.res.data.expiry_date : conn.tokenExpiry;
      await conn.save();
    }
  } catch (e) {
    console.warn('Token refresh warning:', e.message);
    if (isInvalidGrantError(e)) {
      throw createInvalidGmailTokenError();
    }
  }

  let listRes;
  try {
    const listParams = { userId: 'me', maxResults: limit };
    if (pageToken) {
      listParams.pageToken = pageToken;
    }
    listRes = await gmail.users.messages.list(listParams);
  } catch (err) {
    console.error('Gmail list messages failed:', err.message);
    if (isInvalidGrantError(err)) {
      throw createInvalidGmailTokenError();
    }
    const e = new Error(err.message || 'Unable to fetch Gmail messages');
    e.original = err;
    throw e;
  }

  const messages = (listRes && listRes.data && listRes.data.messages) || [];
  const nextPageToken = (listRes && listRes.data && listRes.data.nextPageToken) || null;
  let created = 0, skipped = 0, failed = 0;

  for (const m of messages) {
    try {
      const msgRes = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
      const gm = msgRes.data;
      if (!gm) { failed++; continue; }

      const headers = parseHeaders(gm.payload && gm.payload.headers);
      const from = headers['from'] || '';
      const subject = headers['subject'] || '(no subject)';
      const date = headers['date'] ? new Date(headers['date']) : (gm.internalDate ? new Date(parseInt(gm.internalDate, 10)) : new Date());
      const labelIds = Array.isArray(gm.labelIds) ? gm.labelIds : [];
      const isImportant = labelIds.includes('IMPORTANT') || /importance.*high|priority.*high/i.test(headers.importance || '');
      const bodyText = extractBody(gm.payload) || '';
      const hasAttachments = Boolean(
        (gm.payload && gm.payload.parts && gm.payload.parts.some((part) => part.filename && part.filename.trim())) ||
        /\b(?:pdf|docx?|pptx?|xlsx?|zip|rar|png|jpg|jpeg|gif)\b/i.test(bodyText)
      );

      const isUnread = labelIds.includes('UNREAD');

      const emailDoc = {
        userId: user._id,
        source: 'gmail',
        externalMessageId: gm.id,
        externalThreadId: gm.threadId,
        gmailLabels: labelIds,
        snippet: gm.snippet || '',
        receivedAt: date,
        subject,
        body: bodyText,
        hasAttachments,
        unread: isUnread,
        priority: isImportant ? 'High' : (String(headers.importance || '').toLowerCase() === 'low' ? 'Low' : 'Medium'),
      };

      const match = from.match(/(.*)<(.+@.+)>/);
      if (match) {
        emailDoc.senderName = match[1].trim().replace(/\"/g, '');
        emailDoc.senderEmail = match[2].trim();
      } else {
        emailDoc.senderName = from;
        emailDoc.senderEmail = '';
      }

      try {
        const existing = await Email.findOne({
          userId: user._id,
          source: 'gmail',
          externalMessageId: gm.id,
        });

        if (existing) {
          existing.unread = isUnread;
          existing.gmailLabels = labelIds;
          await existing.save();
          skipped++;
        } else {
          await Email.create(emailDoc);
          created++;
        }
      } catch (err) {
        skipped++;
        console.warn('Skipping duplicate or invalid Gmail message:', err.message);
        continue;
      }
    } catch (err) {
      failed++;
      console.warn('Failed to process Gmail message:', err.message);
      continue;
    }
  }

  conn.lastSyncedAt = new Date();
  await conn.save();
  console.log('======== SYNC RESPONSE ========', { fetched: messages.length, created, skipped, failed, hasNextPage: Boolean(nextPageToken) });

  return { message: 'Gmail synchronization completed', fetched: messages.length, created, skipped, failed, lastSyncedAt: conn.lastSyncedAt, nextPageToken };
}

module.exports = { syncGmailForUser };
