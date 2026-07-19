// backend/config/ai.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.5-flash";

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