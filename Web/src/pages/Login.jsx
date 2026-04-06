import { Link, useNavigate, useLocation } from "react-router-dom";
import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../context/AuthContext";
import "../styles/auth.css";

// ==================== Facade Pattern ====================
// Provides a simplified interface to the complex login + redirect logic
const createAuthFacade = (login, navigate, from) => {
  const getRoleDashboard = (role) => {
    if (role === "EMPLOYER") return "/dashboard/employer";
    if (role === "ADMIN") return "/dashboard/admin";
    return "/dashboard/student";
  };

  const redirectToDashboard = (user) => {
    const role = user?.role || "STUDENT";
    const dashboardPath = getRoleDashboard(role);

    // Prefer "from" location if it's safe for the user's role
    if (from && from.startsWith(dashboardPath)) {
      navigate(from, { replace: true });
    } else {
      navigate(dashboardPath, { replace: true });
    }
  };

  return {
    // High-level method for form login
    handleFormLogin: async (email, password) => {
      const res = await login({ email, password });
      
      if (!res.ok) {
        return { ok: false, message: res.message };
      }

      redirectToDashboard(res.user);
      return { ok: true, message: "Login successful! Redirecting..." };
    },

    // High-level method for Google OAuth login
    handleGoogleLogin: () => {
      const clientId = "575888947733-vg689sh7vpvosr9uaquv9osrgibc3ost.apps.googleusercontent.com";
      const redirectUri = encodeURIComponent(`${window.location.origin}/`);
      const scope = encodeURIComponent("openid email profile");
      const nonce = encodeURIComponent("internmatch-dev-nonce");

      window.location.href = 
        `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token%20id_token&scope=${scope}&nonce=${nonce}&prompt=select_account`;
    }
  };
};

export default function Login() {
  const { login, isAuthenticated, currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create facade instance
  const authFacade = React.useMemo(() => 
    createAuthFacade(login, navigate, from), 
    [login, navigate, from]
  );

  // Simplified useEffect using Facade
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;
    authFacade.redirectToDashboard?.(currentUser);   // Note: redirectToDashboard is internal, but we can expose if needed
  }, [isAuthenticated, currentUser, authFacade]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const result = await authFacade.handleFormLogin(email, password);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setSuccess(result.message);
  };

  const handleGoogleLogin = () => {
    authFacade.handleGoogleLogin();
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p>Login to your InternMatch account</p>
        <Link className="auth-back" to="/">Back to home</Link>

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
          <button type="submit" className="primary-btn">Login</button>
        </form>

        {error && <div className="auth-feedback auth-feedback--error">{error}</div>}
        {success && <div className="auth-feedback auth-feedback--success">{success}</div>}

        <div className="auth-divider"><span>or</span></div>
        
        <button type="button" className="google-btn" onClick={handleGoogleLogin}>
          <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Sign in with Google
        </button>

        <span className="auth-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </span>
      </div>
    </div>
  );
}
