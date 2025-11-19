import axios from 'axios';
import type { User, Property, Lead, Review, SearchFilters, Pagination } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
  withCredentials: false, // Don't send credentials for CORS
});

// Add token to requests
api.interceptors.request.use((config: any) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle token expiration and errors
api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      // Check if we're on a public page - NEVER redirect from public pages
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isPublicPage = 
          currentPath === '/' || 
          currentPath === '/properties' || 
          currentPath.startsWith('/properties/') ||
          currentPath === '/login' ||
          currentPath === '/register';
        
        // If we're on a public page, don't redirect - just clear auth silently
        if (isPublicPage) {
          localStorage.removeItem('token');
          localStorage.removeItem('auth-storage');
          window.dispatchEvent(new Event('storage'));
          return Promise.reject(error);
        }
        
        // Only redirect to login for protected endpoints (auth, wishlist, profile, admin)
        // Don't redirect for public endpoints (properties, leads without auth)
        const url = error.config?.url || '';
        const isProtectedEndpoint = 
          url.includes('/auth/') || 
          url.includes('/wishlist') || 
          url.includes('/admin') ||
          url.includes('/profile');
        
        if (isProtectedEndpoint) {
          localStorage.removeItem('token');
          localStorage.removeItem('auth-storage');
          // Clear auth store by dispatching storage event
          window.dispatchEvent(new Event('storage'));
          // Only redirect if not already on login page
          if (!currentPath.includes('/login')) {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { name: string; email: string; phone?: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: { name?: string; phone?: string }) =>
    api.put('/auth/profile', data),
  verifyToken: () => api.get('/auth/verify'),
};

// Properties API
export const propertiesApi = {
      getAll: (params?: SearchFilters & { page?: number; limit?: number; status?: string }) => {
        // Convert filters to query params
        const queryParams: any = {};
        if (params?.page) queryParams.page = params.page;
        if (params?.limit) queryParams.limit = params.limit;
        if (params?.status) queryParams.status = params.status;
        if (params?.search) queryParams.search = params.search;
        if (params?.category) queryParams.category = params.category;
        if (params?.purpose) queryParams.purpose = params.purpose;
        if (params?.subtype) queryParams.subtype = params.subtype;
        if (params?.minPrice) queryParams.minPrice = params.minPrice;
        if (params?.maxPrice) queryParams.maxPrice = params.maxPrice;
        if (params?.minArea) queryParams.minArea = params.minArea;
        if (params?.maxArea) queryParams.maxArea = params.maxArea;
        if (params?.bhk) queryParams.bhk = params.bhk;
        if (params?.bathrooms) queryParams.bathrooms = params.bathrooms;
        if (params?.furnishing) queryParams.furnishing = params.furnishing;
        if (params?.availableFor && params.availableFor.length > 0) {
          queryParams.availableFor = params.availableFor;
        }
        if (params?.availableFrom) queryParams.availableFrom = params.availableFrom;
        if (params?.constructionStatus) queryParams.constructionStatus = params.constructionStatus;
        if (params?.investmentType && params.investmentType.length > 0) {
          queryParams.investmentType = params.investmentType;
        }
        if (params?.powerCapacity) queryParams.powerCapacity = params.powerCapacity;
        if (params?.meetingRooms !== undefined) queryParams.meetingRooms = params.meetingRooms;
        if (params?.pantry !== undefined) queryParams.pantry = params.pantry;
        if (params?.conferenceRoom !== undefined) queryParams.conferenceRoom = params.conferenceRoom;
        if (params?.cabins) queryParams.cabins = params.cabins;
        if (params?.washrooms) queryParams.washrooms = params.washrooms;
        if (params?.floorPreference) queryParams.floorPreference = params.floorPreference;
        if (params?.locatedOn) queryParams.locatedOn = params.locatedOn;
        if (params?.officeSpread) queryParams.officeSpread = params.officeSpread;
        if (params?.situatedIn) queryParams.situatedIn = params.situatedIn;
        if (params?.businessType && params.businessType.length > 0) {
          queryParams.businessType = params.businessType;
        }
        if (params?.city) queryParams.city = params.city;
        if (params?.state) queryParams.state = params.state;
        if (params?.locality) queryParams.locality = params.locality;
        if (params?.amenities && params.amenities.length > 0) {
          queryParams.amenities = params.amenities;
        }
        if (params?.reraApproved !== undefined) queryParams.reraApproved = params.reraApproved;
        if (params?.ageOfProperty) queryParams.ageOfProperty = params.ageOfProperty;
        if (params?.possessionStatus) queryParams.possessionStatus = params.possessionStatus;
        if (params?.facing) queryParams.facing = params.facing;
        if (params?.parking) queryParams.parking = params.parking;
        if (params?.sortBy) queryParams.sortBy = params.sortBy;
        return api.get('/properties', { params: queryParams });
      },
  getById: (id: string) => api.get(`/properties/${id}`),
  create: (data: { title: string; payload: any }) =>
    api.post('/properties', data),
  update: (id: string, data: { title?: string; payload?: any; status?: string }) =>
    api.put(`/properties/${id}`, data),
  delete: (id: string) => api.delete(`/properties/${id}`),
  search: (filters: SearchFilters & { page?: number; limit?: number }) =>
    propertiesApi.getAll({ ...filters, page: filters.page, limit: filters.limit }),
  getSimilar: (id: string, limit?: number) =>
    api.get(`/properties/${id}/similar`, { params: { limit } }),
};

// Leads API
export const leadsApi = {
  create: (data: { name: string; email: string; phone: string; property_id?: string; message?: string }) =>
    api.post('/leads', data),
  getAll: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get('/leads', { params }),
  getById: (id: string) => api.get(`/leads/${id}`),
  updateStatus: (id: string, status: string) =>
    api.put(`/leads/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/leads/${id}`),
  exportCSV: () => api.get('/leads/export/csv', { responseType: 'blob' }),
};

// Wishlist API
export const wishlistApi = {
  getAll: () => api.get('/wishlist'),
  add: (property_id: string) => api.post('/wishlist', { property_id }),
  remove: (property_id: string) => api.delete(`/wishlist/${property_id}`),
};

// Admin API
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params?: { page?: number; limit?: number; role?: string; search?: string }) =>
    api.get('/admin/users', { params }),
  updateUserStatus: (id: string, is_active: boolean) =>
    api.put(`/admin/users/${id}/status`, { is_active }),
  updateUserRole: (id: string, role: 'user' | 'admin') =>
    api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getAnalytics: (params?: { dateRange?: string }) => api.get('/admin/analytics', { params }),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data: { logo?: string }) => api.put('/admin/settings', data),
};

