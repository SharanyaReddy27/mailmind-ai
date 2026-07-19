import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const getErrorMessage = (error) => {
  const backendMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message;

  return backendMessage || "Unable to complete the request right now.";
};

export const healthCheck = () => api.get("/health");
export const getEmails = () => api.get("/emails");
export const getEmailById = (id) => api.get(`/emails/${id}`);
export const createEmail = (payload) => api.post("/emails", payload);
export const updateEmail = (id, payload) => api.put(`/emails/${id}`, payload);
export const deleteEmail = (id) => api.delete(`/emails/${id}`);
export const summarizeEmail = (payload) => api.post("/ai/summarize", payload);
export const generateReply = (payload) => api.post("/ai/reply", payload);
export const extractTasks = (payload) => api.post("/ai/tasks", payload);

export default api;