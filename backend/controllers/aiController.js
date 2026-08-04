const mongoose = require("mongoose");
const Email = require("../models/Email");
const {
  summarizeEmail: generateAISummary,
  generateEmailReply,
  extractEmailTasks,
} = require("../services/aiService");

const ALLOWED_REPLY_TONES = [
  "professional",
  "friendly",
  "concise",
];

// Best-effort persistence of an AI result against the source email so the
// dashboard can show real recent activity. Silently no-ops if emailId is
// missing/invalid or doesn't belong to the requesting user - AI results are
// still returned to the caller either way.
const persistAiResult = async (req, emailId, update) => {
  if (!emailId || !mongoose.Types.ObjectId.isValid(emailId) || !req.user) {
    return;
  }

  try {
    await Email.findOneAndUpdate(
      { _id: emailId, userId: req.user._id },
      update
    );
  } catch (error) {
    console.error("Failed to persist AI result:", error.message);
  }
};

const sendControllerError = (res, error, fallbackMessage) => {
  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || fallbackMessage;

  console.error("[controller error]", {
    fallbackMessage,
    statusCode,
    message,
  });

  return res.status(statusCode).json({
    success: false,
    message,
  });
};

const summarizeEmail = async (req, res) => {
  try {
    console.log("======== SUMMARY REQUEST ========");
    console.log("[controller] summarize payload", req.body);
    const { subject = "", body, emailId } = req.body || {};

    const cleanSubject =
      typeof subject === "string"
        ? subject.trim()
        : "";

    const cleanBody =
      typeof body === "string"
        ? body.trim()
        : "";

    if (!cleanBody) {
      return res.status(400).json({
        success: false,
        message: "Email body is required",
      });
    }

    console.log("======== CONTROLLER ========");
    const summary = await generateAISummary(
      cleanSubject,
      cleanBody
    );

    console.log("======== DATABASE SAVE ========");
    await persistAiResult(req, emailId, {
      aiSummary: summary,
      aiSummaryAt: new Date(),
    });

    console.log("======== RESPONSE SENT ========");
    return res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error(
      "Summarization controller error:",
      error.message
    );

    return sendControllerError(
      res,
      error,
      "Failed to summarize email"
    );
  }
};

const generateReply = async (req, res) => {
  try {
    console.log("======== REPLY REQUEST ========");
    console.log("[controller] reply payload", req.body);
    const {
      subject = "",
      body,
      senderName = "",
      tone = "professional",
      emailId,
    } = req.body || {};

    if (typeof body !== "string" || !body.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email body is required",
      });
    }

    const normalizedTone =
      typeof tone === "string"
        ? tone.trim().toLowerCase()
        : "professional";

    if (
      !ALLOWED_REPLY_TONES.includes(normalizedTone)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Tone must be professional, friendly or concise",
      });
    }

    console.log("======== CONTROLLER ========");
    const reply = await generateEmailReply({
      subject,
      body,
      senderName,
      tone: normalizedTone,
    });

    console.log("======== DATABASE SAVE ========");
    await persistAiResult(req, emailId, {
      aiReply: reply,
      aiReplyTone: normalizedTone,
      aiReplyAt: new Date(),
    });

    console.log("======== RESPONSE SENT ========");
    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error(
      "Reply controller error:",
      error.message
    );

    return sendControllerError(
      res,
      error,
      "Failed to generate email reply"
    );
  }
};

const extractTasks = async (req, res) => {
  try {
    console.log("======== TASKS REQUEST ========");
    console.log("[controller] tasks payload", req.body);
    const { body, emailId } = req.body || {};

    if (typeof body !== "string" || !body.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email body is required",
      });
    }

    console.log("======== CONTROLLER ========");
    const tasks = await extractEmailTasks(body);

    console.log("======== DATABASE SAVE ========");
    await persistAiResult(req, emailId, {
      aiTasks: tasks,
      aiTasksAt: new Date(),
    });

    console.log("======== RESPONSE SENT ========");
    return res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error(
      "Task extraction controller error:",
      error.message
    );

    return sendControllerError(
      res,
      error,
      "Failed to extract tasks from email"
    );
  }
};

module.exports = {
  summarizeEmail,
  generateReply,
  extractTasks,
};