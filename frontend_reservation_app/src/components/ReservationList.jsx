import React, { useMemo, useState } from "react";
import SmsModal from "./SmsModal";
import ReceiptModal from "./ReceiptModal";

/**
 * ReservationList
 * Displays a filterable list of reservations with row actions.
 *
 * Props:
 * - reservations: array - list of reservation objects
 * - loading: boolean
 * - error: any
 * - onRefresh: () => void
 * - onUpdate: (id, updates) => Promise<any>
 * - onDelete: (id) => Promise<any>
 * - onSendSms?: (id, message) => Promise<any>
 * - onGenerateReceipt?: (id) => Promise<any>
 * - onCalendarSync?: (id) => Promise<any>
 * - onFilterChange?: (filters) => void
 *
 * PUBLIC_INTERFACE
 */
export default function ReservationList({
  reservations = [],
  loading = false,
  error = null,
  onRefresh,
  onUpdate,
  onDelete,
  onSendSms,
  onGenerateReceipt,
  onCalendarSync,
  onFilterChange,
}) {
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    status: "",
    search: "",
  });
  const [smsDraft, setSmsDraft] = useState({}); // legacy state (kept if needed elsewhere)

  // Modal state
  const [smsModal, setSmsModal] = useState({ open: false, id: null, guestName: "", phone: "" });
  const [receiptModal, setReceiptModal] = useState({ open: false, id: null });

  const filtered = useMemo(() => {
    const list = Array.isArray(reservations) ? reservations : [];
    return list.filter((r) => {
      const status = String(r.status || "").toLowerCase();
      const fromOk = !filters.from || new Date(r.time || r.when || r.datetime || 0) >= new Date(filters.from);
      const toOk = !filters.to || new Date(r.time || r.when || r.datetime || 0) <= new Date(filters.to);
      const statusOk = !filters.status || status === String(filters.status).toLowerCase();
      const s = String(filters.search || "").trim().toLowerCase();
      const searchOk =
        !s ||
        String(r.guestName || r.name || "")
          .toLowerCase()
          .includes(s) ||
        String(r.phone || "")
          .toLowerCase()
          .includes(s);
      return fromOk && toOk && statusOk && searchOk;
    });
  }, [reservations, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const next = { ...filters, [name]: value };
    setFilters(next);
    onFilterChange?.(next);
  };

  const formatWhen = (r) => {
    const raw = r.time || r.when || r.datetime;
    if (!raw) return "";
    try {
      const d = new Date(raw);
      return d.toLocaleString();
    } catch {
      return String(raw);
    }
  };

  const idOf = (r) => r.id || r._id || r.reservationId || r.uuid || "unknown";

  // Track per-reservation calendar sync result (status and link)
  const [calendarSyncInfo, setCalendarSyncInfo] = useState({});

  // Wrap onCalendarSync to capture and render status/link inline per row
  const handleCalendarSync = async (id) => {
    try {
      const res = await onCalendarSync?.(id);
      const status = (res && typeof res === "object" && (res.status || "synced")) || "synced";
      const link = res?.eventLink || res?.htmlLink || res?.url || "";
      setCalendarSyncInfo((prev) => ({
        ...prev,
        [id]: { status, link },
      }));
    } catch {
      // In case of error, clear any previous success for this id
      setCalendarSyncInfo((prev) => ({
        ...prev,
        [id]: { status: "error" },
      }));
    }
  };

  return (
    <div>
      <div
        className="page-subtitle"
        style={{
          marginBottom: 12,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "end",
        }}
      >
        <div style={{ display: "grid", gap: 4 }}>
          <label htmlFor="from">From</label>
          <input
            id="from"
            name="from"
            type="datetime-local"
            value={filters.from}
            onChange={handleFilterChange}
            style={inputStyle}
          />
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          <label htmlFor="to">To</label>
          <input
            id="to"
            name="to"
            type="datetime-local"
            value={filters.to}
            onChange={handleFilterChange}
            style={inputStyle}
          />
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            style={inputStyle}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="seated">Seated</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div style={{ display: "grid", gap: 4, flex: "1 1 240px" }}>
          <label htmlFor="search">Search</label>
          <input
            id="search"
            name="search"
            type="text"
            placeholder="Search by name or phone"
            value={filters.search}
            onChange={handleFilterChange}
            style={inputStyle}
          />
        </div>
        <button
          className="nav-link"
          onClick={onRefresh}
          disabled={loading}
          aria-busy={loading ? "true" : "false"}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div style={{ color: "var(--color-error)", marginBottom: 8 }}>
          Error: {error?.message || "Failed to load reservations"}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "var(--color-surface)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <thead>
            <tr style={theadRowStyle}>
              <th style={thStyle}>Guest</th>
              <th style={thStyle}>When</th>
              <th style={thStyle}>Party</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Phone</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((r) => {
                const id = idOf(r);
                const guest = r.guestName || r.name || "Guest";
                const when = formatWhen(r);
                const size = r.size || r.partySize || "";
                const status = r.status || "pending";
                const phone = r.phone || "";
                return (
                  <tr key={id} style={trStyle}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{guest}</div>
                      {r.notes && (
                        <div style={{ fontSize: 12, color: "#6B7280" }}>
                          {r.notes}
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>{when}</td>
                    <td style={tdStyle}>{String(size)}</td>
                    <td style={tdStyle}>
                      <span style={statusPillStyle(status)}>{String(status)}</span>
                    </td>
                    <td style={tdStyle}>{phone}</td>
                    <td style={{ ...tdStyle, minWidth: 300 }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          className="nav-link"
                          title="Mark confirmed"
                          onClick={() => onUpdate?.(id, { status: "confirmed" })}
                        >
                          Confirm
                        </button>
                        <button
                          className="nav-link"
                          title="Mark cancelled"
                          onClick={() => onUpdate?.(id, { status: "cancelled" })}
                        >
                          Cancel
                        </button>
                        <button
                          className="nav-link"
                          title="Delete reservation"
                          onClick={() => onDelete?.(id)}
                        >
                          Delete
                        </button>
                        {!!onGenerateReceipt && (
                          <button
                            className="nav-link"
                            title="Generate receipt"
                            onClick={() => onGenerateReceipt(id)}
                          >
                            Receipt
                          </button>
                        )}
                        {!!onCalendarSync && (
                          <button
                            className="nav-link"
                            title="Sync to calendar"
                            onClick={() => handleCalendarSync(id)}
                          >
                            Calendar
                          </button>
                        )}
                      </div>
                      {/* Inline Calendar sync info */}
                      {calendarSyncInfo[id] && (
                        <div style={{ marginTop: 6, fontSize: 12 }}>
                          {calendarSyncInfo[id].status === "error" ? (
                            <span style={{ color: "var(--color-error)" }}>
                              Calendar sync failed
                            </span>
                          ) : (
                            <>
                              <span style={{ color: "#065F46" }}>
                                Calendar {calendarSyncInfo[id].status}
                              </span>
                              {calendarSyncInfo[id].link && (
                                <>
                                  {" • "}
                                  <a
                                    href={calendarSyncInfo[id].link}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Open event
                                  </a>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}
                      {!!onSendSms && (
                        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                          <input
                            type="text"
                            placeholder="SMS message"
                            value={smsDraft[id] || ""}
                            onChange={(e) =>
                              setSmsDraft((d) => ({ ...d, [id]: e.target.value }))
                            }
                            style={{ ...inputStyle, flex: 1 }}
                          />
                          <button
                            className="nav-link"
                            onClick={() => {
                              const msg = (smsDraft[id] || "").trim();
                              if (!msg) return;
                              onSendSms(id, msg).then(() => {
                                setSmsDraft((d) => ({ ...d, [id]: "" }));
                              });
                            }}
                          >
                            Send SMS
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, color: "#6B7280" }}>
                  {loading ? "Loading..." : "No reservations match the current filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render modals at the end so they overlay correctly
  return (
    <>
      <div>
        <div
          className="page-subtitle"
          style={{
            marginBottom: 12,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "end",
          }}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <label htmlFor="from">From</label>
            <input
              id="from"
              name="from"
              type="datetime-local"
              value={filters.from}
              onChange={handleFilterChange}
              style={inputStyle}
            />
          </div>
          <div style={{ display: "grid", gap: 4 }}>
            <label htmlFor="to">To</label>
            <input
              id="to"
              name="to"
              type="datetime-local"
              value={filters.to}
              onChange={handleFilterChange}
              style={inputStyle}
            />
          </div>
          <div style={{ display: "grid", gap: 4 }}>
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              style={inputStyle}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="seated">Seated</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div style={{ display: "grid", gap: 4, flex: "1 1 240px" }}>
            <label htmlFor="search">Search</label>
            <input
              id="search"
              name="search"
              type="text"
              placeholder="Search by name or phone"
              value={filters.search}
              onChange={handleFilterChange}
              style={inputStyle}
            />
          </div>
          <button
            className="nav-link"
            onClick={onRefresh}
            disabled={loading}
            aria-busy={loading ? "true" : "false"}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div style={{ color: "var(--color-error)", marginBottom: 8 }}>
            Error: {error?.message || "Failed to load reservations"}
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "var(--color-surface)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <thead>
              <tr style={theadRowStyle}>
                <th style={thStyle}>Guest</th>
                <th style={thStyle}>When</th>
                <th style={thStyle}>Party</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Phone</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((r) => {
                  const id = idOf(r);
                  const guest = r.guestName || r.name || "Guest";
                  const when = formatWhen(r);
                  const size = r.size || r.partySize || "";
                  const status = r.status || "pending";
                  const phone = r.phone || "";
                  return (
                    <tr key={id} style={trStyle}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600 }}>{guest}</div>
                        {r.notes && (
                          <div style={{ fontSize: 12, color: "#6B7280" }}>
                            {r.notes}
                          </div>
                        )}
                      </td>
                      <td style={tdStyle}>{when}</td>
                      <td style={tdStyle}>{String(size)}</td>
                      <td style={tdStyle}>
                        <span style={statusPillStyle(status)}>{String(status)}</span>
                      </td>
                      <td style={tdStyle}>{phone}</td>
                      <td style={{ ...tdStyle, minWidth: 360 }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button
                            className="nav-link"
                            title="Mark confirmed"
                            onClick={() => onUpdate?.(id, { status: "confirmed" })}
                          >
                            Confirm
                          </button>
                          <button
                            className="nav-link"
                            title="Mark cancelled"
                            onClick={() => onUpdate?.(id, { status: "cancelled" })}
                          >
                            Cancel
                          </button>
                          <button
                            className="nav-link"
                            title="Delete reservation"
                            onClick={() => onDelete?.(id)}
                          >
                            Delete
                          </button>
                          {!!onSendSms && (
                            <button
                              className="nav-link"
                              title="Send SMS"
                              onClick={() =>
                                setSmsModal({
                                  open: true,
                                  id,
                                  guestName: guest,
                                  phone,
                                })
                              }
                            >
                              SMS
                            </button>
                          )}
                          {!!onGenerateReceipt && (
                            <button
                              className="nav-link"
                              title="Generate receipt"
                              onClick={() => setReceiptModal({ open: true, id })}
                            >
                              Receipt
                            </button>
                          )}
                          {!!onCalendarSync && (
                            <button
                              className="nav-link"
                              title="Sync to calendar"
                              onClick={() => handleCalendarSync(id)}
                            >
                              Calendar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ ...tdStyle, color: "#6B7280" }}>
                    {loading ? "Loading..." : "No reservations match the current filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SmsModal
        open={smsModal.open}
        guestName={smsModal.guestName}
        phone={smsModal.phone}
        onClose={() => setSmsModal({ open: false, id: null, guestName: "", phone: "" })}
        onSend={(msg) => onSendSms?.(smsModal.id, msg)}
      />
      <ReceiptModal
        open={receiptModal.open}
        reservationId={receiptModal.id}
        onClose={() => setReceiptModal({ open: false, id: null })}
        onGenerate={() => onGenerateReceipt?.(receiptModal.id)}
      />
    </>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.12)",
  background: "var(--color-surface)",
  color: "var(--color-text)",
  outline: "none",
  boxShadow: "0 2px 8px rgba(31,41,55,0.05)",
};

const theadRowStyle = {
  background: "linear-gradient(180deg, rgba(217,119,6,0.1), rgba(217,119,6,0.05))",
};

const thStyle = {
  textAlign: "left",
  padding: "10px 12px",
  fontWeight: 700,
  borderBottom: "1px solid rgba(0,0,0,0.06)",
};

const trStyle = {
  borderBottom: "1px solid rgba(0,0,0,0.06)",
};

const tdStyle = {
  padding: "10px 12px",
  verticalAlign: "top",
};

function statusPillStyle(status) {
  const map = {
    pending: "#6B7280",
    confirmed: "#10B981",
    seated: "#2563EB",
    completed: "#111827",
    cancelled: "#EF4444",
  };
  const color = map[String(status).toLowerCase()] || "#6B7280";
  return {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    background: color,
    color: "white",
    fontSize: 12,
    fontWeight: 700,
  };
}
