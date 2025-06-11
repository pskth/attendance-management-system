'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AttendanceCalendar } from '@/components/student/attendance-calendar'
import { DailyAttendanceCheck } from '@/components/student/daily-attendance-check'
import { AttendanceStats } from '@/components/student/attendance-stats'
import { 
  User, 
  Calendar, 
  TrendingUp, 
  BookOpen,
  GraduationCap,
  Phone,
  Mail
} from 'lucide-react'

// Mock student data - replace with actual API call
const mockStudentData = {
  user_id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Krishna N Acharya',
  usn: 'NNM22AD026',
  phone: '+91 8088022968',
  email: 'john.doe@student.college.edu',
  college_name: 'NMAM Institute of Technology',
  semester: 6,
  department: 'Artificial Intelligence and Data Science',
  academic_year: '2024-25',
  photo_url: null
}

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [studentData] = useState(mockStudentData)
  const [currentDate] = useState(new Date())

  // Mock function to load student data - replace with actual API call
  useEffect(() => {
    // loadStudentData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {studentData.name}!</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Today</p>
            <p className="text-lg font-semibold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Student Profile Card */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                {studentData.photo_url ? (
                  <img 
                    src={studentData.photo_url} 
                    alt={studentData.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="flex-1">
                <CardTitle className="text-white text-2xl">{studentData.name}</CardTitle>
                <CardDescription className="text-blue-100">
                  {studentData.usn} • Semester {studentData.semester} • {studentData.department}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-4 h-4" />
                <span className="text-sm">{studentData.college_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{studentData.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{studentData.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'attendance'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Attendance Calendar</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'stats'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Statistics</span>
          </button>
        </div>        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="w-full">
            {/* Daily Attendance Check */}
            <DailyAttendanceCheck studentId={studentData.user_id} />
          </div>
        )}{activeTab === 'attendance' && (
          <AttendanceCalendar 
            studentId={studentData.user_id} 
          />
        )}{activeTab === 'stats' && (
          <AttendanceStats studentId={studentData.user_id} compact={false} />
        )}
      </div>
    </div>
  )
}
