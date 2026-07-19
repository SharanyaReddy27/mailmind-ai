import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mailmind_token");

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

const fallbackUser = (email) => ({
  name: email.split("@")[0].replace(/\./g, " "),
  email,
});

const fallbackAuth = (payload) => {
  const email = payload?.email || payload?.user?.email || "user@mailmind.ai";
  const token = `demo-${Date.now()}`;
  const user = payload?.name ? { name: payload.name, email } : fallbackUser(email);

  return { token, user };
};

export const login = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404 || !error?.response) {
      return fallbackAuth(credentials);
    }

    throw error;
  }
};

export const register = async (payload) => {
  try {
    const response = await api.post("/auth/register", payload);
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404 || !error?.response) {
      return fallbackAuth(payload);
    }

    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get("/auth/me");
    return response.data;
  } catch (error) {
    const savedUser = localStorage.getItem("mailmind_user");

    if (savedUser) {
      return JSON.parse(savedUser);
    }

    throw error;
  }
};

export default api;