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

const sendControllerError = (res, error, fallbackMessage) => {
  const statusCode =
    error.statusCode || error.status || 500;

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? fallbackMessage
        : error.message,
  });
};

const summarizeEmail = async (req, res) => {
  try {
    const { subject = "", body } = req.body || {};

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

    const summary = await generateAISummary(
      cleanSubject,
      cleanBody
    );

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
    const {
      subject = "",
      body,
      senderName = "",
      tone = "professional",
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

    const reply = await generateEmailReply({
      subject,
      body,
      senderName,
      tone: normalizedTone,
    });

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
    const { body } = req.body || {};

    if (typeof body !== "string" || !body.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email body is required",
      });
    }

    const tasks = await extractEmailTasks(body);

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