// src/roles/orgadmin/api/orgadminApiClient.js

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * API client specifically for orgadmin that supports FormData (multipart/form-data).
 */
async function orgadminApiClient(endpoint, options = {}) {
    const { body, method = body ? 'POST' : 'GET', useAuth = true, ...customConfig } = options;

    const config = {
        method,
        ...customConfig,
        mode: 'cors',
    };

    // Handle authentication
    if (useAuth) {
        const token = localStorage.getItem('orgadmin_token1');
        if (token) {
            config.headers = {
                ...config.headers,
                Authorization: `Bearer ${token}`,
            };
        }
    }

    // Special handling for FormData
    if (body instanceof FormData) {
        // DO NOT set Content-Type — browser will set it with correct boundary
        config.body = body;
    } else {
        // Default to JSON
        config.headers = {
            'Content-Type': 'application/json',
            ...config.headers,
        };
        config.body = body ? JSON.stringify(body) : undefined;
    }

    const response = await fetch(`${VITE_API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || response.statusText || 'API request failed');
    }

    return response.json();
}

export default orgadminApiClient;