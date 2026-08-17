// backend/config/ai.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = "gemini-2.0-flash";
const SUPPORTED_MODELS = new Set([
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
]);
const configuredModel = process.env.GEMINI_MODEL;

if (configuredModel && !SUPPORTED_MODELS.has(configuredModel)) {
  throw new Error(
    `[config/ai] GEMINI_MODEL value "${configuredModel}" is unsupported by the installed @google/generative-ai SDK. Use one of: ${Array.from(SUPPORTED_MODELS).join(", ")}.`
  );
}

const MODEL_NAME = configuredModel || DEFAULT_MODEL;

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
  SUPPORTED_MODELS,
};