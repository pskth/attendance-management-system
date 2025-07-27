// components/UserProfile.tsx
"use client"

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LogoutButton from './LogoutButton';

export const UserProfile: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return null;
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'teacher':
        return 'default';
      case 'student':
        return 'secondary';
      case 'analytics':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return '⚙️';
      case 'teacher':
        return '👨‍🏫';
      case 'student':
        return '🎓';
      case 'analytics':
        return '📊';
      default:
        return '👤';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold">Profile</span>
          <div className="flex items-center space-x-1">
            {user.roles.map((role) => (
              <Badge key={role} variant={getRoleColor(role)} className="text-xs">
                {getRoleIcon(role)} {role}
              </Badge>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-sm text-gray-500">@{user.username}</p>
        </div>

        {user.email && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
            <p className="text-sm text-gray-900">{user.email}</p>
          </div>
        )}

        {user.phone && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Phone</p>
            <p className="text-sm text-gray-900">{user.phone}</p>
          </div>
        )}

        {user.profile && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Profile Info</p>
            <div className="text-sm text-gray-900 space-y-1">
              {user.profile.type === 'student' && (
                <>
                  {user.profile.usn && <p>USN: {user.profile.usn}</p>}
                  {user.profile.semester && <p>Semester: {user.profile.semester}</p>}
                  {user.profile.batchYear && <p>Batch: {user.profile.batchYear}</p>}
                  {user.profile.department && <p>Department: {user.profile.department.name}</p>}
                  {user.profile.section && <p>Section: {user.profile.section.name}</p>}
                </>
              )}
              {user.profile.type === 'teacher' && (
                <>
                  {user.profile.department && <p>Department: {user.profile.department.name}</p>}
                  {user.profile.college && <p>College: {user.profile.college.name}</p>}
                </>
              )}
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <LogoutButton variant="destructive" className="w-full">
            Sign Out
          </LogoutButton>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfile;
