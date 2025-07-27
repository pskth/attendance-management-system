// components/ProtectedRoute.tsx
"use client"

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string | string[];
  fallbackPath?: string;
  showLoading?: boolean;
}

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const AccessDenied = ({ requiredRoles, userRoles }: { requiredRoles: string[], userRoles: string[] }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
      <div className="text-red-500 text-6xl mb-4">🚫</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
      <p className="text-gray-600 mb-4">
        You don't have permission to access this page.
      </p>
      <div className="text-sm text-gray-500 space-y-2">
        <p><strong>Required roles:</strong> {requiredRoles.join(', ')}</p>
        <p><strong>Your roles:</strong> {userRoles.length > 0 ? userRoles.join(', ') : 'None'}</p>
      </div>
      <button 
        onClick={() => window.history.back()} 
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Go Back
      </button>
    </div>
  </div>
);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  fallbackPath = '/login/admin',
  showLoading = true
}) => {
  const { user, loading, isAuthenticated, hasRole, hasAnyRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Determine the appropriate login route based on required roles
      let loginPath = fallbackPath;
      if (requiredRoles) {
        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        const primaryRole = roles[0];
        if (['admin', 'teacher', 'student', 'analytics'].includes(primaryRole)) {
          loginPath = `/login/${primaryRole}`;
        }
      }
      router.push(loginPath);
    }
  }, [loading, isAuthenticated, router, fallbackPath, requiredRoles]);

  // Show loading spinner while checking authentication
  if (loading) {
    return showLoading ? <LoadingSpinner /> : null;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return null; // The useEffect will handle the redirect
  }

  // Check role requirements if specified
  if (requiredRoles) {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const hasRequiredRole = hasAnyRole(roles);

    if (!hasRequiredRole) {
      return <AccessDenied requiredRoles={roles} userRoles={user.roles} />;
    }
  }

  // User is authenticated and has required roles
  return <>{children}</>;
};

// Convenience components for specific roles
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles="admin">
    {children}
  </ProtectedRoute>
);

export const TeacherRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['teacher', 'admin']}>
    {children}
  </ProtectedRoute>
);

export const StudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['student', 'teacher', 'admin']}>
    {children}
  </ProtectedRoute>
);

export const AnalyticsRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['admin', 'analytics', 'teacher']}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
