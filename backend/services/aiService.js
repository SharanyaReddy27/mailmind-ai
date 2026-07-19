// backend/services/aiService.js
//
// Contains Gemini prompt-building and model-calling logic.

const { getAIModel } = require("../config/ai");

const SUMMARY_GENERATION_CONFIG = {
  temperature: 0.1,
  maxOutputTokens: 500,
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
      : "(no subject)";

  const cleanBody =
    typeof body === "string"
      ? body.trim()
      : "";

  return `You are an accurate email summarization assistant.

Read the email carefully and summarize only the information actually present.

Email subject:
${cleanSubject}

Email body:
${cleanBody}

Instructions:
- Preserve the exact meaning of the email.
- Do not add assumptions or invented information.
- Mention the main purpose of the email.
- Mention all important actions the recipient must take.
- Mention dates, deadlines, meeting times and locations exactly when present.
- Mention important names, organizations and links when present.
- Mention warnings, account alerts or security information when present.
- Ignore unnecessary greetings, signatures, advertisements and repeated text.
- Use 2 to 5 bullet points when the email contains enough information.
- For a very short email, use 1 clear bullet point.
- Each bullet should be a complete and understandable sentence.
- Do not make the summary so short that important details are lost.
- Do not include headings, introductions or closing remarks.
- Each bullet must begin with "•".
- Return only the bullet points.`;
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
      const text = response.text();

      if (!text || !text.trim()) {
        const error = new Error(
          "AI returned an empty summary. Please try again."
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