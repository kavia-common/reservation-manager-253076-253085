import React, { useEffect, useMemo, useState } from "react";

/**
 * SmsModal
 * A11y-friendly modal to send an SMS message for a reservation.
 *
 * Props:
 * - open: boolean - whether the modal is visible
 * - onClose: () => void - called to close the modal
 * - onSend: (message: string) => Promise<any> | any - handler to send SMS
 * - guestName?: string - optional to personalize
 * - phone?: string - optional phone to show
 *
 * PUBLIC_INTERFACE
 */
// PUBLIC_INTERFACE
export default function SmsModal({ open, onClose, onSend, guestName, phone }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      // Reset state each time modal opens
      setMessage(defaultTemplate(guestName));
      setSending(false);
      setError("");
    }
  }, [open, guestName]);

  const disabled = useMemo(() => sending || message.trim().length === 0, [sending, message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled) return;
    setSending(true);
    setError("");
    try {
      await onSend?.(message.trim());
      onClose?.();
    } catch {
      // Do not surface internal details; show friendly msg
      setError("Unable to send SMS at the moment. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Send SMS" style={backdropStyle}>
      <div style={modalStyle}>
        <header style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Send SMS</h3>
          <button
            aria-label="Close"
            onClick={onClose}
            style={closeBtnStyle}
            disabled={sending}
          >
            ×
          </button>
        </header>
        <div style={{ padding: "12px 16px", display: "grid", gap: 10 }}>
          {phone && (
            <div style={{ fontSize: 13, color: "#6B7280" }}>
              To: {guestName ? `${guestName} • ` : ""}{phone}
            </div>
          )}
          {error && (
            <div role="alert" style={{ color: "var(--color-error)", fontSize: 13 }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
            <label htmlFor="sms-message" style={{ fontWeight: 600 }}>Message</label>
            <textarea
              id="sms-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={textareaStyle}
              placeholder="Type your message..."
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="nav-link"
                onClick={onClose}
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="nav-link"
                disabled={disabled}
                aria-busy={sending ? "true" : "false"}
              >
                {sending ? "Sending..." : "Send SMS"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function defaultTemplate(name) {
  const n = (name || "guest").toString();
  return `Hello ${n}, this is a confirmation regarding your reservation. Reply STOP to opt out.`;
}

const backdropStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 1000,
};

const modalStyle = {
  width: "100%",
  maxWidth: 560,
  background: "var(--color-surface)",
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.06)",
  boxShadow: "0 12px 40px rgba(31,41,55,0.2)",
  overflow: "hidden",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 16px",
  background: "linear-gradient(180deg, rgba(217,119,6,0.08), transparent)",
  borderBottom: "1px solid rgba(0,0,0,0.06)",
};

const closeBtnStyle = {
  border: "none",
  background: "transparent",
  fontSize: 20,
  cursor: "pointer",
  color: "#6B7280",
};

const textareaStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.12)",
  background: "var(--color-surface)",
  color: "var(--color-text)",
  outline: "none",
  boxShadow: "0 2px 8px rgba(31,41,55,0.05)",
  resize: "vertical",
};
