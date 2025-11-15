import React from "react";
import { Routes, Route } from "react-router-dom";

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
  return (
    <PageContainer title="Dashboard">
      <p>Overview of today’s reservations and quick actions will appear here.</p>
    </PageContainer>
  );
}

export function ReservationsPage() {
  return (
    <PageContainer title="Reservations">
      <p>Book a table, view upcoming reservations, and manage guest details.</p>
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
