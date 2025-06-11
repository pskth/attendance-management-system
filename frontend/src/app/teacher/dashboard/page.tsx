'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { YearSelector } from '@/components/teacher/year-selector'
import { DepartmentSelector } from '@/components/teacher/department-selector'
import { CourseSelector } from '@/components/teacher/course-selector'
import { AttendanceMarking } from '@/components/teacher/attendance-marking'
import { MasterSearch } from '@/components/teacher/master-search'
import { OpenElectives } from '@/components/teacher/open-electives'
import { 
  User, 
  GraduationCap,
  Phone,
  ChevronRight
} from 'lucide-react'

// Mock teacher data - replace with actual API call
const mockTeacherData = {
  teacher_id: '456e7890-e12b-34c5-d678-901234567890',
  user_id: '456e7890-e12b-34c5-d678-901234567890',
  name: 'Dr. Rajesh Kumar',
  phone: '+91 9876543210',
  department: 'Computer Science Engineering',
  designation: 'Associate Professor',
  employee_id: 'EMP001',
  college_name: 'NMAM Institute of Technology',
  photo_url: undefined
}

export default function TeacherDashboard() {
  const [teacherData] = useState(mockTeacherData)
  const [currentDate] = useState(new Date())
  const [selectedYear, setSelectedYear] = useState<string | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<{
    offering_id: string
    course_code: string
    course_name: string
    class_section: string
  } | null>(null)

  // Mock function to load teacher data - replace with actual API call
  useEffect(() => {
    // loadTeacherData()
  }, [])

  const resetSelection = () => {
    setSelectedYear(null)
    setSelectedDepartment(null)
    setSelectedCourse(null)
  }

  const resetToYear = () => {
    setSelectedDepartment(null)
    setSelectedCourse(null)
  }

  const resetToDepartment = () => {
    setSelectedCourse(null)
  }
  // Handle navigation from master search
  const handleSearchNavigation = (result: {
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
    }
  }) => {
    switch (result.type) {
      case 'year':
        resetSelection()
        setSelectedYear(result.title)
        break
      case 'department':
        resetSelection()
        // For departments, we need to select a year first
        // Default to 3rd Year if not specified in metadata
        const yearForDept = result.metadata?.year || '3rd Year'
        setSelectedYear(yearForDept)
        setSelectedDepartment(result.title)
        break
      case 'course':
        resetSelection()
        // Set year and department from metadata
        const yearForCourse = result.metadata?.year || '3rd Year'
        const deptForCourse = result.metadata?.department || 'Computer Science Engineering'
        setSelectedYear(yearForCourse)
        setSelectedDepartment(deptForCourse)
        
        // Extract course info and set
        const courseParts = result.title.split(' - ')
        if (courseParts.length >= 2) {
          setSelectedCourse({
            offering_id: result.id,
            course_code: courseParts[0],
            course_name: courseParts[1],
            class_section: result.metadata?.section || 'A'
          })
        }
        break
      case 'student':
        // Navigate to student's course/class
        resetSelection()
        const yearForStudent = result.metadata?.year || '3rd Year'
        const deptForStudent = result.metadata?.department || 'Computer Science Engineering'
        setSelectedYear(yearForStudent)
        setSelectedDepartment(deptForStudent)
        // Could navigate to a specific course if student metadata includes it
        break
      case 'elective':
        resetSelection()
        const yearForElective = result.metadata?.year || '4th Year'
        setSelectedYear(yearForElective)
        // For electives, navigate to the department offering it
        if (result.metadata?.department) {
          setSelectedDepartment(result.metadata.department)
        }
        break
      default:
        console.log('Unknown search result type:', result.type)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-gray-600 mt-1">Attendance Management System</p>
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
          </div>        </div>

        {/* Teacher Profile Card */}
        <Card className="bg-gradient-to-r from-emerald-600 to-green-700 text-white">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                {teacherData.photo_url ? (
                  <img 
                    src={teacherData.photo_url} 
                    alt={teacherData.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="flex-1">
                <CardTitle className="text-white text-2xl">Welcome, {teacherData.name}</CardTitle>
                <CardDescription className="text-emerald-100">
                  {teacherData.designation} • {teacherData.employee_id} • {teacherData.department}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-4 h-4" />
                <span className="text-sm">{teacherData.college_name}</span>
              </div>              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{teacherData.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-4 h-4" />
                <span className="text-sm">{teacherData.designation}</span>
              </div>
            </div>          </CardContent>
        </Card>

        {/* Master Search */}
        <div className="flex justify-center">
          <MasterSearch
            onNavigate={handleSearchNavigation}
            placeholder="Search years, departments, courses, students..."
          />
        </div>

        {/* Breadcrumb Navigation */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center space-x-2 text-sm">
              <button 
                onClick={resetSelection}
                className="text-emerald-600 hover:text-emerald-800 font-medium"
              >
                Home
              </button>
              {selectedYear && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <button 
                    onClick={resetToYear}
                    className="text-emerald-600 hover:text-emerald-800 font-medium"
                  >
                    {selectedYear}
                  </button>
                </>
              )}
              {selectedDepartment && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <button 
                    onClick={resetToDepartment}
                    className="text-emerald-600 hover:text-emerald-800 font-medium"
                  >
                    {selectedDepartment}
                  </button>
                </>
              )}
              {selectedCourse && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 font-medium">
                    {selectedCourse.course_code} - {selectedCourse.course_name}
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-6">
          {!selectedYear && (
            <YearSelector
              teacherId={teacherData.teacher_id}
              onYearSelect={setSelectedYear}
            />
          )}          {selectedYear && !selectedDepartment && !selectedCourse && (
            <>
              <DepartmentSelector
                teacherId={teacherData.teacher_id}
                selectedYear={selectedYear}
                onDepartmentSelect={setSelectedDepartment}
              />
              <OpenElectives
                teacherId={teacherData.teacher_id}
                selectedYear={selectedYear}
                onElectiveSelect={setSelectedCourse}
              />
            </>
          )}

          {selectedYear && selectedDepartment && !selectedCourse && (
            <CourseSelector
              teacherId={teacherData.teacher_id}
              selectedYear={selectedYear}
              selectedDepartment={selectedDepartment}
              onCourseSelect={setSelectedCourse}
            />
          )}          {selectedYear && selectedDepartment && selectedCourse && (
            <AttendanceMarking
              courseOffering={selectedCourse}
              selectedYear={selectedYear}
              selectedDepartment={selectedDepartment}
            />
          )}

          {/* Open Electives Attendance (when course is selected but no department) */}
          {selectedYear && !selectedDepartment && selectedCourse && (
            <AttendanceMarking
              courseOffering={selectedCourse}
              selectedYear={selectedYear}
              selectedDepartment="Mixed Departments"
            />
          )}
        </div>
      </div>
    </div>
  )
}
