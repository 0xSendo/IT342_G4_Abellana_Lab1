import React, { createContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem("internmatch_currentUser");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.warn("Failed to read currentUser", e);
      return null;
    }
  });

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem("internmatch_token");
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const user = await res.json();
          localStorage.setItem("internmatch_currentUser", JSON.stringify(user));
          setCurrentUser(user);
        }
      } catch (err) {
        console.error("Failed to fetch fresh user profile", err);
      }
    };
    fetchMe();
  }, []);

  const loginWithOAuth = ({ token, email, name, role, ...rest }) => {
    const normalizedEmail = email?.toLowerCase?.();
    const normalizedRole = role || "STUDENT";
    if (!token || !normalizedEmail) {
      return { ok: false, message: "Missing OAuth login details." };
    }
    const user = { email: normalizedEmail, name: name || normalizedEmail, role: normalizedRole, ...rest };
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
      const user = await res.json();
      localStorage.setItem("internmatch_token", user.token);
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

  const updateProfile = async (formData) => {
    try {
      const token = localStorage.getItem("internmatch_token");
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        localStorage.setItem("internmatch_currentUser", JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        return { ok: true };
      } else {
        const msg = await res.text();
        return { ok: false, message: msg || "Failed to update profile on server." };
      }
    } catch (e) {
      console.error("Profile update error", e);
      return { ok: false, message: "Could not connect to server to update profile." };
    }
  };

  const getUsers = async () => {
    try {
      const token = localStorage.getItem("internmatch_token");
      const res = await fetch(`${API_BASE}/api/auth/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    register,
    login,
    loginWithOAuth,
    logout,
    updateProfile,
    getUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;