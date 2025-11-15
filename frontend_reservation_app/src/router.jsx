import React, { useMemo, useState } from "react";
import { Routes, Route } from "react-router-dom";
import useFeatureFlags from "./hooks/useFeatureFlags";
import useReservations from "./hooks/useReservations";
import ReservationForm from "./components/ReservationForm";
import ReservationList from "./components/ReservationList";
import Toast from "./components/Toast";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";

/**
 * App-scoped container to provide a consistent page layout.
 */
function PageContainer({ title, children }) {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">Elegant Champagne theme</p>
      </header>
      <section className="page-content">{children}</section>
    </div>
  );
}

export function ReservationsPage() {
  const { isEnabled, experimentsEnabled } = useFeatureFlags();
  const pollingDefault = useMemo(
    () => (isEnabled("reservations_polling") ? 15000 : 0),
    [isEnabled]
  );
  const [pollMs, setPollMs] = useState(pollingDefault);
  const [submitting, setSubmitting] = useState(false);

  const {
    data,
    loading,
    error,
    refresh,
    create,
    update,
    remove,
    sendSms,
    generateReceipt,
    calendarSync,
    isPolling,
    startPolling,
    stopPolling,
    setQuery,
  } = useReservations({
    pollIntervalMs: pollMs,
    initialQuery: {},
    enableWebsocket: isEnabled("realtime_ws") || experimentsEnabled,
  });

  const [toast, setToast] = useState(null); // { message, type }

  const showToast = (message, type = "info", ms = 3000) => {
    setToast({ message, type, ms });
  };

  const safeSendSms = async (id, message) => {
    try {
      await sendSms(id, message);
      showToast("SMS sent successfully", "success");
    } catch (e) {
      showToast(e?.message || "Failed to send SMS", "error");
      throw e;
    }
  };

  const safeGenerateReceipt = async (id) => {
    try {
      const res = await generateReceipt(id);
      showToast("Receipt generated", "success");
      return res;
    } catch (e) {
      showToast(e?.message || "Failed to generate receipt", "error");
      throw e;
    }
  };

  const safeCalendarSync = async (id) => {
    try {
      const res = await calendarSync(id);
      // If backend returns event info, surface it
      if (res && typeof res === "object") {
        const status = res.status || "synced";
        const link = res.eventLink || res.htmlLink || res.url;
        if (link) {
          showToast(`Calendar ${status}. View event: ${link}`, "success");
        } else {
          showToast(`Calendar ${status}`, "success");
        }
      } else {
        showToast("Calendar synced", "success");
      }
      return res;
    } catch (e) {
      showToast(e?.message || "Failed to sync calendar", "error");
      throw e;
    }
  };

  const onTogglePolling = () => {
    if (isPolling) {
      stopPolling();
      setPollMs(0);
    } else {
      startPolling(15000);
      setPollMs(15000);
    }
  };

  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      await create(payload);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilterChange = (filters) => {
    // Map UI filters to API query params; pass empty strings as undefined to avoid sending empties
    const query = {
      from: filters.from || undefined,
      to: filters.to || undefined,
      status: filters.status || undefined,
      search: filters.search || undefined,
    };
    setQuery(query);
    // Trigger refresh but avoid spamming on each keystroke for "search":
    // Here we rely on backend to use query in subsequent refreshes; keep manual refresh button.
  };

  return (
    <PageContainer title="Reservations">
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Create reservation</h2>
        <ReservationForm onSubmit={handleCreate} submitting={submitting} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button className="nav-link" onClick={() => refresh()} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
        <button className="nav-link" onClick={onTogglePolling}>
          {isPolling ? "Stop polling" : "Start polling"}
        </button>
      </div>

      <ReservationList
        reservations={data}
        loading={loading}
        error={error}
        onRefresh={refresh}
        onUpdate={update}
        onDelete={remove}
        onSendSms={safeSendSms}
        onGenerateReceipt={safeGenerateReceipt}
        onCalendarSync={safeCalendarSync}
        onFilterChange={handleFilterChange}
      />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.ms}
          onClose={() => setToast(null)}
        />
      )}
    </PageContainer>
  );
}

/**
 * AppRoutes configures the route mapping.
 * Includes pages: Dashboard, Reservations, Settings.
 */
// PUBLIC_INTERFACE
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/reservations" element={<ReservationsPage />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Dashboard />} />
    </Routes>
  );
}