// Public Settings API (no auth required)
export const settingsApi = {
  getPublicSettings: () => api.get('/admin/settings/public'),
};


// Media API
export const mediaApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const isVideo = file.type.startsWith('video/');
    // Use longer timeout for videos (10 minutes) and shorter for images (30 seconds)
    const timeout = isVideo ? 10 * 60 * 1000 : 30 * 1000;
    return api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout,
      onUploadProgress: (progressEvent: any) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Progress can be handled by the component
        }
      },
    });
  },
  uploadMultiple: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const hasVideo = files.some(file => file.type.startsWith('video/'));
    // Use longer timeout if any video is present
    const timeout = hasVideo ? 10 * 60 * 1000 : 30 * 1000;
    return api.post('/media/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout,
    });
  },
};

// Locations API
export const locationsApi = {
  search: (query: string) => api.get('/locations', { params: { query } }),
};

// Drafts API
export const draftsApi = {
  getAll: () => api.get('/drafts'),
  create: (data: { title?: string; payload?: any }) =>
    api.post('/drafts', data),
  update: (id: string, data: { title?: string; payload?: any }) =>
    api.put(`/drafts/${id}`, data),
  delete: (id: string) => api.delete(`/drafts/${id}`),
};

// Reviews API
export const reviewsApi = {
  create: (data: { property_id: string; rating: number; comment?: string }) =>
    api.post('/reviews', data),
  getByProperty: (property_id: string) =>
    api.get(`/reviews/property/${property_id}`),
  approve: (id: string) => api.put(`/reviews/${id}/approve`),
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

// Amenities API
export const amenitiesApi = {
  getAll: () => api.get('/amenities'),
  create: (data: { name: string; category?: string }) =>
    api.post('/amenities', data),
  update: (id: string, data: { name: string; category?: string }) =>
    api.put(`/amenities/${id}`, data),
  delete: (id: string) => api.delete(`/amenities/${id}`),
};

export default api;

