//
//
// Champagne Theme configuration and CSS variables injection
//

// PUBLIC_INTERFACE
export const theme = {
  name: "Champagne",
  colors: {
    primary: "#D97706",
    secondary: "#F3F4F6",
    background: "#FFFBEB",
    surface: "#FFFFFF",
    text: "#374151",
    success: "#10B981",
    error: "#EF4444",
  },
  gradient: {
    from: "#FFFBEB", // amber-50-ish
    to: "#FDE68A",   // amber-300-ish for a soft end tone
  },
};

/**
 * Injects CSS variables to document root based on the Champagne theme.
 * This keeps styling centralized in CSS variables for easy usage across the app.
 */
// PUBLIC_INTERFACE
export function applyThemeCSSVariables() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--color-primary", theme.colors.primary);
  root.style.setProperty("--color-secondary", theme.colors.secondary);
  root.style.setProperty("--color-background", theme.colors.background);
  root.style.setProperty("--color-surface", theme.colors.surface);
  root.style.setProperty("--color-text", theme.colors.text);
  root.style.setProperty("--color-success", theme.colors.success);
  root.style.setProperty("--color-error", theme.colors.error);
  root.style.setProperty("--gradient-from", theme.gradient.from);
  root.style.setProperty("--gradient-to", theme.gradient.to);
}

/**
 * Compute a safe React Router basename from environment.
 * Accepts REACT_APP_FRONTEND_URL which may be a full URL or a path.
 * Returns a relative path suitable for BrowserRouter.basename, defaulting to "/".
 *
 * Examples:
 * - "https://example.com/app" -> "/app"
 * - "https://example.com/nested/app/" -> "/nested/app"
 * - "/app" -> "/app"
 * - "" or undefined -> "/"
 */
// PUBLIC_INTERFACE
export function getRouterBasename() {
  const env = process.env.REACT_APP_FRONTEND_URL;
  if (!env || typeof env !== "string") return "/";

  const s = env.trim();
  // If it already looks like a path, normalize it and return
  if (s.startsWith("/")) {
    return normalizePathOnly(s);
  }

  // Try parsing as a URL and extract pathname
  try {
    const u = new URL(s);
    return normalizePathOnly(u.pathname || "/");
  } catch {
    // Fallback: not a URL and not a path — use root
    return "/";
  }
}

/**
 * Returns the frontend URL if set, otherwise empty string.
 * Useful for displaying environment info; not for Router basename.
 */
// PUBLIC_INTERFACE
export function getFrontendBaseUrl() {
  return process.env.REACT_APP_FRONTEND_URL || "";
}

/** Ensure path-only format for basename: always starts with "/", no trailing "/". */
function normalizePathOnly(pathname) {
  const p = pathname.trim();
  if (!p) return "/";
  // Ensure leading slash
  const withLead = p.startsWith("/") ? p : `/${p}`;
  // Remove trailing slash except for root "/"
  return withLead !== "/" && withLead.endsWith("/") ? withLead.slice(0, -1) : withLead;
}
