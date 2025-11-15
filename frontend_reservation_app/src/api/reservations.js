/**
 * Reservations API module
 * Provides typed helper functions for interacting with reservation endpoints.
 */

import { get, post, patch, del } from "./client";

/**
 * List reservations within an optional date range and/or by status.
 *
 * PUBLIC_INTERFACE
 * @param {Object} [params]
 * @param {string} [params.from] - ISO date/time string for start filter
 * @param {string} [params.to] - ISO date/time string for end filter
 * @param {string|string[]} [params.status] - Reservation status or list of statuses
 * @returns {Promise<any>} Resolves to list of reservations
 */
export function listReservations(params = {}) {
  return get("/reservations", { query: params });
}

/**
 * Create a new reservation.
 *
 * PUBLIC_INTERFACE
 * @param {Object} payload - Reservation payload (guest info, time, party size, etc.)
 * @returns {Promise<any>} Resolves to created reservation resource
 */
export function createReservation(payload) {
  return post("/reservations", { body: payload });
}

/**
 * Update an existing reservation by ID.
 *
 * PUBLIC_INTERFACE
 * @param {string|number} id - Reservation identifier
 * @param {Object} updates - Partial reservation fields to update
 * @returns {Promise<any>} Resolves to updated reservation resource
 */
export function updateReservation(id, updates) {
  return patch(`/reservations/${encodeURIComponent(id)}`, { body: updates });
}

/**
 * Delete a reservation by ID.
 *
 * PUBLIC_INTERFACE
 * @param {string|number} id - Reservation identifier
 * @returns {Promise<any>} Resolves to deletion result/ack
 */
export function deleteReservation(id) {
  return del(`/reservations/${encodeURIComponent(id)}`);
}

/**
 * Send an SMS related to a reservation.
 *
 * PUBLIC_INTERFACE
 * @param {string|number} id - Reservation identifier
 * @param {string} message - SMS message body
 * @returns {Promise<any>} Resolves to SMS dispatch result
 */
export function sendSms(id, message) {
  return post(`/reservations/${encodeURIComponent(id)}/send-sms`, {
    body: { message },
  });
}

/**
 * Generate a receipt for a reservation.
 *
 * PUBLIC_INTERFACE
 * @param {string|number} id - Reservation identifier
 * @returns {Promise<any>} Resolves to receipt data or generation status
 */
export function generateReceipt(id) {
  return post(`/reservations/${encodeURIComponent(id)}/receipt`);
}

/**
 * Sync a reservation to calendar.
 *
 * PUBLIC_INTERFACE
 * @param {string|number} id - Reservation identifier
 * @returns {Promise<any>} Resolves to calendar sync status
 */
export function calendarSync(id) {
  return post(`/reservations/${encodeURIComponent(id)}/calendar-sync`);
}

export default {
  listReservations,
  createReservation,
  updateReservation,
  deleteReservation,
  sendSms,
  generateReceipt,
  calendarSync,
};
