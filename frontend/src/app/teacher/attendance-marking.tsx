// filepath: e:\GitHub\Inspirante\frontend\src\components\teacher\attendance-marking.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  UserCheck,
  UserX,
  Save
} from 'lucide-react'

import { Course, Section } from './dropdown-navigation'
import mockAttendanceStudentsImport from '@/data/mockAttendanceStudents.json'
import mockOpenElectiveStudentsImport from '@/data/mockOpenElectiveStudents.json'

interface AttendanceMarkingProps {
  courseOffering: Course
  selectedYear: string
  selectedDepartment: string
  selectedSection: Section
}

interface Student {
  student_id: string
  usn: string
  name: string
  attendance_status: 'present' | 'absent'
  photo_url?: string
}

// Type the imported data
const mockAttendanceStudents: Student[] = mockAttendanceStudentsImport as Student[]
const mockOpenElectiveStudents: Student[] = mockOpenElectiveStudentsImport as Student[]

export function AttendanceMarking({
  courseOffering,
  selectedYear,
  selectedDepartment,
  selectedSection
}: AttendanceMarkingProps) {
  const [students, setStudents] = useState<Student[]>(mockAttendanceStudents)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load student data when course offering changes
  const loadStudentData = async () => {
    setLoading(true)
    try {
      // Replace with actual API call
      // const data = await fetchCourseStudents(courseOffering.offering_id, teacherId)
      // setStudents(data)

      // For open electives, load students from multiple departments
      if (courseOffering.course_code.startsWith('OE')) {
        // Mock data for open elective students from mixed departments
        setStudents(mockOpenElectiveStudents)
      } else {
        // Regular departmental course students
        setStudents(mockAttendanceStudents)
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('Error loading student data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudentData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseOffering.course_id, courseOffering.course_code])

  const markAttendance = (studentId: string, status: 'present' | 'absent') => {
    setStudents(prev => prev.map(student =>
      student.student_id === studentId
        ? { ...student, attendance_status: status }
        : student
    ))
  }
  const markAllPresent = () => {
    setStudents(prev => prev.map(student => ({
      ...student,
      attendance_status: 'present' as const
    })))
  }

  const saveAttendance = async () => {
    setSaving(true)
    try {
      // Replace with actual API call
      // First create attendance record
      // const attendanceRecord = await createAttendance({
      //   offering_id: courseOffering.course_id,
      //   teacher_id: teacherId,
      //   class_date: currentDate.toISOString().split('T')[0],
      //   period_number: 1, // Get from actual period selection
      //   syllabus_covered: 'Class attendance recorded',
      //   hours_taken: 1,
      //   status: 'held'
      // })

      // Then create attendance records for each student
      // await Promise.all(students.map(student => 
      //   createAttendanceRecord({
      //     attendance_id: attendanceRecord.attendance_id,
      //     student_id: student.student_id,
      //     status: student.attendance_status === 'not_marked' ? 'absent' : student.attendance_status
      //   })
      // ))

      console.log('Saving attendance with:', {
        students: students.map(s => ({ id: s.student_id, name: s.name, status: s.attendance_status }))
      })

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      alert('Attendance saved successfully!')
    } catch (error) {
      console.error('Error saving attendance:', error)
      alert('Error saving attendance. Please try again.')
    } finally {
      setSaving(false)
    }
  }
  const presentCount = students.filter(s => s.attendance_status === 'present').length
  const absentCount = students.filter(s => s.attendance_status === 'absent').length
  const attendancePercentage = students.length > 0 ? (presentCount / students.length) * 100 : 0

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">      {/* Header Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="text-lg sm:text-xl truncate">
                {courseOffering.course_code} - {courseOffering.course_name}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Section {selectedSection.section_name} • {selectedDepartment} • {selectedYear}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6 lg:gap-8">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="text-center">
                  <p className="font-medium text-base sm:text-lg">{students.length}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Total Students</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div className="text-center">
                  <p className="font-medium text-green-600 text-base sm:text-lg">{presentCount}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Present</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <UserX className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="text-center">
                  <p className="font-medium text-red-600 text-base sm:text-lg">{absentCount}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Absent</p>
                </div>
              </div>
              <button
                onClick={markAllPresent}
                className="px-3 sm:px-4 py-2 bg-green-100 text-green-700 rounded text-sm sm:text-base font-medium hover:bg-green-200 transition-colors whitespace-nowrap"
              >
                Reset All to Present
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          {/* Attendance Percentage */}
          <div>
            <div className="flex justify-between text-sm sm:text-base text-gray-600 mb-1">
              <span>Class Attendance</span>
              <span>{attendancePercentage.toFixed(1)}%</span>
            </div>            <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
              <div
                className={`h-1 rounded-full bg-emerald-500 transition-all duration-300 ${attendancePercentage >= 90 ? 'w-full' :
                    attendancePercentage >= 80 ? 'w-4/5' :
                      attendancePercentage >= 70 ? 'w-3/4' :
                        attendancePercentage >= 60 ? 'w-3/5' :
                          attendancePercentage >= 50 ? 'w-1/2' :
                            attendancePercentage >= 40 ? 'w-2/5' :
                              attendancePercentage >= 30 ? 'w-1/3' :
                                attendancePercentage >= 20 ? 'w-1/5' :
                                  attendancePercentage >= 10 ? 'w-1/12' : 'w-0'
                  }`}
              />            </div>          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Student Attendance</CardTitle>
          <CardDescription className="text-sm sm:text-base">Mark attendance for each student</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 sm:px-4 text-base sm:text-lg font-medium">USN</th>
                  <th className="text-left py-3 px-2 sm:px-4 text-base sm:text-lg font-medium">Name</th>
                  <th className="text-center py-3 px-2 sm:px-4 text-base sm:text-lg font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.student_id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-2 sm:px-4 text-sm sm:text-base">{student.usn}</td>
                    <td className="py-3 px-2 sm:px-4 text-sm sm:text-base font-medium truncate max-w-0">{student.name}</td>
                    <td className="py-3 px-2 sm:px-4 text-center">
                      <button
                        onClick={() => markAttendance(student.student_id, student.attendance_status === 'present' ? 'absent' : 'present')}
                        className={`px-3 sm:px-4 py-2 rounded text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${student.attendance_status === 'present'
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                      >
                        {student.attendance_status === 'present' ? 'Present' : 'Absent'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card>
        <CardContent className="py-4">
          <button
            onClick={saveAttendance}
            disabled={saving}
            className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>
              {saving ? 'Saving Attendance...' : 'Save Attendance'}
            </span>
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
