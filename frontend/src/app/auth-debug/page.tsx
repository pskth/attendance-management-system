'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function AuthDebugPage() {
  const auth = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auth Debug Information</h1>
        
        <div className="grid gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {auth.loading ? 'Yes' : 'No'}</p>
              <p><strong>Is Authenticated:</strong> {auth.isAuthenticated ? 'Yes' : 'No'}</p>
              <p><strong>Can Access Analytics:</strong> {auth.canAccessAnalytics() ? 'Yes' : 'No'}</p>
              <p><strong>Is Admin:</strong> {auth.isAdmin() ? 'Yes' : 'No'}</p>
              <p><strong>Is Teacher:</strong> {auth.isTeacher() ? 'Yes' : 'No'}</p>
              <p><strong>Is Student:</strong> {auth.isStudent() ? 'Yes' : 'No'}</p>
              <p><strong>Primary Role:</strong> {auth.getPrimaryRole() || 'None'}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(auth.user, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Role Checks</h2>
            <div className="space-y-2">
              <p><strong>Has admin role:</strong> {auth.hasRole('admin') ? 'Yes' : 'No'}</p>
              <p><strong>Has teacher role:</strong> {auth.hasRole('teacher') ? 'Yes' : 'No'}</p>
              <p><strong>Has analytics role:</strong> {auth.hasRole('analytics') ? 'Yes' : 'No'}</p>
              <p><strong>Has any of [admin, analytics, teacher]:</strong> {auth.hasAnyRole(['admin', 'analytics', 'teacher']) ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Analytics Access</h2>
            <button 
              onClick={() => window.location.href = '/analytics'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Analytics Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
