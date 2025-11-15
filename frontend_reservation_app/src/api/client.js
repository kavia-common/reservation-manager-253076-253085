//
// Generic API client for the Reservation frontend
// - Reads base URL from REACT_APP_API_BASE || REACT_APP_BACKEND_URL
// - Provides JSON request helpers with normalized errors
// - Adds default JSON headers and supports query param building
// - Optional debug logs via REACT_APP_LOG_LEVEL
//

const LOG_LEVEL = (process.env.REACT_APP_LOG_LEVEL || "info").toLowerCase();
const IS_DEBUG = LOG_LEVEL === "debug" || LOG_LEVEL === "trace";
const REDACTED = "[REDACTED]";

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /**
   * Returns the API base URL using environment configuration.
   * Prefers REACT_APP_API_BASE, falling back to REACT_APP_BACKEND_URL.
   */
  const base = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "";
  return trimTrailingSlash(base);
}

/**
 * Build a URL by joining base + path and appending query parameters.
 * Ensures no duplicate slashes and encodes query values.
 * Avoid logging PII; only log keys (not values) when in debug.
 * @param {string} path - Path beginning with or without '/'
 * @param {Record<string, any>} [query] - Optional query params
 * @returns {string} Full URL
 */
export function buildUrl(path, query) {
  const base = getApiBaseUrl();
  const cleanPath = normalizePath(path);
  const url = `${base}${cleanPath}`;

  if (!query || Object.keys(query).length === 0) {
    if (IS_DEBUG) safeDebug("buildUrl", { path: cleanPath, queryKeys: [] });
    return url;
  }

  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    // Support arrays by repeating keys
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== undefined && v !== null && v !== "") {
          searchParams.append(key, String(v));
        }
      });
    } else {
      searchParams.append(key, String(value));
    }
  });

  const full = `${url}?${searchParams.toString()}`;
  if (IS_DEBUG) safeDebug("buildUrl", { path: cleanPath, queryKeys: Object.keys(query) });
  return full;
}

/**
 * Make a JSON request with normalized errors.
 * - Adds Content-Type: application/json by default (overridable)
 * - Parses JSON responses when Content-Type is JSON, otherwise returns text
 * - Normalizes errors to include status, code, message, and details when present
 * @param {string} method - HTTP method
 * @param {string} path - Resource path
 * @param {Object} [options]
 * @param {Object} [options.query] - Query params
 * @param {Object} [options.body] - JSON payload
 * @param {Object} [options.headers] - Extra headers
 * @returns {Promise<any>} Parsed response
 */
async function request(method, path, { query, body, headers } = {}) {
  const url = buildUrl(path, query);

  const init = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  if (IS_DEBUG) {
    // Do not log body to avoid PII; just the presence and keys
    safeDebug("request:init", {
      method,
      url,
      hasBody: body !== undefined,
      bodyKeys: body && typeof body === "object" ? Object.keys(body) : [],
      headerKeys: Object.keys(init.headers || {}),
    });
  }

  let res;
  try {
    res = await fetch(url, init);
  } catch (networkErr) {
    const err = normalizeError(networkErr, {
      status: 0,
      message: "Network request failed",
      code: "NETWORK_ERROR",
    });
    if (IS_DEBUG) safeDebug("request:error", sanitizeErrorForLog(err));
    throw err;
  }

  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const isJson = contentType.includes("application/json");

  let payload;
  try {
    payload = isJson ? await res.json() : await res.text();
  } catch (parseErr) {
    // Response not parseable
    payload = null;
  }

  if (!res.ok) {
    const err = normalizeResponseError(res, payload);
    if (IS_DEBUG) safeDebug("request:response_error", sanitizeErrorForLog(err));
    throw err;
  }

  if (IS_DEBUG) {
    safeDebug("request:response_ok", {
      status: res.status,
      ok: res.ok,
      type: isJson ? "json" : "text",
    });
  }

  return payload;
}

/**
 * Normalize any error into a standard shape.
 * @param {any} error - Original error
 * @param {Object} [fallback] - Fallback error metadata
 * @returns {{ status:number, code:string, message:string, details?:any, raw?:any }}
 */
function normalizeError(error, fallback = {}) {
  const base = {
    status: typeof fallback.status === "number" ? fallback.status : 500,
    code: fallback.code || "UNKNOWN_ERROR",
    message: fallback.message || (error && error.message) || "Unexpected error",
    details: fallback.details || undefined,
  };
  return { ...base, raw: error };
}

/**
 * Normalize API response errors using common API error shapes.
 * Tries to extract code/message/details from a JSON payload when available.
 * @param {Response} res
 * @param {any} payload
 */
function normalizeResponseError(res, payload) {
  // Common backend error shapes:
  // - { error: { code, message, details } }
  // - { code, message, details }
  // - { message }
  let code = "API_ERROR";
  let message = `Request failed with status ${res.status}`;
  let details;

  if (payload && typeof payload === "object") {
    if (payload.error && typeof payload.error === "object") {
      code = payload.error.code || code;
      message = payload.error.message || message;
      details = payload.error.details;
    } else {
      code = payload.code || code;
      message = payload.message || message;
      details = payload.details;
    }
  } else if (typeof payload === "string" && payload.trim()) {
    message = payload;
  }

  return {
    status: res.status,
    code,
    message,
    details,
  };
}

/**
 * Debug log safe metadata (no PII). Only logs when IS_DEBUG is true.
 * @param {string} scope
 * @param {Record<string, any>} meta
 */
function safeDebug(scope, meta = {}) {
  if (!IS_DEBUG) return;
  try {
    // Avoid logging values that could contain PII; log only keys and booleans
    const sanitized = Object.fromEntries(
      Object.entries(meta).map(([k, v]) => {
        if (typeof v === "string") return [k, REDACTED];
        if (Array.isArray(v)) return [k, v.map(() => REDACTED)];
        if (v && typeof v === "object") return [k, Object.keys(v)];
        return [k, v];
      })
    );
    // eslint-disable-next-line no-console
    console.debug(`[api:${scope}]`, sanitized);
  } catch {
    // ignore logging failures
  }
}

function trimTrailingSlash(s) {
  if (!s) return "";
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

function normalizePath(p) {
  if (!p) return "";
  return p.startsWith("/") ? p : `/${p}`;
}

// PUBLIC_INTERFACE
export async function get(path, options = {}) {
  /**
   * Perform a GET request.
   * @param {string} path - URL path
   * @param {{query?:object, headers?:object}} [options]
   * @returns {Promise<any>} Response payload
   */
  return request("GET", path, options);
}

// PUBLIC_INTERFACE
export async function post(path, options = {}) {
  /**
   * Perform a POST request.
   * @param {string} path - URL path
   * @param {{query?:object, headers?:object, body?:object}} [options]
   * @returns {Promise<any>} Response payload
   */
  return request("POST", path, options);
}

// PUBLIC_INTERFACE
export async function patch(path, options = {}) {
  /**
   * Perform a PATCH request.
   * @param {string} path - URL path
   * @param {{query?:object, headers?:object, body?:object}} [options]
   * @returns {Promise<any>} Response payload
   */
  return request("PATCH", path, options);
}

// PUBLIC_INTERFACE
export async function del(path, options = {}) {
  /**
   * Perform a DELETE request.
   * @param {string} path - URL path
   * @param {{query?:object, headers?:object, body?:object}} [options]
   * @returns {Promise<any>} Response payload
   */
  return request("DELETE", path, options);
}

// PUBLIC_INTERFACE
export default {
  getApiBaseUrl,
  buildUrl,
  get,
  post,
  patch,
  del,
};
