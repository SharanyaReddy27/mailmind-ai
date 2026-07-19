const normalizeWhitespace = (value = "") => value.replace(/\s+/g, " ").trim();

const getSentenceChunks = (value = "") => {
  return value
    .split(/[.!?\n]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
};

const summarizeEmail = async (req, res) => {
  try {
    const { body } = req.body || {};
    const cleanBody = typeof body === "string" ? body.trim() : "";

    if (!cleanBody) {
      return res.status(400).json({
        success: false,
        message: "Email body is required",
      });
    }

    const cleanedText = normalizeWhitespace(cleanBody);
    const sentences = getSentenceChunks(cleanedText);
    const summarySource = sentences.slice(0, 2).join(" ");
    const summary = normalizeWhitespace(
      summarySource.length > 180
        ? `${summarySource.slice(0, 177)}...`
        : summarySource
    );

    res.status(200).json({
      success: true,
      summary: summary || `Email about: ${cleanedText.slice(0, 120)}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to process email",
    });
  }
};

const generateReply = async (req, res) => {
  try {
    const { subject = "", sender = "", body } = req.body || {};
    const cleanBody = typeof body === "string" ? body.trim() : "";

    if (!cleanBody) {
      return res.status(400).json({
        success: false,
        message: "Email body is required",
      });
    }

    const senderName = typeof sender === "string" && sender.trim()
      ? sender.trim().split("@")[0]
      : "there";
    const subjectText = typeof subject === "string" && subject.trim()
      ? ` regarding "${subject.trim()}"`
      : "";

    const reply = [
      `Hi ${senderName},`,
      "",
      `Thank you for your message${subjectText}. I appreciate the update and will review the details carefully.`,
      "",
      "Best regards",
    ].join("\n");

    res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to process email",
    });
  }
};

const extractTasks = async (req, res) => {
  try {
    const { body } = req.body || {};
    const cleanBody = typeof body === "string" ? body.trim() : "";

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
        return actionWords.some((word) => new RegExp(`\\b${word}\\b`).test(lowerSentence));
      })
      .map((sentence) => {
        const normalized = normalizeWhitespace(sentence.replace(/[.!,;:]+$/g, ""));
        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
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

    res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to process email",
    });
  }
};

module.exports = {
  summarizeEmail,
  generateReply,
  extractTasks,
};
