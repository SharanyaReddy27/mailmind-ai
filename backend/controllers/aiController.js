const {
  summarizeEmail: generateAISummary,
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
    const { subject = "", sender = "", body } = req.body || {};

    const cleanBody =
      typeof body === "string" ? body.trim() : "";

    if (!cleanBody) {
      return res.status(400).json({
        success: false,
        message: "Email body is required",
      });
    }

    const senderName =
      typeof sender === "string" && sender.trim()
        ? sender.trim().split("@")[0]
        : "there";

    const subjectText =
      typeof subject === "string" && subject.trim()
        ? ` regarding "${subject.trim()}"`
        : "";

    const reply = [
      `Hi ${senderName},`,
      "",
      `Thank you for your message${subjectText}. I appreciate the update and will review the details carefully.`,
      "",
      "Best regards",
    ].join("\n");

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("Reply generation error:", error);

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to generate reply",
    });
  }
};

const extractTasks = async (req, res) => {
  try {
    const { body } = req.body || {};

    const cleanBody =
      typeof body === "string" ? body.trim() : "";

    if (!cleanBody) {
      return res.status(400).json({
        success: false,
        message: "Email body is required",
      });
    }

    const actionWords = [
      "submit",
      "complete",
      "send",
      "attend",
      "review",
      "prepare",
      "update",
      "call",
      "schedule",
      "share",
      "finish",
      "reply",
    ];

    const taskSentences = getSentenceChunks(cleanBody)
      .flatMap((sentence) => sentence.split(/\s*\n\s*/))
      .map((entry) => entry.trim())
      .filter(Boolean);

    const seenTasks = new Set();

    const tasks = taskSentences
      .filter((sentence) => {
        const lowerSentence = sentence.toLowerCase();

        return actionWords.some((word) =>
          new RegExp(`\\b${word}\\b`).test(lowerSentence)
        );
      })
      .map((sentence) => {
        const normalized = normalizeWhitespace(
          sentence.replace(/[.!,;:]+$/g, "")
        );

        return (
          normalized.charAt(0).toUpperCase() +
          normalized.slice(1)
        );
      })
      .filter((taskTitle) => {
        const key = taskTitle.toLowerCase();

        if (seenTasks.has(key)) {
          return false;
        }

        seenTasks.add(key);
        return true;
      })
      .map((title) => ({
        title,
        completed: false,
      }));

    return res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("Task extraction error:", error);

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to extract tasks",
    });
  }
};

module.exports = {
  summarizeEmail,
  generateReply,
  extractTasks,
};