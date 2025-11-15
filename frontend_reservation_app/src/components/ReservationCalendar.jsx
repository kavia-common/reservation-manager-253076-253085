import React, { useMemo, useState } from "react";

/**
 * ReservationCalendar
 * A lightweight weekly grid calendar to visualize reservations by day/time.
 * - No external dependencies; styled to match Champagne theme.
 * - Supports week navigation and renders items with guest name and party size.
 *
 * Props:
 * - reservations: Array<{ id: string|number, guestName?: string, size?: number, time?: string }>
 * - onSelectReservation?: (reservation) => void
 * - initialWeekStart?: Date - optional, defaults to start of current week (Mon)
 *
 * PUBLIC_INTERFACE
 */
// PUBLIC_INTERFACE
export default function ReservationCalendar({
  reservations = [],
  onSelectReservation,
  initialWeekStart,
}) {
  const [weekStart, setWeekStart] = useState(
    () => startOfWeek(initialWeekStart || new Date())
  );

  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const itemsByDay = useMemo(() => {
    const map = {};
    days.forEach((d) => (map[keyOfDate(d)] = []));
    for (const r of reservations) {
      const t = parseDateSafe(r.time || r.when || r.datetime);
      if (!t) continue;
      const k = keyOfDate(t);
      if (!map[k]) continue;
      map[k].push({ r, when: t });
    }
    // sort each day's items by time
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => a.when.getTime() - b.when.getTime());
    });
    return map;
  }, [reservations, days]);

  const goPrevWeek = () => setWeekStart((d) => addDays(d, -7));
  const goNextWeek = () => setWeekStart((d) => addDays(d, 7));
  const goToday = () => setWeekStart(startOfWeek(new Date()));

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18 }}>Weekly calendar</h3>
          <div style={{ color: "#6B7280", fontSize: 12 }}>
            {formatRange(days[0], days[6])}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="nav-link" onClick={goPrevWeek}>◀ Prev</button>
          <button className="nav-link" onClick={goToday}>Today</button>
          <button className="nav-link" onClick={goNextWeek}>Next ▶</button>
        </div>
      </header>

      <div style={gridWrapperStyle}>
        <div style={timeColStyle}>
          {HOURS.map((h) => (
            <div key={h} style={timeCellStyle}>
              <span>{formatHour(h)}</span>
            </div>
          ))}
        </div>

        <div style={daysWrapperStyle}>
          <div style={daysHeaderRowStyle}>
            {days.map((d) => (
              <div key={keyOfDate(d)} style={dayHeaderCellStyle(d)}>
                <div style={{ fontWeight: 800 }}>
                  {WEEKDAY_LABELS[d.getDay()]}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#6B7280",
                    fontWeight: 600,
                  }}
                >
                  {d.getMonth() + 1}/{d.getDate()}
                </div>
              </div>
            ))}
          </div>

          <div style={daysGridRowsStyle}>
            {HOURS.map((h) => (
              <div key={h} style={rowStyle} aria-hidden />
            ))}

            {/* Items layer */}
            <div style={itemsLayerStyle}>
              {days.map((d) => {
                const key = keyOfDate(d);
                const items = itemsByDay[key] || [];
                return items.map(({ r, when }) => {
                  const top = positionForTime(when);
                  return (
                    <button
                      key={`${key}-${r.id || r._id || r.uuid || when.toISOString()}`}
                      title={`${safeGuest(r)} • ${formatTime(when)} • Party ${r.size || r.partySize || ""}`}
                      onClick={() => onSelectReservation?.(r)}
                      style={{
                        ...itemStyle,
                        left: `${(100 / 7) * dayColumnIndex(days, d)}%`,
                        top,
                        width: `calc(${100 / 7}% - 8px)`,
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 12 }}>
                        {formatTime(when)}
                      </div>
                      <div style={{ fontSize: 12 }}>{safeGuest(r)}</div>
                      {(r.size || r.partySize) && (
                        <div style={{ fontSize: 11, opacity: 0.9 }}>
                          Party {r.size || r.partySize}
                        </div>
                      )}
                    </button>
                  );
                });
              })}
            </div>
          </div>
        </div>
      </div>

      <p style={{ color: "#6B7280", fontSize: 12, marginTop: 8 }}>
        Tip: Click on a reservation to open actions in the list view.
      </p>
    </div>
  );
}

