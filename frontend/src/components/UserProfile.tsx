// components/UserProfile.tsx
"use client"

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, User, Mail, Phone, GraduationCap, Building2 } from 'lucide-react';
import LogoutButton from './LogoutButton';

/**
 * UserProfile Component
 * 
 * A clickable profile button that expands to show user details including email and phone.
 * Designed to be space-efficient and elegant.
 * 
 * @param compact - If true, shows only an avatar that expands to a floating dropdown
 *                  If false, shows a full-width button with user info that expands inline
 * 
 * Usage:
 * - Regular mode: <UserProfile /> or <UserProfile compact={false} />
 * - Compact mode: <UserProfile compact={true} />
 */

interface UserProfileProps {
  compact?: boolean; // For even more compact display
}

export const UserProfile: React.FC<UserProfileProps> = ({ compact = false }) => {
  const { user, loading } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  if (loading) {
    return (
      <div className={compact ? "w-12" : "w-full max-w-sm"}>
        <div className={`animate-pulse flex items-center ${compact ? 'justify-center' : 'space-x-3'} p-3 bg-gray-100 rounded-lg`}>
          <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} bg-gray-200 rounded-full`}></div>
          {!compact && (
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          )}
        </div>
      </div>
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
    <div ref={profileRef} className={compact ? "w-12 relative" : "w-full max-w-sm"}>
      {/* Compact Profile Button */}
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`${compact ? 'w-12 h-12 p-1' : 'w-full p-3 h-auto'} justify-between hover:bg-gray-50 transition-colors relative`}
        title={compact ? `${user.name} (${user.roles[0]})` : undefined}
      >
        {compact ? (
          // Ultra-compact: Just avatar with tooltip
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
            {getRoleIcon(user.roles[0])}
          </div>
        ) : (
          // Regular compact view
          <>
            <div className="flex items-center space-x-3">
              {/* Avatar with role icon */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {getRoleIcon(user.roles[0])}
              </div>
              
              {/* User Info */}
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={getRoleColor(user.roles[0])} className="text-xs px-2 py-0">
                    {user.roles[0]}
                  </Badge>
                  <span className="text-xs text-gray-500">@{user.username}</span>
                </div>
              </div>
            </div>
            
            {/* Expand Icon */}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </>
        )}
      </Button>

      {/* Expanded Details */}
      {isExpanded && (
        <Card className={`mt-2 border shadow-lg ${compact ? 'absolute top-14 left-0 z-50 w-80' : ''}`}>
          <CardContent className="p-4 space-y-3">
            {/* Compact mode: Show basic info at top */}
            {compact && (
              <div className="border-b pb-3 mb-3">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={getRoleColor(user.roles[0])} className="text-xs px-2 py-0">
                    {user.roles[0]}
                  </Badge>
                  <span className="text-xs text-gray-500">@{user.username}</span>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="space-y-2">
              {user.email && (
                <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                    <p className="text-sm text-gray-900 truncate">{user.email}</p>
                  </div>
                </div>
              )}

              {user.phone && (
                <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Phone</p>
                    <p className="text-sm text-gray-900">{user.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Information */}
            {user.profile && (
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Profile Details</p>
                </div>
                
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {user.profile.type === 'student' && (
                    <>
                      {user.profile.usn && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">USN:</span>
                          <span className="text-gray-900 font-medium">{user.profile.usn}</span>
                        </div>
                      )}
                      {user.profile.semester && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Semester:</span>
                          <span className="text-gray-900 font-medium">{user.profile.semester}</span>
                        </div>
                      )}
                      {user.profile.batchYear && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Batch:</span>
                          <span className="text-gray-900 font-medium">{user.profile.batchYear}</span>
                        </div>
                      )}
                      {user.profile.department && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Department:</span>
                          <span className="text-gray-900 font-medium">{user.profile.department.name}</span>
                        </div>
                      )}
                      {user.profile.section && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Section:</span>
                          <span className="text-gray-900 font-medium">{user.profile.section.name}</span>
                        </div>
                      )}
                    </>
                  )}
                  {user.profile.type === 'teacher' && (
                    <>
                      {user.profile.department && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Department:</span>
                          <span className="text-gray-900 font-medium">{user.profile.department.name}</span>
                        </div>
                      )}
                      {user.profile.college && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">College:</span>
                          <span className="text-gray-900 font-medium">{user.profile.college.name}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* All Roles */}
            {user.roles.length > 1 && (
              <div className="border-t pt-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">All Roles</p>
                <div className="flex flex-wrap gap-1">
                  {user.roles.map((role) => (
                    <Badge key={role} variant={getRoleColor(role)} className="text-xs">
                      {getRoleIcon(role)} {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Logout Button */}
            <div className="border-t pt-3">
              <LogoutButton variant="destructive" size="sm" className="w-full">
                Sign Out
              </LogoutButton>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserProfile;
