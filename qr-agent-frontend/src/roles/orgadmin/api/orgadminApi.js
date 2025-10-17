import { jwtDecode } from 'jwt-decode';
import apiClient from '../../customer/api/apiClient';

const LOGIN_URL = `${import.meta.env.VITE_API_BASE_URL}/org-admin/login`;
const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/organizations`;

export const orgadminApi = {
  // Login: Authenticate and store JWT
  login: async (credentials) => {
    console.log('🔐 Logging in with credentials:', credentials);

    try { // Login often has a different flow, so keeping fetch here is fine.
      console.log('🌐 Sending login request to:', LOGIN_URL);
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        mode: 'cors',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Login failed. Response status:', response.status);
        console.error('❌ Login failed. Response data:', errorData);
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      console.log('✅ Login successful. Response data:', data);

      // Save only the token to localStorage
      const token = data.org_admin_token || data.token;
      if (!token) {
        console.error('❌ No token found in login response:', data);
        throw new Error('No token received from the server.');
      }

      // Store token as orgadmin_token1 everywhere
      localStorage.setItem('orgadmin_token1', token);

      // Decode token and store organization_id for later use
      try {
        const decodedToken = jwtDecode(token);
        const organizationId = decodedToken.identity?.org_id;
        if (organizationId) {
          localStorage.setItem('organization_id', organizationId);
        }
      } catch (decodeError) {
        console.error('❌ Failed to decode token:', decodeError.message);
      }

      return data;
    } catch (error) {
      console.error('🚨 Login error:', error.message);
      throw new Error('Authentication failed. Check your credentials.');
    }
  },

  // Fetch menu items
  getMenuItems: async () => {
    try {
      const data = await apiClient('/api/organizations/menu/items');
      // Sanitize data to prevent crashes on the frontend from null values
      const sanitizedData = data.map(item => ({
        ...item,
        name: item.name || '',
        category: item.category || '',
        dietary_preference: item.dietary_preference || '',
      }));

      console.log('✅ Menu items retrieved and sanitized:', sanitizedData);
      return sanitizedData;
    } catch (error) {
      console.error('🔥 Error in getMenuItems:', error.message);
      throw error;
    }
  },

  // Create a menu item
  createMenuItem: async (menuItemData, imageFiles = []) => {
    const formData = new FormData();

    // Append fields
    formData.append('name', menuItemData.name);
    formData.append('price', menuItemData.price);
    if (menuItemData.category) formData.append('category', menuItemData.category);
    if (menuItemData.dietary_preference) formData.append('dietary_preference', menuItemData.dietary_preference);
    if (menuItemData.available_times) formData.append('available_times', menuItemData.available_times);

    // Append images (up to 4)
    imageFiles.slice(0, 4).forEach(file => {
      formData.append('images', file);
    });

    try {
      return await apiClient('/api/organizations/menu/items', {
        method: 'POST',
        body: formData,
        useFormData: true, // Signal to apiClient to not set Content-Type
      });
    } catch (error) {
      throw error;
    }
  },

  // Bulk import menu items
  bulkImportMenuItems: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      return await apiClient('/api/organizations/menu/items/bulk', {
        method: 'POST',
        body: formData,
        useFormData: true,
      });
    } catch (error) {
      throw error;
    }
  },

  // Update a menu item
  updateMenuItem: async (id, item, imageFiles = []) => {
    const formData = new FormData();

    // Define the exact fields the backend update endpoint accepts.
    const allowedFields = ['name', 'price', 'category', 'dietary_preference', 'available_times', 'is_available'];

    // Append only the allowed fields to the FormData.
    for (const key of allowedFields) {
      // Check if the item object has the property and it's not null/undefined.
      if (Object.prototype.hasOwnProperty.call(item, key) && item[key] !== null && item[key] !== undefined) {
        if (key === 'is_available') {
          // The backend expects 'is_available' as a string 'true'/'false'.
          formData.append(key, String(item[key]));
        } else {
          formData.append(key, item[key]);
        }
      }
    }

    // Handle image uploads.
    // Only append images if new files are selected.
    if (imageFiles.length > 0) {
      imageFiles.forEach(file => {
        formData.append('images', file);
      });
    }

    try {
      return await apiClient(`/api/organizations/menu/items/${id}`, {
        method: 'PUT',
        body: formData,
        useFormData: true,
      });
    } catch (error) {
      throw error;
    }
  },

  // Delete a menu item
  deleteMenuItem: (id) => {
    return apiClient(`/api/organizations/menu/items/${id}`, {
      method: 'DELETE',
    });
  },

  // Fetch tables
  getTables: async () => {
    console.log('📥 Fetching tables...');
    const token = orgadminApi._getToken();

    try {
      console.log('🌐 Sending GET request to:', `${API_URL}/tables`);
      const response = await fetch(`${API_URL}/tables`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Failed to fetch tables. Response status:', response.status);
        console.error('❌ Failed to fetch tables. Response data:', errorData);
        throw new Error(errorData.msg || 'Unable to fetch tables.');
      }

      const data = await response.json();
      console.log('✅ Tables retrieved:', data);
      return data;
    } catch (error) {
      console.error('🔥 Error in getTables:', error.message);
      throw error;
    }
  },

  // Bulk create tables
  bulkCreateTables: async (count) => {
    const token = orgadminApi._getToken();
    try {
      console.log('🌐 Sending POST request to:', `${API_URL}/tables/bulk`);
      const response = await fetch(`${API_URL}/tables/bulk`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ count }),
      });

      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('❌ Failed to bulk create tables. JSON Error:', errorData);
          throw new Error(errorData.error || 'Failed to bulk create tables.');
        } else {
          const text = await response.text();
          console.error('🧨 HTML Error Response:', text);
          throw new Error('Server error (non-JSON). Check backend logs.');
        }
      }

      const data = await response.json();
      console.log('✅ Tables bulk created:', data);
      return data;
    } catch (error) {
      console.error('🔥 Error in bulkCreateTables:', error.message);
      throw error;
    }
  },

  // Add tables
  addTables: async (input) => {
    const token = orgadminApi._getToken();

    try {
      let payload;

      if (Array.isArray(input)) {
        console.log("🎯 Input is an array of table names:", input);
        const sanitizedTables = input
          .map(num => (typeof num === "string" ? { number: num.trim() } : null))
          .filter(table => table !== null);

        if (sanitizedTables.length === 0) {
          console.error("🚫 No valid table names in the array.");
          throw new Error("No valid table names provided.");
        }

        payload = { tables: sanitizedTables };
      } else if (input && typeof input === "object" && typeof input.number === "string") {
        console.log("🎯 Input is a single table object:", input);
        payload = { number: input.number.trim() };
      } else {
        console.error("🚨 Invalid input format:", input);
        throw new Error("Input must be a table object or an array of table names.");
      }

      const apiUrl = `${API_URL}/tables`;
      console.log("🌐 Sending POST request to:", apiUrl);
      console.log("📤 Payload:", payload);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        let errorDetails = {};
        if (contentType && contentType.includes('application/json')) {
          errorDetails = await response.json();
        } else {
          const text = await response.text();
          console.error("🧨 HTML Error Response:", text);
          throw new Error('Server returned non-JSON error.');
        }

        console.error("❌ Failed to add tables. Status:", response.status);
        console.error("❌ Error details:", errorDetails);
        throw new Error(errorDetails.error || 'Failed to add tables.');
      }

      const data = await response.json();
      console.log("✅ Tables added successfully:", data);
      return data;

    } catch (error) {
      console.error("🔥 Error in addTables:", error.message);
      throw error;
    }
  },

  // Delete tables
  deleteTables: async (tableIds) => {
    const token = orgadminApi._getToken();

    try {
      if (!Array.isArray(tableIds)) {
        throw new Error("Input must be an array of table IDs");
      }

      console.log('🌐 Sending DELETE request to:', `${API_URL}/tables`);
      const response = await fetch(`${API_URL}/tables`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ table_ids: tableIds }),
      });

      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        let errorDetails = {};
        if (contentType && contentType.includes('application/json')) {
          errorDetails = await response.json();
        } else {
          const text = await response.text();
          console.error("🧨 HTML Error Response:", text);
          throw new Error('Server returned non-JSON error.');
        }

        console.error('❌ Failed to delete tables. Status:', response.status);
        console.error('❌ Error details:', errorDetails);
        throw new Error(errorDetails.error || 'Failed to delete tables.');
      }

      const data = await response.json();
      console.log('✅ Tables deleted:', data);
      return data;
    } catch (error) {
      console.error('🔥 Error in deleteTables:', error.message);
      throw error;
    }
  },

  // Add a new staff member
  createStaffMember: async (staffData) => {
    const token = orgadminApi._getToken();
    try {
      const response = await apiClient('/staff', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(staffData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create staff member.');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },
};
