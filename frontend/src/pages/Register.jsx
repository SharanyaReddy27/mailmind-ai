import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import ErrorMessage from "../components/ErrorMessage";
import InputField from "../components/InputField";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.confirmPassword.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to create your account right now.");
    }
  };

  return (
    <AuthCard
      title="Create an account"
      subtitle="Get started with MailMind AI"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <InputField label="Name" name="name" value={form.name} onChange={handleChange} required autoComplete="name" />
        <InputField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required autoComplete="email" />
        <InputField label="Password" name="password" type="password" value={form.password} onChange={handleChange} required autoComplete="new-password" />
        <InputField label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required autoComplete="new-password" />

        {error && <ErrorMessage title="Registration failed" message={error} />}

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>

        {loading && <LoadingSpinner label="Creating your account..." />}

        <p className="auth-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </AuthCard>
  );
}

export default Register;
