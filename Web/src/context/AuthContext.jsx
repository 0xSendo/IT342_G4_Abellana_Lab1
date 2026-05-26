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

  const loginWithOAuth = React.useCallback(({ token, email, name, role, ...rest }) => {
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
  }, []);

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
    localStorage.removeItem("internmatch_openChats");
    localStorage.removeItem("internmatch_activeChat");
    setCurrentUser(null);
  };

  const updateProfile = async (formData) => {
    try {
      const token = localStorage.getItem("internmatch_token");
      
      // Combine current user data with new form data
      const rawData = { ...currentUser, ...formData };
      
      const cleanData = {
        name: rawData.name,
        program: rawData.program,
        yearLevel: rawData.yearLevel,
        skills: rawData.skills,
        bio: rawData.bio,
        projects: rawData.projects,
        resumeUrl: rawData.resumeUrl,
        linkedin: rawData.linkedin,
        website: rawData.website,
        companyName: rawData.companyName,
        companyLocation: rawData.companyLocation,
        companyWebsite: rawData.companyWebsite,
        department: rawData.department,
        phone: rawData.phone
      };
      
      console.log("Saving Profile Data:", cleanData);

      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(cleanData),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        console.log("Server Response (Updated User):", updatedUser);
        
        // Priority 1: The direct response from the PUT request
        // Priority 2: The previous state (to keep the token)
        const mergedUser = { ...currentUser, ...updatedUser };
        
        // Final Verification: Fetch fresh from /me to ensure DB persistence
        const freshRes = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (freshRes.ok) {
          const freshUser = await freshRes.ok ? await freshRes.json() : updatedUser;
          console.log("Fresh Sync from /me:", freshUser);
          
          const finalUser = { ...mergedUser, ...freshUser };
          localStorage.setItem("internmatch_currentUser", JSON.stringify(finalUser));
          setCurrentUser(finalUser);
          return { ok: true };
        }

        localStorage.setItem("internmatch_currentUser", JSON.stringify(mergedUser));
        setCurrentUser(mergedUser);
        return { ok: true };
      } else {
        const text = await res.text();
        let errorMsg = "Server error occurred while saving.";
        try {
          const json = JSON.parse(text);
          errorMsg = json.message || errorMsg;
        } catch (e) {
          errorMsg = text || errorMsg;
        }
        return { ok: false, message: errorMsg };
      }
    } catch (e) {
      console.error("Profile update error", e);
      return { ok: false, message: "Network error: Could not reach server." };
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

  const uploadResume = async (file) => {
    try {
      const token = localStorage.getItem("internmatch_token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/api/files/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      if (res.ok) {
        return await res.json();
      } else {
        const msg = await res.text();
        return { ok: false, message: msg || "Upload failed." };
      }
    } catch (e) {
      console.error("Upload error", e);
      return { ok: false, message: "Could not connect to server." };
    }
  };

  const removeResume = async () => {
    try {
      const updatedProfile = { ...currentUser, resumeUrl: null };
      const res = await updateProfile({ resumeUrl: null });
      if (res.ok) {
        return { ok: true };
      }
      return res;
    } catch (e) {
      return { ok: false, message: "Failed to remove resume." };
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
    uploadResume,
    removeResume,
    getUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
