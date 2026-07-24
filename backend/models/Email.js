const mongoose = require("mongoose");

const emailSchema = new mongoose.Schema(
  {
    senderName: {
      type: String,
      required: true,
      trim: true,
    },

    senderEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    snippet: {
      type: String,
      default: "",
    },

    body: {
      type: String,
      default: "",
    },

    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },

    unread: {
      type: Boolean,
      default: true,
    },

    receivedAt: {
      type: Date,
      default: Date.now,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    source: {
      type: String,
      enum: ['manual', 'gmail'],
      default: 'manual',
    },
    externalMessageId: {
      type: String,
      index: true,
    },
    externalThreadId: {
      type: String,
      index: true,
    },
    gmailLabels: {
      type: [String],
      default: [],
    },

    // Persisted results of the last AI action run against this email, so
    // the dashboard can surface real "recent AI activity" instead of
    // fabricated numbers. All optional/nullable.
    aiSummary: {
      type: String,
      default: null,
    },
    aiSummaryAt: {
      type: Date,
      default: null,
    },
    aiReply: {
      type: String,
      default: null,
    },
    aiReplyTone: {
      type: String,
      default: null,
    },
    aiReplyAt: {
      type: Date,
      default: null,
    },
    aiTasks: {
      type: [
        {
          title: String,
          deadline: String,
          priority: String,
        },
      ],
      default: [],
    },
    aiTasksAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Email = mongoose.model("Email", emailSchema);

// compound unique index to prevent duplicate Gmail messages per user
emailSchema.index({ userId: 1, source: 1, externalMessageId: 1 }, { unique: true, sparse: true });

module.exports = Email;