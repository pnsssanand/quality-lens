import axios from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Firebase ID token to every request
apiClient.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // In local dev mode, supply a mock Bearer token so dev endpoints work seamlessly
      config.headers.Authorization = 'Bearer dev-demo-token';
    }
  } catch (err) {
    console.warn('Could not attach Firebase auth token:', err);
    config.headers.Authorization = 'Bearer dev-demo-token';
  }
  return config;
});

export const api = {
  // Auth
  verifyToken: () => apiClient.post('/auth/verify'),

  // Dashboard
  getDashboardSummary: (params?: any) => apiClient.get('/dashboard/summary', { params }),
  getDefectTrends: (params?: any) => apiClient.get('/dashboard/defect-trends', { params }),
  getDefectsByCategory: (params?: any) => apiClient.get('/dashboard/defects-by-category', { params }),
  getLineComparison: (params?: any) => apiClient.get('/dashboard/production-line-comparison', { params }),
  getRecentInvestigations: () => apiClient.get('/dashboard/recent-investigations'),

  // Analytics
  getFilterOptions: () => apiClient.get('/analytics/filter-options'),
  getParetoAnalysis: (params?: any) => apiClient.get('/analytics/pareto', { params }),
  getDefectAnalysis: (params?: any) => apiClient.get('/analytics/defect-analysis', { params }),
  getMachinePerformance: (params?: any) => apiClient.get('/analytics/machine-performance', { params }),
  getAnomalies: () => apiClient.get('/analytics/anomalies'),

  // Imports
  uploadCSV: (formData: FormData) => apiClient.post('/imports/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  commitImport: (importId: string) => apiClient.post(`/imports/${importId}/commit`),
  listImports: () => apiClient.get('/imports'),
  downloadTemplateUrl: `${API_BASE_URL}/imports/template`,

  // Investigations
  listInvestigations: (params?: any) => apiClient.get('/investigations', { params }),
  getInvestigation: (id: number) => apiClient.get(`/investigations/${id}`),
  createInvestigation: (data: any) => apiClient.post('/investigations', data),
  updateInvestigation: (id: number, data: any) => apiClient.put(`/investigations/${id}`, data),

  // Monitoring
  getThresholds: () => apiClient.get('/monitoring/thresholds'),
  updateThresholds: (data: { normal_max: number; warning_max: number }) => apiClient.put('/monitoring/thresholds', data),
  getMonitoringStatus: () => apiClient.get('/monitoring/status'),

  // Images
  listImages: (params?: any) => apiClient.get('/images', { params }),
  registerImage: (data: any) => apiClient.post('/images', data),
  deleteImage: (imageId: string) => apiClient.delete(`/images/${imageId}`),

  // Reports
  generateReport: (data: any) => apiClient.post('/reports/generate', data, { responseType: 'blob' }),

  // Sync
  getSyncStatus: () => apiClient.get('/sync/status'),
  triggerSync: () => apiClient.post('/sync/run'),
};
