import { Link, useNavigate, useLocation } from "react-router-dom";
import React, { useContext, useState } from "react";
import AuthContext from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "../styles/auth.css";

export default function Register() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [error, setError] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) {
      setError("Please fill out all fields.");
      return;
    }
    const res = register({ name, email, password, role });
    if (!res.ok) {
      setError(res.message);
      return;
    }
    toast.show("Registration successful. Please log in.");
    // Always return to login after registration
    navigate("/login", { replace: true, state: { from } });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account 🚀</h2>
        <p>Join InternMatch today</p>

        <Link className="auth-back" to="/">← Back to home</Link>

        <form onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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

          <select value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="STUDENT">Student</option>
            <option value="EMPLOYER">Employer</option>
            <option value="ADMIN">Admin</option>
          </select>

          <button type="submit" className="primary-btn">
            Register
          </button>
        </form>

        {error && <div style={{ color: "#ffb4b4", marginTop: 12 }}>{error}</div>}

        <span className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </span>
      </div>
    </div>
  );
}
