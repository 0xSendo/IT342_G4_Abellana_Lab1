import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useToast } from "./ToastContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const toast = useToast();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("internmatch_token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/notifications`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }, [API_BASE]);

  const markNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem("internmatch_token");
      if (!token) return;
      await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  };

  const deleteNotification = async (notifId) => {
    try {
      const token = localStorage.getItem("internmatch_token");
      await fetch(`${API_BASE}/api/notifications/${notifId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      toast.show("Notification deleted");
    } catch (err) {
      console.error("Failed to delete notification", err);
      toast.show("Failed to delete notification", "error");
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    try {
      const token = localStorage.getItem("internmatch_token");
      await fetch(`${API_BASE}/api/notifications/all`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      toast.show("All notifications cleared");
    } catch (err) {
      console.error("Failed to clear notifications", err);
      toast.show("Failed to clear notifications", "error");
    }
  };

  const openNotifications = () => {
    setIsNotificationsModalOpen(true);
    markNotificationsAsRead();
  };

  const closeNotifications = () => {
    setIsNotificationsModalOpen(false);
  };

  const respondToRequest = async (connectionId, status) => {
    try {
      const token = localStorage.getItem("internmatch_token");
      const res = await fetch(`${API_BASE}/api/connections/respond/${connectionId}?status=${status}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast.show(`Request ${status === 'ACCEPTED' ? 'accepted' : 'declined'}`);
        fetchNotifications();
      }
    } catch (err) {
      console.error("Failed to respond to request", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    notifications,
    unreadCount,
    isNotificationsModalOpen,
    fetchNotifications,
    openNotifications,
    closeNotifications,
    deleteNotification,
    clearAllNotifications,
    markNotificationsAsRead,
    respondToRequest
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

export default NotificationContext;
