// backend/services/aiService.js
//
// Contains Gemini prompt-building and model-calling logic.

const { getAIModel } = require("../config/ai");

const SUMMARY_GENERATION_CONFIG = {
  temperature: 0.1,
  maxOutputTokens: 700,
};

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

/**
 * Builds a detailed but concise email-summary prompt.
 */
const buildSummaryPrompt = (subject, body) => {
  const cleanSubject =
    typeof subject === "string" && subject.trim()
      ? subject.trim()
      : "No subject";

  const cleanBody =
    typeof body === "string" && body.trim()
      ? body.trim()
      : "No email content provided";

  return `
Summarize the following email for the recipient.

SUBJECT:
${cleanSubject}

EMAIL CONTENT:
${cleanBody}

Return only 2 to 5 useful bullet points.

Rules:
- Start each point with •
- State the actual purpose of the email.
- Include every important action the recipient must complete.
- Include relevant names, dates, deadlines and links.
- Ignore greetings, signatures, tracking links and legal footer text.
- Do not write a heading.
- Do not write "Analyze the Email".
- Do not write "Bullet 1", "Purpose" or repeat these instructions.
- Do not invent information.
`;
};
/**
 * Checks whether Gemini returned a temporary server error.
 */
const isTemporaryGeminiError = (error) => {
  const message = String(error?.message || "").toLowerCase();

  return (
    message.includes("503") ||
    message.includes("service unavailable") ||
    message.includes("high demand") ||
    message.includes("temporarily unavailable") ||
    message.includes("overloaded")
  );
};

/**
 * Sends the email to Gemini and returns the generated summary.
 * Retries temporary 503/high-demand errors automatically.
 */
const summarizeEmail = async (subject, body) => {
  const model = getAIModel();
  const prompt = buildSummaryPrompt(subject, body);

  const maximumAttempts = 3;

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: SUMMARY_GENERATION_CONFIG,
      });
      const response = await result.response;
      const text = response.text()?.trim();

      const finishReason = response?.candidates?.[0]?.finishReason;

      console.log("Gemini finish reason:", finishReason);
      console.log("Generated summary:", text);

      if (!text || text.length < 20) {
        const error = new Error(
        "Gemini returned an incomplete summary. Please try again."
      );

      error.status = 502;
      throw error;
    }

      return text.trim();
    } catch (error) {
      const temporaryError = isTemporaryGeminiError(error);

      if (!temporaryError) {
        throw error;
      }

      if (attempt === maximumAttempts) {
        const busyError = new Error(
          "Gemini is currently busy. Please wait a moment and try again."
        );

        busyError.status = 503;
        throw busyError;
      }

      const delay = 2000 * attempt;

      console.warn(
        `Gemini is temporarily unavailable. Retrying in ${delay / 1000} seconds...`
      );

      await wait(delay);
    }
  }

  const error = new Error(
    "Gemini is currently busy. Please try again shortly."
  );

  error.status = 503;
  throw error;
};

module.exports = {
  summarizeEmail,
  buildSummaryPrompt,
};