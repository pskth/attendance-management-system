'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import UserManagement from '@/app/admin/user-management'
import CourseManagement from '@/app/admin/course-management'
import DepartmentManagement from '@/app/admin/department-management'
import CollegeManagement from '@/app/admin/college-management'
import DatabaseSetup from '@/app/admin/database-setup'

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-700">Manage your institution's data</p>
          </div>
        </div>        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="colleges">Colleges</TabsTrigger>
            <TabsTrigger value="setup">Database Setup</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  )
}
