const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const buildUrl = (endpoint) => {
  const normalizedBase = API_BASE_URL ? API_BASE_URL.replace(/\/$/, "") : "";
  return `${normalizedBase}${endpoint}`;
};

const buildPayload = (email) => ({
  subject: email?.subject || "",
  sender: email?.senderName || email?.sender || email?.senderEmail || "",
  body: email?.body || email?.content || email?.message || "",
});

// ADD THIS
const buildAuthHeaders = () => {
  const token = localStorage.getItem("mailmind_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const requestJson = async (endpoint, payload) => {
  const response = await fetch(buildUrl(endpoint), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Unable to process this email.");
  }

  return data;
};

export const summarizeEmail = async (email) => {
  const payload = buildPayload(email);
  const data = await requestJson("/api/ai/summarize", payload);
  return data.summary;
};

export const generateReply = async (email, tone = "professional") => {
  const payload = {
    subject: email?.subject || "",
    senderName: email?.senderName || email?.sender || email?.senderEmail || "",
    body: email?.body || email?.content || email?.message || "",
    tone,
  };

  const data = await requestJson("/api/ai/reply", payload);
  return data.reply;
};

export const extractTasks = async (email) => {
  const payload = buildPayload(email);
  const data = await requestJson("/api/ai/tasks", payload);
  return Array.isArray(data.tasks) ? data.tasks : [];
};