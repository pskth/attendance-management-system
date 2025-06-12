'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Clock, CheckCircle2 } from 'lucide-react'

interface CourseSelectorProps {
  teacherId: string
  selectedYear: string
  selectedDepartment: string
  onCourseSelect: (course: {
    offering_id: string
    course_code: string
    course_name: string
    class_section: string
  }) => void
}

// Mock data for courses - replace with actual API call
const mockCourseData = [  {
    offering_id: 'off_001',
    course_code: 'CS301',
    course_name: 'Data Structures and Algorithms',
    class_section: 'A',
    course_type: 'core',
    total_students: 60,
    total_classes_held: 24,
    syllabus_completion: 78,
    attendance_percentage: 82.5
  },  {
    offering_id: 'off_002',
    course_code: 'CS302',
    course_name: 'Database Management Systems',
    class_section: 'A',
    course_type: 'core',
    total_students: 60,
    total_classes_held: 20,
    syllabus_completion: 65,
    attendance_percentage: 88.2
  },  {
    offering_id: 'off_003',
    course_code: 'CS303',
    course_name: 'Computer Networks',
    class_section: 'B',
    course_type: 'core',
    total_students: 58,
    total_classes_held: 22,
    syllabus_completion: 72,
    attendance_percentage: 79.3
  },  {
    offering_id: 'off_004',
    course_code: 'CS304',
    course_name: 'Operating Systems',
    class_section: 'A',
    course_type: 'department_elective',
    total_students: 60,
    total_classes_held: 18,
    syllabus_completion: 58,
    attendance_percentage: 85.7
  }
]

export function CourseSelector({ teacherId, selectedYear, selectedDepartment, onCourseSelect }: CourseSelectorProps) {
  const [courseData] = useState(mockCourseData)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCourseData()
  }, [teacherId, selectedYear, selectedDepartment])

  const loadCourseData = async () => {
    setLoading(true)
    try {
      // Replace with actual API call
      // const data = await fetchTeacherCourses(teacherId, selectedYear, selectedDepartment)
      // setCourseData(data)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('Error loading course data:', error)
    } finally {
      setLoading(false)
    }
  }
  const getCourseTypeColor = (type: string) => {
    switch (type) {
      case 'core': return 'bg-blue-100 text-blue-800'
      case 'department_elective': return 'bg-purple-100 text-purple-800'
      case 'open_elective': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Course</h2>
        <p className="text-gray-600">
          Choose a course from {selectedDepartment} • {selectedYear}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {courseData.map((course) => (
          <Card 
            key={course.offering_id}
            className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-emerald-300"
            onClick={() => onCourseSelect({
              offering_id: course.offering_id,
              course_code: course.course_code,
              course_name: course.course_name,
              class_section: course.class_section
            })}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <CardTitle className="text-lg text-gray-900">
                      {course.course_code}
                    </CardTitle>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCourseTypeColor(course.course_type)}`}>
                      {course.course_type.replace('_', ' ')}
                    </span>
                  </div>
                  <CardDescription className="text-sm font-medium text-gray-900 mb-1">
                    {course.course_name}
                  </CardDescription>
                  <CardDescription className="text-sm text-gray-600">
                    Section {course.class_section} • {course.total_students} students
                  </CardDescription>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center ml-3">
                  <BookOpen className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardHeader>            <CardContent>
              <div className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{course.total_classes_held}</p>
                      <p className="text-xs text-gray-500">Classes Held</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{course.attendance_percentage.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">Avg Attendance</p>
                    </div>
                  </div>                </div>
                
                <div className="pt-2">
                  <button className="w-full py-2 px-4 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors">
                    Mark Attendance for {course.course_code}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
