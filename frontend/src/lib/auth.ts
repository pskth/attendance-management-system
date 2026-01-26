// lib/auth.ts
import Cookies from './cookies';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface User {
  id: string;
  username: string;
  email?: string;
  name: string;
  phone?: string;
  roles: string[];
  primaryRole: string;
  profile?: {
    type: 'student' | 'teacher' | 'admin';
    [key: string]: any;
  };
}

export interface AuthResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    user: User;
    token: string;
    expiresIn: string;
  };
  error?: string;
  code?: string;
}

class AuthService {
  private static instance: AuthService;
  private user: User | null = null;
  private token: string | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;

    const token = Cookies.get('auth_token');
    const userData = Cookies.get('user_data');

    if (token && userData) {
      try {
        this.token = token;
        this.user = JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.clearAuth();
      }
    }
  }

  private saveToStorage(user: User, token: string) {
    if (typeof window === 'undefined') return;

    Cookies.set('auth_token', token, {
      expires: 1, // 1 day
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    Cookies.set('user_data', JSON.stringify(user), {
      expires: 1,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    this.token = token;
    this.user = user;
  }

  private clearAuth() {
    if (typeof window !== 'undefined') {
      Cookies.remove('auth_token');
      Cookies.remove('user_data');
    }
    this.token = null;
    this.user = null;
  }

  async login(username: string, password: string, role?: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role }),
      });

      const data: AuthResponse = await response.json();

      if (response.ok && data.status === 'success' && data.data) {
        this.saveToStorage(data.data.user, data.data.token);
        return data;
      } else {
        this.clearAuth();
        return data;
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        status: 'error',
        error: 'Network error occurred during login',
        code: 'NETWORK_ERROR'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login/admin';
      }
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      if (!this.token) return false;

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.data?.token) {
          Cookies.set('auth_token', data.data.token, {
            expires: 1,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });
          this.token = data.data.token;
          return true;
        }
      }

      this.clearAuth();
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuth();
      return false;
    }
  }

  async verifyToken(): Promise<boolean> {
    try {
      if (!this.token) return false;

      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.status === 'success';
      }

      this.clearAuth();
      return false;
    } catch (error) {
      console.error('Token verification error:', error);
      this.clearAuth();
      return false;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      if (!this.token) return null;

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          // Update stored user data
          const updatedUser = {
            id: data.data.id,
            username: data.data.username,
            email: data.data.email,
            name: data.data.name,
            phone: data.data.phone,
            roles: data.data.roles,
            primaryRole: this.user?.primaryRole || data.data.roles[0]
          };
          this.user = updatedUser;
          Cookies.set('user_data', JSON.stringify(updatedUser), {
            expires: 1,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });
          return updatedUser;
        }
      }

      this.clearAuth();
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      this.clearAuth();
      return null;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      if (!this.token) {
        return {
          status: 'error',
          error: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data: AuthResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Change password error:', error);
      return {
        status: 'error',
        error: 'Network error occurred',
        code: 'NETWORK_ERROR'
      };
    }
  }

  // Utility methods
  getUser(): User | null {
    return this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return this.token !== null && this.user !== null;
  }

  hasRole(role: string): boolean {
    return this.user?.roles.includes(role) ?? false;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isTeacher(): boolean {
    return this.hasRole('teacher');
  }

  isStudent(): boolean {
    return this.hasRole('student');
  }

  canAccessAnalytics(): boolean {
    return this.hasAnyRole(['admin', 'analytics', 'teacher']);
  }

  getPrimaryRole(): string | null {
    return this.user?.primaryRole ?? this.user?.roles[0] ?? null;
  }

  // Authorization header for API calls
  getAuthHeader(): Record<string, string> {
    if (this.token) {
      return {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      };
    }
    return {
      'Content-Type': 'application/json'
    };
  }
}

export const authService = AuthService.getInstance();
export default authService;
