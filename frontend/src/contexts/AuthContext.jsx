import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getCurrentUser as getCurrentUserApi,
  login as loginApi,
  register as registerApi,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("mailmind_user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("mailmind_token"));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("mailmind_token")));

  const clearSession = () => {
    localStorage.removeItem("mailmind_token");
    localStorage.removeItem("mailmind_user");
    setToken(null);
    setCurrentUser(null);
  };

  const persistSession = (authData) => {
    const authToken = authData?.token || authData?.accessToken || authData?.jwt || null;
    const user = authData?.user || authData?.currentUser || authData?.profile || null;

    if (!authToken || !user) {
      return null;
    }

    localStorage.setItem("mailmind_token", authToken);
    localStorage.setItem("mailmind_user", JSON.stringify(user));
    setToken(authToken);
    setCurrentUser(user);
    return { token: authToken, user };
  };

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("mailmind_token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const user = await getCurrentUserApi();

        if (user) {
          setCurrentUser(user);
          setToken(storedToken);
        } else {
          clearSession();
        }
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (credentials) => {
    setLoading(true);

    try {
      const response = await loginApi(credentials);
      const session = persistSession(response);

      if (!session) {
        throw new Error("Unable to complete login.");
      }

      return session;
    } catch (error) {
      clearSession();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);

    try {
      const response = await registerApi(payload);
      const session = persistSession(response);

      if (!session) {
        throw new Error("Unable to complete registration.");
      }

      return session;
    } catch (error) {
      clearSession();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearSession();
    window.location.assign("/login");
  };

  const value = useMemo(
    () => ({
      currentUser,
      token,
      login,
      register,
      logout,
      loading,
    }),
    [currentUser, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
