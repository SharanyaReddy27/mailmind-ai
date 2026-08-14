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


export const login = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  } catch (error) {
    // Provide a clearer message to the UI
    const message = error?.response?.data?.message || 'Unable to log in. Please check your credentials and try again.';
    const e = new Error(message);
    e.status = error?.response?.status;
    throw e;
  }
};

export const register = async (payload) => {
  try {
    const response = await api.post("/auth/register", payload);
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || 'Unable to register. Please check your details and try again.';
    const e = new Error(message);
    e.status = error?.response?.status;
    throw e;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get("/auth/me");
    // The backend responds with { success, user: { id, name, email } }.
    // This previously returned response.data as-is (the whole wrapper),
    // so AuthContext stored { success, user } as the "user", and every
    // currentUser.name / currentUser.email lookup came back undefined
    // after a page refresh - this is why the profile showed "MailMind
    // user" / a blank email even though login itself worked fine.
    return response.data?.user || response.data;
  } catch (error) {
    const savedUser = localStorage.getItem("mailmind_user");

    if (savedUser) {
      return JSON.parse(savedUser);
    }

    throw error;
  }
};

export default api;

const buildApiError = (err, fallbackMessage) => {
  const message = err?.response?.data?.message || fallbackMessage;
  const error = new Error(message);
  if (err?.response?.status) {
    error.status = err.response.status;
  }
  return error;
};

export const getGmailAuthUrl = async () => {
  try {
    const res = await api.get('/gmail/auth-url');
    return res.data;
  } catch (err) {
    throw buildApiError(err, 'Unable to get Gmail auth URL');
  }
};

export const getGmailStatus = async () => {
  try {
    const res = await api.get('/gmail/status');
    return res.data;
  } catch (err) {
    throw buildApiError(err, 'Unable to get Gmail status');
  }
};

export const syncGmail = async (limit = 20) => {
  try {
    const res = await api.post('/gmail/sync', { limit });
    return res.data;
  } catch (err) {
    throw buildApiError(err, 'Unable to sync Gmail');
  }
};

export const disconnectGmail = async () => {
  try {
    const res = await api.post('/gmail/disconnect');
    return res.data;
  } catch (err) {
    throw buildApiError(err, 'Unable to disconnect Gmail');
  }
};