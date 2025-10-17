// src/roles/orgadmin/api/orgadminApi.js

import { jwtDecode } from 'jwt-decode';
import orgadminApiClient from './orgadminApiClient';

const LOGIN_URL = `${import.meta.env.VITE_API_BASE_URL}/org-admin/login`;
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

export const orgadminApi = {
  // Login
  login: async (credentials) => {
    console.log('🔐 Logging in with credentials:', credentials);
    try {
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        mode: 'cors',
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Login failed:', errorData);
        throw new Error(errorData.error || 'Login failed');
      }
      const data = await response.json();
      const token = data.org_admin_token || data.token;
      if (!token) throw new Error('No token received');

      localStorage.setItem('orgadmin_token1', token);
      try {
        const decoded = jwtDecode(token);
        const orgId = decoded.identity?.org_id;
        if (orgId) localStorage.setItem('organization_id', orgId);
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
      return data;
    } catch (error) {
      console.error('🚨 Login error:', error);
      throw new Error('Authentication failed');
    }
  },

  // Fetch menu items
  getMenuItems: async () => {
    const data = await orgadminApiClient('/api/organizations/menu/items');
    return Array.isArray(data) ? data : data.menu_items || [];
  },

  // Create menu item
  createMenuItem: async (menuItemData, imageFiles = []) => {
    const formData = new FormData();
    formData.append('name', menuItemData.name);
    formData.append('price', menuItemData.price);
    if (menuItemData.category) formData.append('category', menuItemData.category);
    if (menuItemData.dietary_preference) formData.append('dietary_preference', menuItemData.dietary_preference);
    if (menuItemData.available_times) formData.append('available_times', menuItemData.available_times);
    imageFiles.slice(0, 4).forEach(file => formData.append('images', file));
    return await orgadminApiClient('/api/organizations/menu/items', {
      method: 'POST',
      body: formData,
    });
  },

  // Update menu item
  updateMenuItem: async (id, item, imageFiles = []) => {
    const formData = new FormData();
    const allowedFields = ['name', 'price', 'category', 'dietary_preference', 'available_times', 'is_available'];
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(item, key) && item[key] !== null && item[key] !== undefined) {
        if (key === 'is_available') {
          formData.append(key, String(item[key]));
        } else {
          formData.append(key, item[key]);
        }
      }
    }
    if (imageFiles.length > 0) {
      imageFiles.forEach(file => formData.append('images', file));
    }
    return await orgadminApiClient(`/api/organizations/menu/items/${id}`, {
      method: 'PUT',
      body: formData,
    });
  },

  // Delete menu item
  deleteMenuItem: (id) => {
    return orgadminApiClient(`/api/organizations/menu/items/${id}`, { method: 'DELETE' });
  },

  // Bulk import
  bulkImportMenuItems: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return await orgadminApiClient('/api/organizations/menu/items/bulk', {
      method: 'POST',
      body: formData,
    });
  },

  // Tables API (using orgadminApiClient)
  getTables: async () => {
    return await orgadminApiClient('/tables');
  },
  bulkCreateTables: async (count) => {
    return await orgadminApiClient('/tables/bulk', {
      method: 'POST',
      body: { count },
    });
  },
  addTables: async (payload) => {
    return await orgadminApiClient('/tables', {
      method: 'POST',
      body: payload,
    });
  },
  deleteTables: async (tableIds) => {
    return await orgadminApiClient('/tables', {
      method: 'DELETE',
      body: { table_ids: tableIds },
    });
  },

  // Staff
  createStaffMember: async (staffData) => {
    return await orgadminApiClient('/staff', {
      method: 'POST',
      body: staffData,
    });
  },
};