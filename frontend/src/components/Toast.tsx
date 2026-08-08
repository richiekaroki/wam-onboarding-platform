// frontend/src/components/Toast.tsx
"use client";

import { useEffect, useState } from "react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const colors = {
    success: { bg: "#d1fae5", color: "#065f46", border: "#a7f3d0" },
    error: { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
    info: { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" },
  };
  const c = colors[toast.type];

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed", top: "1rem", right: "1rem", zIndex: 100,
        padding: "0.75rem 1.25rem", borderRadius: "4px",
        fontSize: "0.8rem", fontWeight: 500,
        display: "flex", alignItems: "center", gap: "0.75rem",
        background: c.bg, color: c.color, border: `1px solid ${c.border}`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        animation: "fadeUp 0.3s ease",
        maxWidth: "400px",
      }}
    >
      <span>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, fontSize: "1rem", lineHeight: 1 }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

// Global toast state
let _setToasts: React.Dispatch<React.SetStateAction<ToastMessage[]>> | null = null;

export function toast(type: ToastMessage["type"], message: string, duration?: number) {
  if (_setToasts) {
    const id = Math.random().toString(36).slice(2);
    _setToasts((prev) => [...prev, { id, type, message, duration }]);
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    _setToasts = setToasts;
    return () => { _setToasts = null; };
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <>
      {children}
      <div style={{ position: "fixed", top: "1rem", right: "1rem", zIndex: 100, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </>
  );
}
