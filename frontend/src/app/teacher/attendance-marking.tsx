// filepath: e:\GitHub\Inspirante\frontend\src\components\teacher\attendance-marking.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  XCircle, 
  UserCheck, 
  UserX,
  Save
} from 'lucide-react'

interface AttendanceMarkingProps {
  courseOffering: {
    offering_id: string
    course_code: string
    course_name: string
    class_section: string
  }
  selectedYear: string
  selectedDepartment: string
}

interface Student {
  student_id: string
  usn: string
  name: string
  attendance_status: 'present' | 'absent'
  photo_url?: string
}

// Mock data for students - replace with actual API call
const mockStudentData: Student[] = [
  {
    student_id: '1',
    usn: 'NNM22CS001',
    name: 'Aditya Sharma',
    attendance_status: 'present'
  },
  {
    student_id: '2',
    usn: 'NNM22CS002', 
    name: 'Bhavana Nair',
    attendance_status: 'present'
  },
  {
    student_id: '3',
    usn: 'NNM22CS003',
    name: 'Chetan Kumar',
    attendance_status: 'present'
  },
  {
    student_id: '4',
    usn: 'NNM22CS004',
    name: 'Divya Rao',
    attendance_status: 'present'
  },
  {
    student_id: '5',
    usn: 'NNM22CS005',
    name: 'Eshan Joshi',
    attendance_status: 'present'
  },
  {
    student_id: '6',
    usn: 'NNM22CS006',
    name: 'Fatima Khan',
    attendance_status: 'present'
  },
  {
    student_id: '7',
    usn: 'NNM22CS007',
    name: 'Ganesh Reddy',
    attendance_status: 'present'
  },
  {
    student_id: '8',
    usn: 'NNM22CS008',
    name: 'Harini Shetty',
    attendance_status: 'present'
  }
]

export function AttendanceMarking({
  courseOffering,
  selectedYear,
  selectedDepartment
}: AttendanceMarkingProps) {  const [students, setStudents] = useState<Student[]>(mockStudentData)
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
        const mixedStudents: Student[] = [
          { student_id: '1', usn: 'NNM22CS001', name: 'Aditya Sharma', attendance_status: 'present' },
          { student_id: '2', usn: 'NNM22AIDS002', name: 'Bhavana Nair', attendance_status: 'present' },
          { student_id: '3', usn: 'NNM22ISE003', name: 'Chetan Kumar', attendance_status: 'present' },
          { student_id: '4', usn: 'NNM22ECE004', name: 'Divya Rao', attendance_status: 'present' },
          { student_id: '5', usn: 'NNM22ME005', name: 'Rahul Verma', attendance_status: 'present' },
          { student_id: '6', usn: 'NNM22CE006', name: 'Priya Singh', attendance_status: 'present' },
          { student_id: '7', usn: 'NNM22CS007', name: 'Arjun Menon', attendance_status: 'present' },
          { student_id: '8', usn: 'NNM22AIDS008', name: 'Sneha Reddy', attendance_status: 'present' },
          { student_id: '9', usn: 'NNM22ISE009', name: 'Kavya Patel', attendance_status: 'present' },
          { student_id: '10', usn: 'NNM22ECE010', name: 'Rohit Gupta', attendance_status: 'present' },
          { student_id: '11', usn: 'NNM22ME011', name: 'Ananya Desai', attendance_status: 'present' },
          { student_id: '12', usn: 'NNM22CE012', name: 'Vikram Jain', attendance_status: 'present' }
        ]
        setStudents(mixedStudents)
      } else {
        // Regular departmental course students
        setStudents(mockStudentData)
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
  }, [courseOffering.offering_id, courseOffering.course_code])

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
      //   offering_id: courseOffering.offering_id,
      //   teacher_id: teacherId,
      //   class_date: currentDate.toISOString().split('T')[0],
      //   period_number: 1, // Get from actual period selection
      //   syllabus_covered: syllabusCovered,
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
    <div className="space-y-6">      {/* Header Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {courseOffering.course_code} - {courseOffering.course_name}
              </CardTitle>
              <CardDescription className="text-xs">
                Section {courseOffering.class_section} • {selectedDepartment} • {selectedYear}
              </CardDescription>            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="flex items-center space-x-2">
              <Users className="w-3 h-3 text-blue-500" />
              <div>
                <p className="font-medium text-xs">{students.length}</p>
                <p className="text-xs text-gray-600">Total Students</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <UserCheck className="w-3 h-3 text-green-500" />
              <div>
                <p className="font-medium text-green-600 text-xs">{presentCount}</p>
                <p className="text-xs text-gray-600">Present</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <UserX className="w-3 h-3 text-red-500" />
              <div>
                <p className="font-medium text-red-600 text-xs">{absentCount}</p>
                <p className="text-xs text-gray-600">Absent</p>
              </div>
            </div>          </div>

          {/* Reset Button */}
          <div className="mt-2 flex justify-end">
            <button
              onClick={markAllPresent}
              className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors"
            >
              Reset All to Present
            </button>
          </div>
        
          {/* Attendance Percentage */}
          <div className="mt-1">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Class Attendance</span>
              <span>{attendancePercentage.toFixed(1)}%</span>
            </div>            <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
              <div 
                className={`h-1 rounded-full bg-emerald-500 transition-all duration-300 ${
                  attendancePercentage >= 90 ? 'w-full' :
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
          <CardTitle>Student Attendance</CardTitle>
          <CardDescription>Mark attendance for each student</CardDescription>
        </CardHeader>
        <CardContent>          <div className="space-y-2">
            {students.map((student) => (
              <div 
                key={student.student_id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {student.photo_url ? (
                      <img 
                        src={student.photo_url} 
                        alt={student.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">{student.usn}</p>
                  </div>
                </div>
                  <div className="flex space-x-2">
                  <button
                    onClick={() => markAttendance(student.student_id, student.attendance_status === 'present' ? 'absent' : 'present')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      student.attendance_status === 'absent'
                        ? 'bg-red-600 text-white'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    <XCircle className="w-4 h-4 inline mr-1" />
                    Absent
                  </button>
                </div>
              </div>
            ))}
          </div>        </CardContent>
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
