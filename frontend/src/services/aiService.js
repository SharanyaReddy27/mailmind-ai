import api from "./api";

// NOTE: this previously used its own `fetch()` calls with a separate
// VITE_API_BASE_URL env var and its own localStorage token lookup,
// duplicating (and drifting from) the shared axios client in `api.js`
// (which uses VITE_API_URL / a "/api" proxy path and already attaches
// the auth header via an interceptor). Any environment where only one
// of those two env vars was set would silently break either the AI
// endpoints or the rest of the app. Routing through the shared `api`
// instance keeps auth + base URL handling in exactly one place.

const buildPayload = (email) => ({
  emailId: email?._id || email?.id,
  subject: email?.subject || "",
  sender: email?.senderName || email?.sender || email?.senderEmail || "",
  body: email?.body || email?.content || email?.message || "",
});

const unwrapError = (error) => {
  const message =
    error?.response?.data?.message || "Unable to process this email.";
  throw new Error(message);
};

export const summarizeEmail = async (email) => {
  try {
    const { data } = await api.post("/ai/summarize", buildPayload(email));
    return data.summary;
  } catch (error) {
    unwrapError(error);
  }
};

export const generateReply = async (email, tone = "professional") => {
  try {
    const payload = {
      emailId: email?._id || email?.id,
      subject: email?.subject || "",
      senderName:
        email?.senderName || email?.sender || email?.senderEmail || "",
      body: email?.body || email?.content || email?.message || "",
      tone,
    };

    const { data } = await api.post("/ai/reply", payload);
    return data.reply;
  } catch (error) {
    unwrapError(error);
  }
};

export const extractTasks = async (email) => {
  try {
    const { data } = await api.post("/ai/tasks", buildPayload(email));
    return Array.isArray(data.tasks) ? data.tasks : [];
  } catch (error) {
    unwrapError(error);
  }
};
