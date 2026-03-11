import React, { createContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("internmatch_currentUser");
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch (e) {
      console.warn("Failed to read currentUser", e);
    }
  }, []);

  const loginWithOAuth = ({ token, email, name, role }) => {
    const normalizedEmail = email?.toLowerCase?.();
    const normalizedRole = role || "STUDENT";
    if (!token || !normalizedEmail) {
      return { ok: false, message: "Missing OAuth login details." };
    }
    const user = { email: normalizedEmail, name: name || normalizedEmail, role: normalizedRole };
    localStorage.setItem("internmatch_token", token);
    localStorage.setItem("internmatch_currentUser", JSON.stringify(user));
    setCurrentUser(user);
    return { ok: true, user };
  };

  const register = async ({ name, email, password, role }) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const text = await res.text();
      if (!res.ok) return { ok: false, message: text || "Registration failed." };
      return { ok: true };
    } catch {
      return { ok: false, message: "Could not connect to server. Please try again." };
    }
  };

  const login = async ({ email, password }) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const msg = await res.text();
        return { ok: false, message: msg || "Invalid email or password." };
      }
      const data = await res.json();
      const user = { email: data.email, name: data.name, role: data.role };
      localStorage.setItem("internmatch_token", data.token);
      localStorage.setItem("internmatch_currentUser", JSON.stringify(user));
      setCurrentUser(user);
      return { ok: true, user };
    } catch {
      return { ok: false, message: "Could not connect to server. Please try again." };
    }
  };

  const logout = () => {
    localStorage.removeItem("internmatch_currentUser");
    localStorage.removeItem("internmatch_token");
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    register,
    login,
    loginWithOAuth,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
