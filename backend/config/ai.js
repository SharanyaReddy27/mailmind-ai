// backend/config/ai.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = "gemini-2.0-flash";
const BLOCKED_MODELS = new Set(["gemini-2.5-flash", "gemini-3.5-flash"]);
const configuredModel = process.env.GEMINI_MODEL;
const MODEL_NAME =
  configuredModel && !BLOCKED_MODELS.has(configuredModel)
    ? configuredModel
    : DEFAULT_MODEL;

if (configuredModel && configuredModel !== MODEL_NAME) {
  console.warn(
    `[config/ai] GEMINI_MODEL value "${configuredModel}" is unsupported; falling back to ${MODEL_NAME}`
  );
}

if (!API_KEY) {
  console.warn(
    "[config/ai] GEMINI_API_KEY is not set. Add it to backend/.env."
  );
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const getAIModel = () => {
  if (!genAI) {
    const error = new Error(
      "AI service is not configured. Add GEMINI_API_KEY to backend/.env."
    );

    error.status = 503;
    throw error;
  }

  return genAI.getGenerativeModel({
    model: MODEL_NAME,
  });
};

module.exports = {
  getAIModel,
  MODEL_NAME,
};