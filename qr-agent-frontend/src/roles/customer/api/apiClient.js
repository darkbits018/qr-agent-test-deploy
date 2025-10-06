const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * A wrapper around the fetch API to handle common logic like setting headers,
 * base URL, and parsing JSON responses and errors.
 *
 * @param {string} endpoint - The API endpoint to call (e.g., '/customer/menu').
 * @param {object} [options={}] - The options for the fetch request (method, body, etc.).
 * @returns {Promise<any>} - The JSON response from the API.
 * @throws {Error} - Throws an error if the network response is not ok.
 */
async function apiClient(endpoint, options = {}) {
  const { body, ...customConfig } = options;

  const headers = {
    'Content-Type': 'application/json',
  };

  // Add JWT token if available and not explicitly excluded
  if (options.useAuth !== false) {
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
      headers['Authorization'] = `Bearer ${jwt}`;
    }
  }

  const config = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
    mode: 'cors', // Ensure CORS mode is set for all requests
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${VITE_API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
    const errorMessage = errorData.error || response.statusText || 'Failed API request';
    throw new Error(errorMessage);
  }

  return response.json();
}

export default apiClient;
