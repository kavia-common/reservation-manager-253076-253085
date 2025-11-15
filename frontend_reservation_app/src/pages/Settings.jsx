import React, { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "../api/client";
import useFeatureFlags from "../hooks/useFeatureFlags";

/**
 * Settings page
 * Shows environment info, performs a healthcheck, and enables local feature flag toggles
 * when experiments are enabled via REACT_APP_EXPERIMENTS_ENABLED.
 *
 * PUBLIC_INTERFACE
 */
export default function Settings() {
  const { experimentsEnabled, all: envFlags } = useFeatureFlags();

  // Environment info
  const info = useMemo(() => {
    const apiBase = getApiBaseUrl();
    const ws = process.env.REACT_APP_WS_URL || deriveWsFromApi(apiBase);
    const nodeEnv = process.env.REACT_APP_NODE_ENV || process.env.NODE_ENV || "development";
    const healthPath = process.env.REACT_APP_HEALTHCHECK_PATH || "/health";
    const backendUrl = process.env.REACT_APP_BACKEND_URL || "";
    const frontendUrl = process.env.REACT_APP_FRONTEND_URL || "";
    return { apiBase, ws, nodeEnv, healthPath, backendUrl, frontendUrl };
  }, []);

  // Healthcheck
  const [health, setHealth] = useState({ status: "idle", ok: null, code: null });
  useEffect(() => {
    let aborted = false;
    const url = buildHealthUrl(info.apiBase, info.healthPath);
    (async () => {
      setHealth({ status: "loading", ok: null, code: null });
      try {
        const res = await fetch(url, { method: "GET" });
        let ok = res.ok;
        // treat json {status:'ok'} or text "ok" as success even if non-200 edge cases are present
        try {
          const ct = (res.headers.get("content-type") || "").toLowerCase();
          if (ct.includes("application/json")) {
            const data = await res.json();
            if (data && (data.ok === true || data.status === "ok")) ok = true;
          } else {
            const t = await res.text();
            if (t && t.toLowerCase().includes("ok")) ok = true;
          }
        } catch {
          /* ignore parse errors */
        }
        if (!aborted) setHealth({ status: "done", ok, code: res.status });
      } catch {
        if (!aborted) setHealth({ status: "done", ok: false, code: 0 });
      }
    })();
    return () => {
      aborted = true;
    };
  }, [info.apiBase, info.healthPath]);

  // Local toggles (only when experiments are enabled)
  const [localFlags, setLocalFlags] = useState(() => {
    try {
      const persisted = JSON.parse(localStorage.getItem("local_feature_flags") || "{}");
      return persisted && typeof persisted === "object" ? persisted : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("local_feature_flags", JSON.stringify(localFlags));
    } catch {
      /* ignore storage errors */
    }
  }, [localFlags]);

  const toggleFlag = (flag) => {
    setLocalFlags((prev) => {
      const next = { ...prev, [flag]: !prev[flag] };
      return next;
    });
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Environment, health and feature toggles</p>
      </header>

      <section className="page-content" style={{ display: "grid", gap: 16 }}>
        <EnvInfo info={info} health={health} />

        {experimentsEnabled && (
          <LocalFeatureToggles
            availableFlags={envFlags}
            localFlags={localFlags}
            onToggle={toggleFlag}
          />
        )}

        {!experimentsEnabled && (
          <p style={{ color: "#6B7280", fontSize: 13 }}>
            Local feature flag toggles are disabled. Set REACT_APP_EXPERIMENTS_ENABLED=true to enable.
          </p>
        )}
      </section>
    </div>
  );
}

function EnvInfo({ info, health }) {
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
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>Environment</h3>
      <ListRow label="API base" value={info.apiBase || "(not set)"} />
      <ListRow label="WebSocket URL" value={info.ws || "(derived/none)"} />
      <ListRow label="Node env" value={info.nodeEnv} />
      <ListRow label="Healthcheck path" value={info.healthPath} />
      <ListRow label="Backend URL" value={info.backendUrl || "(not set)"} />
      <ListRow label="Frontend URL" value={info.frontendUrl || "(not set)"} />

      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Healthcheck</div>
        <span
          style={{
            display: "inline-block",
            padding: "4px 10px",
            borderRadius: 999,
            background: healthPillBg(health),
            color: "#fff",
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          {health.status === "loading"
            ? "Checking…"
            : health.ok
            ? `Healthy (code ${health.code})`
            : `Unhealthy (code ${health.code})`}
        </span>
      </div>
    </div>
  );
}

function LocalFeatureToggles({ availableFlags, localFlags, onToggle }) {
  const list = Array.isArray(availableFlags) ? availableFlags : [];
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
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>Local feature toggles</h3>
      {list.length === 0 ? (
        <p style={{ color: "#6B7280", margin: 0 }}>No feature flags found from env.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {list.map((flag) => (
            <label
              key={flag}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <span style={{ fontWeight: 600 }}>{flag}</span>
              <input
                type="checkbox"
                checked={!!localFlags[flag]}
                onChange={() => onToggle(flag)}
                aria-label={`Toggle ${flag}`}
              />
            </label>
          ))}
        </div>
      )}
      <p style={{ color: "#6B7280", fontSize: 12, marginTop: 8 }}>
        These toggles are stored locally in your browser and do not affect server-side flags.
      </p>
    </div>
  );
}

function ListRow({ label, value }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        gap: 10,
        padding: "6px 0",
        borderBottom: "1px dashed rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ color: "#6B7280" }}>{label}</div>
      <div style={{ fontWeight: 600, wordBreak: "break-all" }}>{value}</div>
    </div>
  );
}

function deriveWsFromApi(apiBase) {
  if (!apiBase) return "";
  try {
    const u = new URL(apiBase);
    if (u.protocol === "https:") u.protocol = "wss:";
    else if (u.protocol === "http:") u.protocol = "ws:";
    return u.toString().replace(/\/*$/, "") + "/ws";
  } catch {
    return "";
  }
}

function buildHealthUrl(apiBase, healthPath) {
  const base = (apiBase || "").replace(/\/*$/, "");
  const path = healthPath.startsWith("/") ? healthPath : `/${healthPath}`;
  return `${base}${path}`;
}

function healthPillBg(health) {
  if (health.status === "loading") return "#6B7280";
  return health.ok ? "var(--color-success)" : "var(--color-error)";
}
