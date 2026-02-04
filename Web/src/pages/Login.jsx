import { Link, useNavigate } from "react-router-dom";
import React, { useContext, useState } from "react";
import AuthContext from "../context/AuthContext";
import "../styles/auth.css";

export default function Login() {
  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (isAuthenticated) {
    navigate("/");
  }

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    const res = login({ email, password });
    if (!res.ok) {
      setError(res.message);
      return;
    }
    // redirect based on role
    const role = res.user.role || "STUDENT";
    if (role === "EMPLOYER") navigate("/dashboard/employer");
    else if (role === "ADMIN") navigate("/dashboard/admin");
    else navigate("/dashboard/student");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back 👋</h2>
        <p>Login to your InternMatch account</p>

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
