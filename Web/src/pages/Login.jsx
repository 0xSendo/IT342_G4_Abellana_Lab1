import { Link, useNavigate, useLocation } from "react-router-dom";
import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../context/AuthContext";
import "../styles/auth.css";

function getRoleDashboard(role) {
  if (role === "EMPLOYER") return "/dashboard/employer";
  if (role === "ADMIN") return "/dashboard/admin";
  return "/dashboard/student";
}

export default function Login() {
  const { login, isAuthenticated, currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  const googleOauth2Url = import.meta.env.VITE_GOOGLE_OAUTH2_URL || "/oauth2/authorization/google";

  useEffect(() => {
    if (!isAuthenticated) return;
    const role = currentUser?.role || "STUDENT";
    const roleDashboard = getRoleDashboard(role);
    if (from && from.startsWith(roleDashboard)) {
      navigate(from, { replace: true });
      return;
    }
    navigate(roleDashboard, { replace: true });
  }, [isAuthenticated, from, currentUser, navigate]);

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const res = login({ email, password });
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setSuccess("Login successful! Redirecting...");
    const role = res.user.role || "STUDENT";
    const roleDashboard = getRoleDashboard(role);
    if (from && from.startsWith(roleDashboard)) {
      navigate(from, { replace: true });
      return;
    }
    navigate(roleDashboard, { replace: true });
  };

  const handleGoogleLogin = () => {
    const base = apiBaseUrl.replace(/\/$/, "");
    window.location.href = `${base}${googleOauth2Url}`;
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back 👋</h2>
        <p>Login to your InternMatch account</p>

        <Link className="auth-back" to="/">← Back to home</Link>

        <form onSubmit={onSubmit}>
          <input
            type="email"
            placeholder="Email address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="primary-btn">
            Login
          </button>
        </form>

        {error && <div style={{ color: "#ffb4b4", marginTop: 12 }}>{error}</div>}

        <span className="auth-footer">
          Don’t have an account? <Link to="/register">Register</Link>
        </span>
      </div>
    </div>
  );
}
