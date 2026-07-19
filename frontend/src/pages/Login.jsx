import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import ErrorMessage from "../components/ErrorMessage";
import InputField from "../components/InputField";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Please fill in both email and password.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      await login({ email: form.email, password: form.password });
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to log in right now.");
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to continue managing your inbox"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <InputField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          autoComplete="email"
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
        />

        {error && <ErrorMessage title="Login failed" message={error} />}

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>

        {loading && <LoadingSpinner label="Authenticating..." />}

        <p className="auth-link">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </AuthCard>
  );
}

export default Login;
