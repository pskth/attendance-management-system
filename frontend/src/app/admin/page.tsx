'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserManagement } from '@/app/admin/user-management'
import { CourseManagement } from '@/app/admin/course-management'
import { DepartmentManagement } from '@/app/admin/department-management'

export default function AdminDashboard() {
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
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your institution</p>
          </div>
        </div>        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement initialFilters={userFilters} />
          </TabsContent>          <TabsContent value="courses">
            <CourseManagement 
              onNavigateToUsers={handleNavigateToUsers}
              initialFilters={courseFilters}
            />
          </TabsContent>          <TabsContent value="departments">
            <DepartmentManagement 
              selectedYear="2024" 
              onNavigateToUsers={handleNavigateToUsers}
              onNavigateToCourses={handleNavigateToCourses}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
