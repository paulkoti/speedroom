// API Configuration
const isDevelopment = import.meta.env.DEV;
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Determine API base URL
export const API_BASE_URL = (() => {
  // Environment variable override
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Development mode
  if (isDevelopment || isLocalhost) {
    return 'http://localhost:3003';
  }
  
  // Production mode - always use HTTP for API on port 3003
  const hostname = window.location.hostname;
  
  // For speedroom.sovxeo.shop, use HTTP with port 3003
  return `http://${hostname}:3003`;
})();

console.log('🔗 API Base URL:', API_BASE_URL);

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  CHECK_AUTH: `${API_BASE_URL}/api/auth/check`,
  
  // Dashboard endpoints
  DASHBOARD_STATS: `${API_BASE_URL}/api/dashboard/stats`,
  DASHBOARD_ROOM: (roomId) => `${API_BASE_URL}/api/dashboard/room/${roomId}`,
  
  // Reports endpoints
  USAGE_REPORTS: `${API_BASE_URL}/api/reports/usage`,
  
  // Performance endpoints
  PERFORMANCE_METRICS: `${API_BASE_URL}/api/performance/metrics`
};

// Fetch wrapper with credentials
export const apiRequest = async (url, options = {}) => {
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response;
};