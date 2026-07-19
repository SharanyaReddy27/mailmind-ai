const mongoose = require('mongoose');

const gmailConnectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    googleEmail: { type: String, required: true, lowercase: true, trim: true },
    accessToken: { type: String },
    refreshToken: { type: String },
    tokenExpiry: { type: Date },
    scope: { type: String },
    connectedAt: { type: Date },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

const GmailConnection = mongoose.model('GmailConnection', gmailConnectionSchema);

module.exports = GmailConnection;
