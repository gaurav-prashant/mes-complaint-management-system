/**
 * Dynamically computes the API Base URL for HTTP requests.
 * 
 * - In Development:
 *   If accessed from desktop localhost -> http://localhost:5000/api
 *   If accessed from mobile/LAN (e.g. http://192.168.1.24:3000) -> http://192.168.1.24:5000/api
 * 
 * - In Production:
 *   Uses VITE_API_URL environment variable if set, otherwise relative path /api.
 */
export function getApiBase() {
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl && !envApiUrl.includes('localhost') && !envApiUrl.includes('127.0.0.1')) {
    return envApiUrl;
  }
  if (import.meta.env.DEV) {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      return `http://${window.location.hostname}:5000/api`;
    }
    return 'http://localhost:5000/api';
  }
  return envApiUrl || '/api';
}

export default getApiBase;
