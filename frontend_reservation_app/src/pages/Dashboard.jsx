import React, { useMemo } from "react";
import useReservations from "../hooks/useReservations";

/**
 * Dashboard page
 * Shows basic KPIs: today's reservations, upcoming, and cancellations.
 *
 * PUBLIC_INTERFACE
 */
export default function Dashboard() {
  const { data, loading, error } = useReservations({
    // Light polling for freshness on dashboard
    pollIntervalMs: 30000,
    initialQuery: {},
    enableWebsocket: false,
  });

  const kpis = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    const now = new Date();

    const isToday = (d) => {
      try {
        const dt = new Date(d);
        return (
          dt.getFullYear() === now.getFullYear() &&
          dt.getMonth() === now.getMonth() &&
          dt.getDate() === now.getDate()
        );
      } catch {
        return false;
      }
    };

    const getTime = (r) => {
      const raw = r.time || r.when || r.datetime;
      const t = new Date(raw);
      return isNaN(t.getTime()) ? null : t.getTime();
    };

    const todays = list.filter((r) => {
      const raw = r.time || r.when || r.datetime;
      return raw && isToday(raw);
    });

    const upcoming = list.filter((r) => {
      const t = getTime(r);
      return t !== null && t > now.getTime();
    });

    const cancellations = list.filter((r) => {
      const s = String(r.status || "").toLowerCase();
      return s === "cancelled";
    });

    return {
      today: todays.length,
      upcoming: upcoming.length,
      cancellations: cancellations.length,
    };
  }, [data]);

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Quick snapshot of reservations</p>
      </header>

      {error && (
        <div style={{ color: "var(--color-error)", marginBottom: 12 }}>
          Failed to load reservations overview.
        </div>
      )}

      <section className="page-content">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          <KpiCard
            title="Today's reservations"
            value={kpis.today}
            loading={loading}
          />
          <KpiCard
            title="Upcoming"
            value={kpis.upcoming}
            loading={loading}
          />
          <KpiCard
            title="Cancellations"
            value={kpis.cancellations}
            loading={loading}
          />
        </div>

        <p style={{ marginTop: 16, color: "#6B7280", fontSize: 12 }}>
          KPIs are computed client-side from the current reservation list.
        </p>
      </section>
    </div>
  );
}

function KpiCard({ title, value, loading }) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 14,
        padding: 16,
        boxShadow: "0 8px 24px rgba(31,41,55,0.08)",
      }}
    >
      <div
        style={{ fontSize: 12, color: "#6B7280", marginBottom: 6, fontWeight: 600 }}
      >
        {title}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>
        {loading ? "…" : String(value)}
      </div>
    </div>
  );
}
