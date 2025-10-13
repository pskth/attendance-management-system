'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ProtectedRoute from '@/components/ProtectedRoute'
import UserProfile from '@/components/UserProfile'
import { useAuth } from '@/contexts/AuthContext'
import UserManagement from '@/app/admin/user-management'
import CourseManagement from '@/app/admin/course-management'
import DepartmentManagement from '@/app/admin/department-management'
import CollegeManagement from '@/app/admin/college-management'
import DatabaseSetup from '@/app/admin/database-setup'
import DatabaseSetupExcel from '@/app/admin/database-setup-excel'
import AcademicYearExport from '@/app/admin/academic-year-export'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('users')
  const [userFilters, setUserFilters] = useState<{
    course?: string
    department?: string
    section?: string
    year?: string
    role?: string
  }>({})
  const [courseFilters, setCourseFilters] = useState<{
    department?: string
    year?: string
  }>({})
  const [departmentFilters, setDepartmentFilters] = useState<{
    college?: string
  }>({})
  const [collegeFilters, setCollegeFilters] = useState<{}>({})

  const handleNavigateToUsers = (filters: {
    course?: string
    department?: string
    section?: string
    year?: string
    role?: string
  }) => {
    setUserFilters(filters)
    setActiveTab('users')
  }

  const handleNavigateToCourses = (filters: {
    department?: string
    year?: string
  }) => {
    setCourseFilters(filters)
    setActiveTab('courses')
  }

  const handleNavigateToDepartments = (filters: {
    college?: string
  }) => {
    setDepartmentFilters(filters)
    setActiveTab('departments')
  }

  return (
    <ProtectedRoute requiredRoles="admin">
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-700">Manage your institution's data</p>
              {user && (
                <p className="text-sm text-gray-500 mt-1">
                  Welcome back, {user.name}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/analytics"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Analytics</span>
              </a>
              <UserProfile />
            </div>
          </div>

          {/* Connection Status
          <div className="bg-white rounded-lg shadow p-4">
            <ConnectionStatus />
          </div> */}

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="departments">Departments</TabsTrigger>
              <TabsTrigger value="colleges">Colleges</TabsTrigger>
              {/* <TabsTrigger value="setup">Database Setup (CSV)</TabsTrigger> */}
              <TabsTrigger value="excel">Excel Import</TabsTrigger>
              <TabsTrigger value="export">Year Export</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <UserManagement initialFilters={userFilters} />
            </TabsContent>

            <TabsContent value="courses">
              <CourseManagement
                onNavigateToUsers={handleNavigateToUsers}
                initialFilters={courseFilters}
              />
            </TabsContent>

            <TabsContent value="departments">
              <DepartmentManagement
                onNavigateToUsers={handleNavigateToUsers}
                onNavigateToCourses={handleNavigateToCourses}
                initialFilters={departmentFilters}
              />
            </TabsContent>

            <TabsContent value="colleges">
              <CollegeManagement
                onNavigateToUsers={handleNavigateToUsers}
                onNavigateToDepartments={handleNavigateToDepartments}
              />
            </TabsContent>

            <TabsContent value="setup">
              <DatabaseSetup />
            </TabsContent>

            <TabsContent value="excel">
              <DatabaseSetupExcel />
            </TabsContent>

            <TabsContent value="export">
              <AcademicYearExport />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}

// Connection Status Component
function ConnectionStatus() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkBackendConnection = async () => {
    setBackendStatus('checking')
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      console.log('ConnectionStatus: Checking backend at:', API_BASE_URL)

      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        credentials: 'include'
      })

      console.log('ConnectionStatus: Response status:', response.status)
      console.log('ConnectionStatus: Response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const data = await response.json()
        console.log('ConnectionStatus: Health check successful:', data)
        setBackendStatus('connected')
      } else {
        console.error('ConnectionStatus: Health check failed with status:', response.status)
        setBackendStatus('disconnected')
      }
    } catch (error) {
      console.error('ConnectionStatus: Health check error:', error)
      setBackendStatus('disconnected')
    }
    setLastChecked(new Date())
  }

  // Check connection on mount and every 30 seconds
  useEffect(() => {
    checkBackendConnection()
    const interval = setInterval(checkBackendConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    switch (backendStatus) {
      case 'connected': return 'text-green-600'
      case 'disconnected': return 'text-red-600'
      case 'checking': return 'text-yellow-600'
    }
  }

  const getStatusIcon = () => {
    switch (backendStatus) {
      case 'connected': return '✅'
      case 'disconnected': return '❌'
      case 'checking': return '⏳'
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <span>{getStatusIcon()}</span>
        <span className={`font-medium ${getStatusColor()}`}>
          Backend: {backendStatus === 'checking' ? 'Checking...' :
            backendStatus === 'connected' ? 'Connected' : 'Disconnected'}
        </span>
        {lastChecked && (
          <span className="text-sm text-gray-500">
            (Last checked: {lastChecked.toLocaleTimeString()})
          </span>
        )}
      </div>

      {backendStatus === 'disconnected' && (
        <div className="text-sm text-red-600">
          Make sure the backend server is running on port 4000
        </div>
      )}

      <button
        onClick={checkBackendConnection}
        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        disabled={backendStatus === 'checking'}
      >
        Refresh
      </button>
    </div>
  )
}
