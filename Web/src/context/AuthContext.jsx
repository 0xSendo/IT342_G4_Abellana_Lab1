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

  const loginWithOAuth = ({ token, email, name, role }) => {
    const normalizedEmail = email?.toLowerCase?.();
    const normalizedRole = role || "STUDENT";

    if (!token || !normalizedEmail) {
      return { ok: false, message: "Missing OAuth login details." };
    }

    const users = getUsers();
    const existingUser = users.find((u) => u.email === normalizedEmail);
    const user = existingUser || {
      id: Date.now(),
      name: name || normalizedEmail,
      email: normalizedEmail,
      password: "",
      role: normalizedRole,
    };

    const nextUser = {
      ...user,
      name: name || user.name,
      role: normalizedRole,
    };

    if (existingUser) {
      const index = users.findIndex((u) => u.email === normalizedEmail);
      users[index] = nextUser;
    } else {
      users.push(nextUser);
    }

    saveUsers(users);
    localStorage.setItem("internmatch_token", token);
    localStorage.setItem("internmatch_currentUser", JSON.stringify(nextUser));
    setCurrentUser(nextUser);

    return { ok: true, user: nextUser };
  };

  const register = ({ name, email, password, role }) => {
    const users = getUsers();
    const exists = users.find((u) => u.email === email.toLowerCase());
    if (exists) {
      return { ok: false, message: "A user with that email already exists." };
    }

    const user = { id: Date.now(), name, email: email.toLowerCase(), password, role };
    users.push(user);
    saveUsers(users);
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
    localStorage.removeItem("internmatch_token");
    setCurrentUser(null);
  };

  const updateProfile = (updates) => {
    if (!currentUser) return { ok: false, message: "No active user." };
    const users = getUsers();
    const nextEmail = updates.email?.toLowerCase?.() ?? currentUser.email;
    const emailTaken = users.some(
      (u) => u.id !== currentUser.id && u.email === nextEmail
    );
    if (emailTaken) {
      return { ok: false, message: "Email is already used by another account." };
    }

    const nextUser = {
      ...currentUser,
      ...updates,
      email: nextEmail,
      role: currentUser.role,
    };
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
    loginWithOAuth,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
