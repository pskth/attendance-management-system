'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardHeader } from '@/components/ui/card'
import { DropdownNavigation, type Course, type Section } from '@/app/teacher/dropdown-navigation'
import { CourseManagement } from '@/app/teacher/course-management'
import { MasterSearch } from '@/app/teacher/master-search'
import { 
  User, 
  GraduationCap
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

export default function TeacherDashboard() {  const [teacherData] = useState(mockTeacherData)
  const [selectedYear, setSelectedYear] = useState<string | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)

  // Mock function to load teacher data - replace with actual API call
  useEffect(() => {
    // loadTeacherData()
  }, [])

  const resetSelection = () => {
    setSelectedYear(null)
    setSelectedDepartment(null)
    setSelectedCourse(null)
    setSelectedSection(null)
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
        // Use department ID instead of full name
        setSelectedDepartment(result.metadata?.department || 'CSE')
        break
      case 'course':
        resetSelection()
        // Set year and department from metadata
        const yearForCourse = result.metadata?.year || '3rd Year'
        const deptForCourse = result.metadata?.department || 'CSE'
        setSelectedYear(yearForCourse)
        setSelectedDepartment(deptForCourse)
        
        // Extract course info and set
        const courseParts = result.title.split(' - ')
        if (courseParts.length >= 2) {
          setSelectedCourse({
            course_id: result.id,
            course_code: courseParts[0],
            course_name: courseParts[1],
            department_id: deptForCourse,
            total_students: 60, // Default values - should come from API
            classes_completed: 25,
            total_classes: 40,
            attendance_percentage: 85.0
          })
          // Reset section when course changes
          setSelectedSection(null)
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
        
        // For open electives, don't set department - they should appear in course dropdown
        // Extract course info and set directly
        const electiveParts = result.title.split(' - ')
        if (electiveParts.length >= 2) {
          setSelectedCourse({
            course_id: result.id,
            course_code: electiveParts[0],
            course_name: electiveParts[1],
            department_id: 'OPEN_ELECTIVE',
            total_students: 45, // Default values for electives
            classes_completed: 20,
            total_classes: 40,
            attendance_percentage: 88.0,
            course_type: 'open_elective',
            is_open_elective: true
          })
          
          // Set mixed section for open electives
          setSelectedSection({
            section_id: 'MIXED',
            section_name: 'Mixed',
            department_id: 'OPEN_ELECTIVE',
            total_students: 45,
            present_today: 40,
            attendance_percentage: 88.0
          })
        }
        break
      default:
        console.log('Unknown search result type:', result.type)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Attendance Management System</p>
          </div>
          <div className="flex items-center space-x-4">
            <a 
              href="/analytics"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
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
                {teacherData.photo_url ? (
                  <Image 
                    src={teacherData.photo_url} 
                    alt={teacherData.name}
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
                  <span className="text-base sm:text-lg font-medium truncate">Welcome, {teacherData.name}</span>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-emerald-100">
                    <span>{teacherData.employee_id}</span>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{teacherData.college_name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Master Search */}
        <div className="flex justify-center">
          <MasterSearch
            onNavigate={handleSearchNavigation}
            placeholder="Search years, departments, courses, students..."
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
        />

        {/* Main Content */}
        <div className="space-y-6">
          {selectedYear && selectedDepartment && selectedCourse && selectedSection && (
            <CourseManagement
              courseOffering={selectedCourse}
              selectedYear={selectedYear}
              selectedDepartment={selectedDepartment}
              selectedSection={selectedSection}
            />
          )}
        </div>
      </div>
    </div>
  )
}
