import React, { createContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

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

  function getUsers() {
    try {
      const raw = localStorage.getItem("internmatch_users") || "[]";
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem("internmatch_users", JSON.stringify(users));
  }

  const register = ({ name, email, password, role }) => {
    const users = getUsers();
    const exists = users.find((u) => u.email === email.toLowerCase());
    if (exists) {
      return { ok: false, message: "A user with that email already exists." };
    }

    const user = { id: Date.now(), name, email: email.toLowerCase(), password, role };
    users.push(user);
    saveUsers(users);
    localStorage.setItem("internmatch_currentUser", JSON.stringify(user));
    setCurrentUser(user);
    return { ok: true, user };
  };

  const login = ({ email, password }) => {
    const users = getUsers();
    const user = users.find((u) => u.email === email.toLowerCase() && u.password === password);
    if (!user) return { ok: false, message: "Invalid email or password." };
    localStorage.setItem("internmatch_currentUser", JSON.stringify(user));
    setCurrentUser(user);
    return { ok: true, user };
  };

  const logout = () => {
    localStorage.removeItem("internmatch_currentUser");
    setCurrentUser(null);
  };

  const updateProfile = (updates) => {
    if (!currentUser) return { ok: false, message: "No active user." };
    const users = getUsers();
    const nextUser = { ...currentUser, ...updates };
    const index = users.findIndex((u) => u.id === currentUser.id);
    if (index >= 0) {
      users[index] = nextUser;
      saveUsers(users);
    }
    localStorage.setItem("internmatch_currentUser", JSON.stringify(nextUser));
    setCurrentUser(nextUser);
    return { ok: true, user: nextUser };
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    register,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