/** Helpers and styling */
const HOURS = Array.from({ length: 14 }).map((_, i) => i + 9); // 9:00 - 22:00
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfWeek(d) {
  const x = new Date(d);
  const day = x.getDay(); // 0 Sun - 6 Sat
  // Make Monday the first day of week
  const diff = (day + 6) % 7; // 0 for Mon, 6 for Sun
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - diff);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function keyOfDate(d) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function parseDateSafe(s) {
  try {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function formatHour(h) {
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${ampm}`;
}

function formatTime(d) {
  const hh = d.getHours();
  const mm = d.getMinutes();
  const ampm = hh >= 12 ? "PM" : "AM";
  const hr = hh % 12 === 0 ? 12 : hh % 12;
  const pad = (n) => (n < 10 ? `0${n}` : String(n));
  return `${hr}:${pad(mm)} ${ampm}`;
}

function formatRange(a, b) {
  return `${a.toLocaleDateString()} – ${b.toLocaleDateString()}`;
}

function positionForTime(d) {
  // Map 9:00 -> 0%, 22:00 -> 100%
  const start = 9 * 60;
  const end = 22 * 60;
  const total = end - start;
  const mins = d.getHours() * 60 + d.getMinutes();
  const rel = Math.min(Math.max(mins - start, 0), total);
  const pct = (rel / total) * 100;
  return `calc(${pct}% - 10px)`; // small offset to avoid overlap with row borders
}

function dayColumnIndex(days, day) {
  const key = keyOfDate(day);
  return days.findIndex((d) => keyOfDate(d) === key);
}

function safeGuest(r) {
  return r.guestName || r.name || "Guest";
}

const containerStyle = {
  background: "var(--color-surface)",
  border: "1px solid rgba(0,0,0,0.06)",
  borderRadius: 16,
  boxShadow: "0 8px 24px rgba(31,41,55,0.08)",
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

const gridWrapperStyle = {
  display: "grid",
  gridTemplateColumns: "80px 1fr",
  minHeight: 480,
};

const timeColStyle = {
  display: "grid",
  gridTemplateRows: `repeat(${HOURS.length}, 1fr)`,
  borderRight: "1px solid rgba(0,0,0,0.06)",
  background: "linear-gradient(180deg, rgba(217,119,6,0.06), transparent)",
};

const timeCellStyle = {
  padding: "6px 8px",
  fontSize: 12,
  color: "#6B7280",
  borderBottom: "1px dashed rgba(0,0,0,0.06)",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "flex-end",
};

const daysWrapperStyle = {
  position: "relative",
  overflow: "hidden",
};

const daysHeaderRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  borderBottom: "1px solid rgba(0,0,0,0.06)",
  background: "linear-gradient(180deg, rgba(217,119,6,0.10), rgba(217,119,6,0.05))",
};

function dayHeaderCellStyle(d) {
  const isToday =
    new Date().toDateString() === d.toDateString();
  return {
    padding: "10px 12px",
    borderLeft: "1px solid rgba(0,0,0,0.06)",
    background: isToday
      ? "linear-gradient(180deg, rgba(16,185,129,0.12), transparent)"
      : "transparent",
  };
}

const daysGridRowsStyle = {
  position: "relative",
  display: "grid",
  gridTemplateRows: `repeat(${HOURS.length}, 1fr)`,
};

const rowStyle = {
  borderBottom: "1px dashed rgba(0,0,0,0.06)",
  minHeight: 36,
};

const itemsLayerStyle = {
  position: "absolute",
  inset: 0,
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  pointerEvents: "none",
};

const itemStyle = {
  position: "absolute",
  marginLeft: 4,
  marginRight: 4,
  padding: "8px 10px",
  background: "rgba(217,119,6,0.14)",
  color: "var(--color-text)",
  border: "1px solid rgba(217,119,6,0.25)",
  borderRadius: 10,
  boxShadow: "0 6px 18px rgba(31,41,55,0.12)",
  pointerEvents: "auto",
  textAlign: "left",
  cursor: "pointer",
  backdropFilter: "blur(2px)",
};
