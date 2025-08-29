'use client';

import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/lib/auth';

export default function AuthDebug() {
  const { user, isAuthenticated } = useAuth();
  
  const token = authService.getToken();
  
  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded text-xs max-w-sm">
      <div className="font-bold mb-1">Auth Status (Dev Only)</div>
      <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
      <div>User: {user?.username || 'None'}</div>
      <div>Roles: {user?.roles?.join(', ') || 'None'}</div>
      <div>Token: {token ? '✅ Present' : '❌ Missing'}</div>
      <div>Can Access Analytics: {user && (user.roles.includes('admin') || user.roles.includes('teacher') || user.roles.includes('analytics')) ? '✅' : '❌'}</div>
    </div>
  );
}
