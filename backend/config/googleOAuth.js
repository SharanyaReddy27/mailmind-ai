const { google } = require('googleapis');

const REQUIRED_GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
];

const parseGrantedScopes = (scopeValue) => {
  if (!scopeValue || typeof scopeValue !== 'string') {
    return [];
  }

  return scopeValue
    .split(' ')
    .map((scope) => scope.trim())
    .filter(Boolean);
};

const hasRequiredGmailScopes = (scopeValue) => {
  const grantedScopes = new Set(parseGrantedScopes(scopeValue));
  return REQUIRED_GMAIL_SCOPES.every((scope) => grantedScopes.has(scope));
};

function createOAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    // do not throw secret values
    throw new Error('Google OAuth configuration missing');
  }

  const client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  return client;
}

module.exports = {
  createOAuthClient,
  REQUIRED_GMAIL_SCOPES,
  parseGrantedScopes,
  hasRequiredGmailScopes,
};
