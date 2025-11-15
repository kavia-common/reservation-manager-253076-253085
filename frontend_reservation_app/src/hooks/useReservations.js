import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  listReservations as apiList,
  createReservation as apiCreate,
  updateReservation as apiUpdate,
  deleteReservation as apiDelete,
  sendSms as apiSendSms,
  generateReceipt as apiGenerateReceipt,
  calendarSync as apiCalendarSync,
} from "../api/reservations";
import { getApiBaseUrl } from "../api/client";

/**
 * Reservations state management hook
 * - Provides list retrieval with optional polling
 * - CRUD operations (create, update, delete)
 * - Action helpers (sendSms, generateReceipt, calendarSync)
 * - Optional WebSocket placeholder for future real-time updates
 */

// PUBLIC_INTERFACE
export function useReservations(options = {}) {
  /**
   * PUBLIC INTERFACE
   * @param {Object} [options]
   * @param {number} [options.pollIntervalMs] - If provided, will poll list at the given interval
   * @param {Object} [options.initialQuery] - Default query params for listReservations
   * @param {boolean} [options.enableWebsocket] - Placeholder: attempts to connect to WS for updates
   *
   * @returns {{
   *   data: any[],
   *   loading: boolean,
   *   error: any,
   *   query: Object,
   *   setQuery: Function,
   *   refresh: Function,
   *   create: Function,
   *   update: Function,
   *   remove: Function,
   *   sendSms: Function,
   *   generateReceipt: Function,
   *   calendarSync: Function,
   *   isPolling: boolean,
   *   startPolling: Function,
   *   stopPolling: Function,
   * }}
   */
  const { pollIntervalMs, initialQuery, enableWebsocket } = options;

  const [data, setData] = useState([]);
  const [query, setQuery] = useState(initialQuery || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pollTimer = useRef(null);
  const isMounted = useRef(true);
  const wsRef = useRef(null);

  const wsUrl = useMemo(() => {
    // Build a placeholder WS URL from env if available
    const baseWs = process.env.REACT_APP_WS_URL;
    if (baseWs) return baseWs;
    // Fallback: attempt to convert API base http(s) to ws(s)
    const apiBase = getApiBaseUrl();
    if (!apiBase) return null;
    try {
      const u = new URL(apiBase);
      if (u.protocol === "https:") u.protocol = "wss:";
      else if (u.protocol === "http:") u.protocol = "ws:";
      return u.toString().replace(/\/+$/, "") + "/ws";
    } catch {
      return null;
    }
  }, []);

  // PUBLIC_INTERFACE
  const refresh = useCallback(
    async (overrideQuery) => {
      /** Fetch latest reservations using current or override query; updates local state. */
      const q = overrideQuery || query || {};
      setLoading(true);
      setError(null);
      try {
        const res = await apiList(q);
        if (isMounted.current) {
          setData(Array.isArray(res) ? res : (res?.items || []));
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    },
    [query]
  );

  // PUBLIC_INTERFACE
  const create = useCallback(async (payload) => {
    /** Create a reservation and refresh the list on success. */
    const created = await apiCreate(payload);
    await refresh();
    return created;
  }, [refresh]);

  // PUBLIC_INTERFACE
  const update = useCallback(async (id, updates) => {
    /** Update a reservation and refresh the list on success. */
    const updated = await apiUpdate(id, updates);
    await refresh();
    return updated;
  }, [refresh]);

  // PUBLIC_INTERFACE
  const remove = useCallback(async (id) => {
    /** Delete a reservation and refresh the list on success. */
    const result = await apiDelete(id);
    await refresh();
    return result;
  }, [refresh]);

  // PUBLIC_INTERFACE
  const sendSms = useCallback(async (id, message) => {
    /** Send an SMS about a reservation. */
    return apiSendSms(id, message);
  }, []);

  // PUBLIC_INTERFACE
  const generateReceipt = useCallback(async (id) => {
    /** Generate a receipt for a reservation. */
    return apiGenerateReceipt(id);
  }, []);

  // PUBLIC_INTERFACE
  const calendarSync = useCallback(async (id) => {
    /** Trigger calendar synchronization for a reservation. */
    return apiCalendarSync(id);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (intervalMs) => {
      const ms = typeof intervalMs === "number" ? intervalMs : pollIntervalMs;
      if (!ms || ms <= 0) return;
      stopPolling();
      pollTimer.current = setInterval(() => {
        refresh().catch(() => {
          /* ignore polling errors */
        });
      }, ms);
    },
    [pollIntervalMs, refresh, stopPolling]
  );

  const isPolling = useMemo(() => !!pollTimer.current, []);

  // Initial fetch and optional polling
  useEffect(() => {
    isMounted.current = true;
    refresh();
    if (pollIntervalMs && pollIntervalMs > 0) {
      startPolling(pollIntervalMs);
    }
    return () => {
      isMounted.current = false;
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Optional WebSocket placeholder for future real-time updates
  useEffect(() => {
    if (!enableWebsocket || !wsUrl) return;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // eslint-disable-next-line no-console
        console.debug("[reservations:ws] connected");
        // Optionally subscribe to a channel, if protocol requires:
        // ws.send(JSON.stringify({ action: "subscribe", channel: "reservations" }));
      };

      ws.onmessage = (evt) => {
        // Expect messages like: { type: "reservation.updated" | "reservation.created" | "reservation.deleted" }
        try {
          const msg = JSON.parse(evt.data);
          if (msg && typeof msg === "object" && msg.type) {
            switch (msg.type) {
              case "reservation.updated":
              case "reservation.created":
              case "reservation.deleted":
                // For simplicity, trigger a refresh; could be optimized to patch local state
                refresh().catch(() => {});
                break;
              default:
                break;
            }
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onerror = () => {
        // eslint-disable-next-line no-console
        console.debug("[reservations:ws] error");
      };

      ws.onclose = () => {
        // eslint-disable-next-line no-console
        console.debug("[reservations:ws] disconnected");
      };
    } catch {
      // ignore WS construction errors
    }

    return () => {
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
        wsRef.current = null;
      }
    };
  }, [enableWebsocket, wsUrl, refresh]);

  return {
    data,
    loading,
    error,
    query,
    setQuery,
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
  };
}

export default useReservations;
