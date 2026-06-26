/**
 * API Configuration Helper
 * 
 * In local development, VITE_API_URL is empty and Vite's proxy handles
 * forwarding /api/* requests to the Express backend on port 5000.
 * 
 * In production (Vercel), VITE_API_URL is set to the Render backend URL
 * (e.g. https://rocky-shoes-api.onrender.com) so fetch calls go directly
 * to the deployed Express server.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Prepends the API base URL to a path.
 * @param {string} path - API path starting with /api/...
 * @returns {string} Full URL for the API endpoint
 * 
 * @example
 * apiUrl('/api/payment/order') 
 * // Local:  '/api/payment/order'
 * // Prod:   'https://rocky-shoes-api.onrender.com/api/payment/order'
 */
export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

export default API_BASE;
