import React, { useMemo, useState } from "react";
import { Routes, Route } from "react-router-dom";
import useFeatureFlags from "./hooks/useFeatureFlags";
import useReservations from "./hooks/useReservations";

/**
 * Placeholder page components for routing until full features are implemented.
 * Each page uses semantic structure and minimal styling hooks.
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

export function DashboardPage() {
  const { experimentsEnabled, all } = useFeatureFlags();
  return (
    <PageContainer title="Dashboard">
      <p>Overview of today’s reservations and quick actions will appear here.</p>
      <div style={{ marginTop: 12, fontSize: 12, color: "#6B7280" }}>
        <strong>Feature flags:</strong> {all.length > 0 ? all.join(", ") : "none"}
        {" • "}
        experimentsEnabled: {experimentsEnabled ? "yes" : "no"}
      </div>
    </PageContainer>
  );
}

export function ReservationsPage() {
  const { isEnabled, experimentsEnabled } = useFeatureFlags();
  const pollingDefault = useMemo(
    () => (isEnabled("reservations_polling") ? 15000 : 0),
    [isEnabled]
  );
  const [pollMs, setPollMs] = useState(pollingDefault);

  const {
    data,
    loading,
    error,
    refresh,
    create,
    update,
    remove,
    isPolling,
    startPolling,
    stopPolling,
  } = useReservations({
    pollIntervalMs: pollMs,
    initialQuery: {},
    enableWebsocket: isEnabled("realtime_ws") || experimentsEnabled,
  });

  const onCreateSample = async () => {
    try {
      await create({
        guestName: "Sample Guest",
        size: 2,
        time: new Date().toISOString(),
      });
    } catch {
      // ignore in demo UI
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

  return (
    <PageContainer title="Reservations">
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button className="nav-link" onClick={() => refresh()} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
        <button className="nav-link" onClick={onCreateSample}>
          Create sample
        </button>
        <button className="nav-link" onClick={onTogglePolling}>
          {isPolling ? "Stop polling" : "Start polling"}
        </button>
      </div>

      {error && (
        <div style={{ color: "#EF4444", marginBottom: 12 }}>
          Error: {error?.message || "Failed to load reservations"}
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {data && data.length > 0 ? (
          data.map((r) => {
            const id = r.id || r._id || r.reservationId || "unknown";
            const guest = r.guestName || r.name || "Guest";
            const when = r.time || r.when || r.datetime || "";
            const size = r.size || r.partySize || "";
            return (
              <li
                key={id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{guest}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>
                    {String(when)} • party {String(size)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="nav-link"
                    onClick={() => update(id, { note: "Updated from UI" })}
                  >
                    Update
                  </button>
                  <button className="nav-link" onClick={() => remove(id)}>
                    Delete
                  </button>
                </div>
              </li>
            );
          })
        ) : (
          <li style={{ padding: 8, color: "#6B7280" }}>
            {loading ? "Loading reservations..." : "No reservations found."}
          </li>
        )}
      </ul>
    </PageContainer>
  );
}

export function SettingsPage() {
  return (
    <PageContainer title="Settings">
      <p>Configure preferences, integrations, and notifications.</p>
    </PageContainer>
  );
}

/**
 * AppRoutes configures the route mapping.
 * No API usage yet; this only declares the navigation structure.
 */
// PUBLIC_INTERFACE
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/reservations" element={<ReservationsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<DashboardPage />} />
    </Routes>
  );
}
