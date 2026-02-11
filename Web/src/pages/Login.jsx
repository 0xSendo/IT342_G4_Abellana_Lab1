import { Link, useNavigate, useLocation } from "react-router-dom";
import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../context/AuthContext";
import "../styles/auth.css";

export default function Login() {
  const { login, isAuthenticated, currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;
  
  useEffect(() => {
    if (!isAuthenticated) return;

    const role = currentUser?.role || "STUDENT";
    const roleDashboard =
      role === "EMPLOYER"
        ? "/dashboard/employer"
        : role === "ADMIN"
          ? "/dashboard/admin"
          : "/dashboard/student";

    // only honor the requested route if it matches the user's role dashboard
    if (from && from.startsWith(roleDashboard)) {
      navigate(from, { replace: true });
      return;
    }

    navigate(roleDashboard, { replace: true });
  }, [isAuthenticated, from, currentUser, navigate]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    const res = login({ email, password });
    if (!res.ok) {
      setError(res.message);
      return;
    }
    const role = res.user.role || "STUDENT";
    const roleDashboard =
      role === "EMPLOYER"
        ? "/dashboard/employer"
        : role === "ADMIN"
          ? "/dashboard/admin"
          : "/dashboard/student";

    if (from && from.startsWith(roleDashboard)) {
      navigate(from, { replace: true });
      return;
    }

    navigate(roleDashboard, { replace: true });
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
