// backend/config/ai.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;
// NOTE: the installed @google/generative-ai SDK (^0.24.1) targets the
// v1/v1beta Gemini REST API surface. "gemini-3.5-flash" is not a model
// string that SDK version can resolve, which was causing every AI call
// (summarize/reply/tasks) to fail at the Gemini API call itself.
// "gemini-2.5-flash" is a current, stable model that this SDK version
// supports. Override via GEMINI_MODEL in backend/.env if needed.
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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