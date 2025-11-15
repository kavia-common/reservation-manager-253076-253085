import React, { useEffect, useMemo, useState } from "react";

/**
 * ReceiptModal
 * Triggers receipt generation and shows a simple preview or success state.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onGenerate: () => Promise<any> | any - handler that calls the API
 * - reservationId?: string|number - optional
 *
 * PUBLIC_INTERFACE
 */
// PUBLIC_INTERFACE
export default function ReceiptModal({ open, onClose, onGenerate, reservationId }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setLoading(true);
      setResult(null);
      setError("");
      (async () => {
        try {
          const res = await onGenerate?.();
          setResult(res ?? { status: "ok" });
        } catch {
          setError("Unable to generate receipt right now. Please try again.");
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [open, onGenerate]);

  const content = useMemo(() => {
    if (loading) {
      return <div>Generating receipt...</div>;
    }
    if (error) {
      return <div role="alert" style={{ color: "var(--color-error)" }}>{error}</div>;
    }
    if (result) {
      // Try sensible preview: if text or has url or pdf fields
      if (typeof result === "string") {
        return <pre style={preStyle}>{trimPreview(result)}</pre>;
      }
      if (result?.url) {
        return (
          <div>
            <p style={{ marginTop: 0 }}>Your receipt is ready:</p>
            <a href={result.url} target="_blank" rel="noreferrer">Open receipt</a>
          </div>
        );
      }
      if (result?.pdfBase64) {
        return <div>Receipt PDF generated. Please check downloads or backend storage.</div>;
      }
      return <pre style={preStyle}>{JSON.stringify(result, null, 2)}</pre>;
    }
    return <div>Ready.</div>;
  }, [loading, error, result]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Generate receipt" style={backdropStyle}>
      <div style={modalStyle}>
        <header style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: 18 }}>
            Receipt {reservationId ? `for #${reservationId}` : ""}
          </h3>
          <button
            aria-label="Close"
            onClick={onClose}
            style={closeBtnStyle}
            disabled={loading}
          >
            ×
          </button>
        </header>
        <div style={{ padding: "12px 16px" }}>
          {content}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button className="nav-link" onClick={onClose} disabled={loading}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function trimPreview(s) {
  if (s.length <= 1000) return s;
  return s.slice(0, 1000) + "\n…";
}

const preStyle = {
  margin: 0,
  padding: 12,
  background: "#F9FAFB",
  color: "#111827",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.06)",
  maxHeight: 360,
  overflow: "auto",
};

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
  maxWidth: 640,
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
