import React, { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, opts = {}) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, ...opts };
    setToasts((t) => [...t, toast]);
    const duration = opts.duration ?? 3000;
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, duration);
    return id;
  }, []);

  const hide = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show, hide }}>
      {children}

      <div className="toast-viewport" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export default ToastContext;
