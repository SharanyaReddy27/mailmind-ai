const { google } = require('googleapis');

function createOAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    // do not throw secret values
    throw new Error('Google OAuth configuration missing');
  }
  console.log("Google Client ID loaded:", Boolean(process.env.GOOGLE_CLIENT_ID));
  console.log(
    "Google Client ID ending:",
    process.env.GOOGLE_CLIENT_ID?.slice(-30)
  );
  const client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  return client;
}

module.exports = { createOAuthClient };
