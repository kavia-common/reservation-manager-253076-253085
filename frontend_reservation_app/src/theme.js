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
 * Returns the current frontend URL from environment for use when needed by router or links.
 * No API integration is implemented yet.
 */
// PUBLIC_INTERFACE
export function getFrontendBaseUrl() {
  /** This uses REACT_APP_FRONTEND_URL if present, otherwise defaults to "/" */
  return process.env.REACT_APP_FRONTEND_URL || "/";
}
