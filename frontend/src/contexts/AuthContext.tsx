// contexts/AuthContext.tsx
"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, User, AuthResponse } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string, role?: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResponse>;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isAdmin: () => boolean;
  isTeacher: () => boolean;
  isStudent: () => boolean;
  canAccessAnalytics: () => boolean;
  getPrimaryRole: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = authService.getUser();
        if (currentUser) {
          // Verify token is still valid
          const isValid = await authService.verifyToken();
          if (isValid) {
            setUser(currentUser);
          } else {
            // Try to refresh token
            const refreshed = await authService.refreshToken();
            if (refreshed) {
              setUser(authService.getUser());
            } else {
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up token refresh interval (refresh every 20 hours)
    const refreshInterval = setInterval(async () => {
      if (authService.isAuthenticated()) {
        const refreshed = await authService.refreshToken();
        if (!refreshed) {
          setUser(null);
        }
      }
    }, 20 * 60 * 60 * 1000); // 20 hours

    return () => clearInterval(refreshInterval);
  }, []);

  const login = async (username: string, password: string, role?: string): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const response = await authService.login(username, password, role);
      if (response.status === 'success' && response.data) {
        setUser(response.data.user);
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    const refreshed = await authService.refreshToken();
    if (!refreshed) {
      setUser(null);
    }
    return refreshed;
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<AuthResponse> => {
    return await authService.changePassword(currentPassword, newPassword);
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshToken,
    changePassword,
    isAuthenticated: !!user && authService.isAuthenticated(),
    hasRole: (role: string) => authService.hasRole(role),
    hasAnyRole: (roles: string[]) => authService.hasAnyRole(roles),
    isAdmin: () => authService.isAdmin(),
    isTeacher: () => authService.isTeacher(),
    isStudent: () => authService.isStudent(),
    canAccessAnalytics: () => authService.canAccessAnalytics(),
    getPrimaryRole: () => authService.getPrimaryRole(),
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
