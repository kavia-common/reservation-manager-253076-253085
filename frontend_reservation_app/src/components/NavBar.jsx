import { Link, NavLink, useLocation } from "react-router-dom";
import React from "react";

/**
 * Top navigation bar for the reservation app.
 * Renders links to Dashboard, Reservations, and Settings.
 * If a theme toggle is provided via props, it will render a toggle button.
 *
 * Props:
 * - onToggleTheme?: () => void - optional theme toggle handler
 * - currentTheme?: "light" | "dark" - current theme, used to label the toggle
 */
// PUBLIC_INTERFACE
export default function NavBar({ onToggleTheme, currentTheme }) {
  const location = useLocation();

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand" aria-label="Reservation Manager Home">
          <span className="brand-icon">🥂</span>
          <span className="brand-text">Reservation Manager</span>
        </Link>

        <div className="links">
          <NavLink to="/" end className={({ isActive }) => linkClass(isActive, location.pathname === "/")}>
            Dashboard
          </NavLink>
          <NavLink to="/reservations" className={({ isActive }) => linkClass(isActive)}>
            Reservations
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => linkClass(isActive)}>
            Settings
          </NavLink>
        </div>

        <div className="actions">
          {typeof onToggleTheme === "function" && (
            <button
              className="btn-toggle"
              onClick={onToggleTheme}
              aria-label={`Switch to ${currentTheme === "light" ? "dark" : "light"} mode`}
            >
              {currentTheme === "light" ? "🌙" : "☀️"}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function linkClass(isActive, isExact = false) {
  const base = "nav-link";
  const active = isActive || isExact ? " active" : "";
  return base + active;
}
