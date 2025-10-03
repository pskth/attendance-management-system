'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Card, CardHeader } from '@/components/ui/card'
import { DropdownNavigation, type Course, type Section } from '@/app/teacher/dropdown-navigation'
import { CourseManagement } from '@/app/teacher/course-management'
import { MasterSearch, type MasterSearchRef } from '@/app/teacher/master-search'
import { CoursesModal } from '@/components/teacher/courses-modal'
import { StudentsModal } from '@/components/teacher/students-modal'
import { TeacherAPI, type TeacherDashboardData, type CourseOffering } from '@/lib/teacher-api'
import { authService } from '@/lib/auth'
import {
  User,
  GraduationCap,
  BookOpen,
  Users,
  Calendar,
  TrendingUp
} from 'lucide-react'

export default function TeacherDashboard() {
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null)
  const [courses, setCourses] = useState<CourseOffering[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [courseStatsLoading, setCourseStatsLoading] = useState(false)

  // Modal states
  const [showCoursesModal, setShowCoursesModal] = useState(false)
  const [showStudentsModal, setShowStudentsModal] = useState(false)

  // Master search ref
  const masterSearchRef = useRef<MasterSearchRef>(null)

  const [selectedYear, setSelectedYear] = useState<string | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)

  // Load teacher data
  useEffect(() => {
    loadTeacherData()
  }, [])

  const loadTeacherData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!authService.isAuthenticated()) {
        throw new Error('Not authenticated')
      }

      // Load dashboard data and courses in parallel
      const [dashboardResult, coursesResult] = await Promise.all([
        TeacherAPI.getDashboard(),
        TeacherAPI.getCourses()
      ])

      setDashboardData(dashboardResult)
      setCourses(coursesResult)
    } catch (err) {
      console.error('Error loading teacher data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load teacher data')
    } finally {
      setLoading(false)
    }
  }

  const resetSelection = () => {
    setSelectedYear(null)
    setSelectedDepartment(null)
    setSelectedCourse(null)
    setSelectedSection(null)
  }

  // Handle navigation from master search
  const handleSearchNavigation = async (result: {
    id: string
    type: 'year' | 'department' | 'course' | 'student' | 'elective'
    title: string
    subtitle: string
    description?: string
    metadata?: {
      year?: string
      department?: string
      course_code?: string
      usn?: string
      section?: string
      academic_year?: string
      semester?: number
      offering_id?: string
    }
  }) => {
    switch (result.type) {
      case 'course':
      case 'elective':
        resetSelection()
        // Find the actual course offering from our data
        const courseOffering = courses.find(c =>
          c.offeringId === result.metadata?.offering_id ||
          c.course.code === result.metadata?.course_code ||
          c.course.id === result.id
        )

        if (courseOffering) {
          await navigateToCourse(courseOffering)
        }
        break
      case 'student':
        // For student searches, open the students modal with a filter
        setShowStudentsModal(true)
        break
      default:
        console.log('Search result type not yet implemented:', result.type)
    }
  }

  // Handle course selection from courses modal
  const handleCourseSelect = async (courseOffering: CourseOffering) => {
    resetSelection()
    await navigateToCourse(courseOffering)
  }

  const navigateToCourse = async (courseOffering: CourseOffering) => {
    setSelectedYear(courseOffering.academicYear)
    setSelectedDepartment(courseOffering.course.department)
    setCourseStatsLoading(true)

    try {
      // Get real course statistics from API
      console.log('Fetching course statistics for offering ID:', courseOffering.offeringId)
      const courseStats = await TeacherAPI.getCourseStatistics(courseOffering.offeringId)
      console.log('Course statistics received:', courseStats)

      setSelectedCourse({
        course_id: courseOffering.course.id,
        course_code: courseOffering.course.code,
        course_name: courseOffering.course.name,
        department_id: courseOffering.course.department,
        total_students: courseOffering.enrolledStudents,
        classes_completed: courseStats.classesCompleted,
        total_classes: courseStats.totalClasses,
        attendance_percentage: courseStats.overallAttendancePercentage,
        has_theory_component: courseOffering.course.hasTheoryComponent,
        has_lab_component: courseOffering.course.hasLabComponent,
        course_type: courseOffering.course.type as 'regular' | 'open_elective',
        offering_id: courseOffering.offeringId
      })
    } catch (error) {
      console.error('Error fetching course statistics for offering ID:', courseOffering.offeringId, error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        offeringId: courseOffering.offeringId,
        courseCode: courseOffering.course.code,
        courseName: courseOffering.course.name
      })
      // Fallback to default values if API fails
      setSelectedCourse({
        course_id: courseOffering.course.id,
        course_code: courseOffering.course.code,
        course_name: courseOffering.course.name,
        department_id: courseOffering.course.department,
        total_students: courseOffering.enrolledStudents,
        classes_completed: 0,
        total_classes: 0,
        attendance_percentage: 0,
        has_theory_component: courseOffering.course.hasTheoryComponent,
        has_lab_component: courseOffering.course.hasLabComponent,
        course_type: courseOffering.course.type as 'regular' | 'open_elective',
        offering_id: courseOffering.offeringId
      })
    }

    if (courseOffering.section) {
      try {
        // Get real attendance analytics for the section
        const analyticsData = await TeacherAPI.getAttendanceAnalytics(courseOffering.offeringId)

        // Calculate today's presence (this is an approximation since we don't have real-time data)
        const avgAttendancePercentage = analyticsData.length > 0
          ? analyticsData.reduce((sum, student) => sum + student.attendance.attendancePercentage, 0) / analyticsData.length
          : 0

        const presentToday = Math.floor(courseOffering.enrolledStudents * (avgAttendancePercentage / 100))

        setSelectedSection({
          section_id: courseOffering.section.id,
          section_name: courseOffering.section.name,
          department_id: courseOffering.course.department,
          total_students: courseOffering.enrolledStudents,
          present_today: presentToday,
          attendance_percentage: Math.round(avgAttendancePercentage * 10) / 10
        })
      } catch (error) {
        console.error('Error fetching section analytics:', error)
        // Fallback to default values
        setSelectedSection({
          section_id: courseOffering.section.id,
          section_name: courseOffering.section.name,
          department_id: courseOffering.course.department,
          total_students: courseOffering.enrolledStudents,
          present_today: 0,
          attendance_percentage: 0
        })
      }
    }

    setCourseStatsLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-3 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading teacher dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-3 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadTeacherData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-3 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No dashboard data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Attendance Management System</p>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="/teacher/marks-attendance"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>View/Edit All</span>
            </a>
            <a
              href="/analytics"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Analytics</span>
            </a>
          </div>
        </div>

        {/* Teacher Profile Card */}
        <Card className="bg-gradient-to-r from-emerald-600 to-green-700 text-white">
          <CardHeader className="pb-2">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                {dashboardData.teacher.photoUrl ? (
                  <Image
                    src={dashboardData.teacher.photoUrl}
                    alt={dashboardData.teacher.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-1">
                  <span className="text-base sm:text-lg font-medium truncate">Welcome, {dashboardData.teacher.name}</span>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-emerald-100">
                    <span>{dashboardData.teacher.departmentCode}</span>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{dashboardData.teacher.college}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-emerald-300"
            onClick={() => {
              masterSearchRef.current?.clearSearch()
              setShowCoursesModal(true)
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Total Courses</div>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <div className="px-6 pb-4">
              <div className="text-2xl font-bold">{dashboardData.statistics.totalCourses}</div>
              <p className="text-xs text-muted-foreground mt-1">Click to view all courses</p>
            </div>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-emerald-300"
            onClick={() => {
              masterSearchRef.current?.clearSearch()
              setShowStudentsModal(true)
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Total Students</div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <div className="px-6 pb-4">
              <div className="text-2xl font-bold">{dashboardData.statistics.totalStudents}</div>
              <p className="text-xs text-muted-foreground mt-1">Click to view all students</p>
            </div>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Sessions Taken</div>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <div className="px-6 pb-4">
              <div className="text-2xl font-bold">{dashboardData.statistics.totalSessions}</div>
            </div>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Avg Attendance</div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <div className="px-6 pb-4">
              <div className="text-2xl font-bold">{dashboardData.statistics.averageAttendance.toFixed(1)}%</div>
            </div>
          </Card>
        </div>

        {/* Master Search */}
        <div className="flex justify-center">
          <MasterSearch
            ref={masterSearchRef}
            onNavigate={handleSearchNavigation}
            placeholder="Search courses, students..."
            hidden={showCoursesModal || showStudentsModal}
          />
        </div>

        {/* Dropdown Navigation */}
        <DropdownNavigation
          selectedYear={selectedYear}
          selectedDepartment={selectedDepartment}
          selectedCourse={selectedCourse}
          selectedSection={selectedSection}
          onYearSelect={setSelectedYear}
          onDepartmentSelect={setSelectedDepartment}
          onCourseSelect={setSelectedCourse}
          onSectionSelect={setSelectedSection}
          courses={courses}
          teacherCollege={dashboardData?.teacher.collegeCode}
        />

        {/* Main Content */}
        <div className="space-y-6">
          {courseStatsLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <span className="ml-2 text-gray-600">Loading course statistics...</span>
            </div>
          )}

          {selectedYear && selectedDepartment && selectedCourse && selectedSection && !courseStatsLoading && (
            <CourseManagement
              courseOffering={selectedCourse}
              selectedYear={selectedYear}
              selectedDepartment={selectedDepartment}
              selectedSection={selectedSection}
              courses={courses}
            />
          )}
        </div>

        {/* Modals */}
        <CoursesModal
          open={showCoursesModal}
          onOpenChange={setShowCoursesModal}
          onCourseSelect={handleCourseSelect}
        />

        <StudentsModal
          open={showStudentsModal}
          onOpenChange={setShowStudentsModal}
        />
      </div>
    </div>
  )
}
