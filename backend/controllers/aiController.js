const {
  summarizeEmail: generateAISummary,
  generateEmailReply,
  extractEmailTasks,
} = require("../services/aiService");

const normalizeWhitespace = (value = "") =>
  value.replace(/\s+/g, " ").trim();

const getSentenceChunks = (value = "") => {
  return value
    .split(/[.!?\n]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
};

const summarizeEmail = async (req, res) => {
  try {
    const { subject = "", body } = req.body || {};

    const cleanSubject =
      typeof subject === "string" ? subject.trim() : "";

    const cleanBody =
      typeof body === "string" ? body.trim() : "";

    if (!cleanBody) {
      return res.status(400).json({
        success: false,
        message: "Email body is required",
      });
    }

    const summary = await generateAISummary(cleanSubject, cleanBody);

    return res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Gemini summarization error:", error);

    const statusCode =
      Number.isInteger(error?.status) && error.status >= 400
        ? error.status
        : 500;

    return res.status(statusCode).json({
      success: false,
      message:
        error?.message ||
        "Failed to generate email summary",
    });
  }
};

const generateReply = async (req, res) => {
  try {
    const {
      subject = "",
      body,
      senderName = "",
      tone = "professional",
    } = req.body;

    if (typeof body !== "string" || !body.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email body is required",
      });
    }

    const reply = await generateEmailReply({
      subject,
      body,
      senderName,
      tone,
    });

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error(
      "AI reply generation error:",
      error?.message
    );

    const statusCode = error?.status || 500;

    let message =
      error?.message || "Failed to generate email reply";

    if (statusCode >= 500 && statusCode !== 503) {
      message =
        "Something went wrong while generating the reply. Please try again.";
    }

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

const extractTasks = async (req, res) => {
  try {
    const { body } = req.body;

    if (!body || !body.trim()) {
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
    console.error("Task extraction controller error:", error);

    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 500
          ? "Failed to extract tasks from email"
          : error.message,
    });
  }
};

module.exports = {
  summarizeEmail,
  generateReply,
  extractTasks,
};