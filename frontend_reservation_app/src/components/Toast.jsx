import React, { useEffect } from "react";

/**
 * Toast component
 * A lightweight, auto-dismiss notification to display success/error messages.
 *
 * Props:
 * - message: string - text to display
 * - type?: "success" | "error" | "info" - visual style
 * - onClose: () => void - called when toast dismisses
 * - duration?: number - auto dismiss timeout in ms (default 3000)
 *
 * PUBLIC_INTERFACE
 */
// PUBLIC_INTERFACE
export default function Toast({ message, type = "info", onClose, duration = 3000 }) {
  useEffect(() => {
    const t = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const style = {
    container: {
      position: "fixed",
      right: 16,
      bottom: 16,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 14px",
      borderRadius: 12,
      background: "var(--color-surface)",
      boxShadow: "0 10px 30px rgba(31,41,55,0.18)",
      border: `1px solid ${borderColor(type)}`,
      color: textColor(type),
      maxWidth: 360,
    },
    pill: {
      width: 10,
      height: 10,
      borderRadius: 999,
      background: accentColor(type),
      flex: "0 0 auto",
    },
    message: {
      margin: 0,
      fontSize: 14,
      lineHeight: 1.3,
      color: "var(--color-text)",
    },
    closeBtn: {
      marginLeft: 6,
      border: "none",
      background: "transparent",
      cursor: "pointer",
      color: "#6B7280",
      fontSize: 16,
    },
  };

  return (
    <div role="status" aria-live="polite" style={style.container}>
      <span style={style.pill} aria-hidden />
      <p style={style.message}>{message}</p>
      <button aria-label="Close notification" onClick={onClose} style={style.closeBtn}>
        ×
      </button>
    </div>
  );
}

function accentColor(type) {
  switch (type) {
    case "success":
      return "var(--color-success)";
    case "error":
      return "var(--color-error)";
    default:
      return "var(--color-primary)";
  }
}
function borderColor(type) {
  switch (type) {
    case "success":
      return "rgba(16,185,129,0.35)";
    case "error":
      return "rgba(239,68,68,0.35)";
    default:
      return "rgba(217,119,6,0.35)";
  }
}
function textColor(type) {
  switch (type) {
    case "success":
      return "#065F46";
    case "error":
      return "#7F1D1D";
    default:
      return "var(--color-text)";
  }
}
