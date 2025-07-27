// lib/apiClient.ts
import { authService } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  timestamp?: string;
}

class ApiClient {
  private static instance: ApiClient;

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
        ...options.headers,
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          // Try to refresh token
          const refreshed = await authService.refreshToken();
          if (refreshed) {
            // Retry the request with new token
            const retryHeaders = {
              'Content-Type': 'application/json',
              ...authService.getAuthHeader(),
              ...options.headers,
            };
            
            const retryResponse = await fetch(url, {
              ...options,
              headers: retryHeaders,
            });
            
            if (retryResponse.ok) {
              return await retryResponse.json();
            }
          }
          
          // If refresh failed or retry failed, logout user
          await authService.logout();
        }
        
        return data;
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        status: 'error',
        error: 'Network error occurred',
        code: 'NETWORK_ERROR'
      };
    }
  }

  // HTTP methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }

  // File upload
  async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const url = `${API_BASE_URL}${endpoint}`;
      const headers = {
        ...authService.getAuthHeader(),
      };
      
      // Remove Content-Type for FormData
      delete headers['Content-Type'];

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      return await response.json();
    } catch (error) {
      console.error('File upload failed:', error);
      return {
        status: 'error',
        error: 'File upload failed',
        code: 'UPLOAD_ERROR'
      };
    }
  }

  // Specific API methods for common operations
  
  // Users
  async getUsers() {
    return this.get('/users');
  }

  async getUserById(id: string) {
    return this.get(`/users/${id}`);
  }

  async getUsersByRole(role: string) {
    return this.get(`/users/role/${role}`);
  }

  async createUser(userData: any) {
    return this.post('/users', userData);
  }

  async updateUser(id: string, userData: any) {
    return this.put(`/users/${id}`, userData);
  }

  async deleteUser(id: string) {
    return this.delete(`/users/${id}`);
  }

  // Admin operations
  async importData(table: string, file: File) {
    return this.uploadFile(`/admin/import/${table}`, file);
  }

  async clearDatabase() {
    return this.post('/admin/clear-database');
  }

  async getDataCounts() {
    return this.get('/admin/data-counts');
  }
}

export const apiClient = ApiClient.getInstance();
export default apiClient;
