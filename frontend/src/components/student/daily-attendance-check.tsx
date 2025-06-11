'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, CheckCircle, XCircle, Calendar } from 'lucide-react'

interface DailyAttendanceProps {
  studentId: string
}

interface AttendanceRecord {
  course_name: string
  course_code: string
  teacher_name: string
  status: 'present' | 'absent' | 'not_marked'
  hours: number
}

// Mock data - replace with actual API calls
const mockTodayAttendance: AttendanceRecord[] = [
  {
    course_name: 'Data Structures and Algorithms',
    course_code: 'CS301',
    teacher_name: 'Dr. Smith',
    status: 'present',
    hours: 3
  },
  {
    course_name: 'Database Management Systems',
    course_code: 'CS302',
    teacher_name: 'Prof. Johnson',
    status: 'present',
    hours: 4
  },
  {
    course_name: 'Computer Networks',
    course_code: 'CS303',
    teacher_name: 'Dr. Williams',
    status: 'absent',
    hours: 3
  },
  {
    course_name: 'Software Engineering',
    course_code: 'CS304',
    teacher_name: 'Prof. Brown',
    status: 'present',
    hours: 3
  },
  {
    course_name: 'Machine Learning',
    course_code: 'CS305',
    teacher_name: 'Dr. Davis',
    status: 'present',
    hours: 4
  }
]

export function DailyAttendanceCheck({ studentId }: DailyAttendanceProps) {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [currentDate] = useState(new Date())

  // Mock function to load today's attendance - replace with actual API call
  const loadTodayAttendance = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setAttendanceData(mockTodayAttendance)
    } catch (error) {
      console.error('Error loading attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTodayAttendance()
  }, [studentId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'Present'
      case 'absent':
        return 'Absent'
      default:
        return 'Not Marked'
    }
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'absent':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }
    const presentCount = attendanceData.filter(record => record.status === 'present').length
  const absentCount = attendanceData.filter(record => record.status === 'absent').length
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Today&apos;s Attendance</span>
          </CardTitle>
          <CardDescription>
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{presentCount}</div>
              <div className="text-sm text-green-700">Present</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">{absentCount}</div>
              <div className="text-sm text-red-700">Absent</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Attendance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Class Details</CardTitle>
          <CardDescription>
            Individual class attendance for today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              <span className="text-gray-600">Loading today&apos;s attendance...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {attendanceData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No classes scheduled for today</p>
                </div>
              ) : (
                attendanceData.map((record, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getStatusIcon(record.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {record.course_name}
                          </h4>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{record.course_code}</span>
                            <span>•</span>
                            <span>{record.teacher_name}</span>
                            <span>•</span>
                            <span>{record.hours} {record.hours === 1 ? 'hour' : 'hours'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                      {getStatusText(record.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
