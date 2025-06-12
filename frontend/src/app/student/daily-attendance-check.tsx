'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, CheckCircle, XCircle, Calendar } from 'lucide-react'

interface DailyAttendanceProps {
  studentId: string
  selectedDate?: string | null
  selectedDateData?: {
    present: number
    absent: number
    total: number
    classes: Array<{
      course_name: string
      course_code: string
      status: 'present' | 'absent'
    }>
  } | null
  showSummaryCard?: boolean
  showDetailsCard?: boolean
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

export function DailyAttendanceCheck({ 
  studentId, 
  selectedDate, 
  selectedDateData,
  showSummaryCard = true,
  showDetailsCard = true
}: DailyAttendanceProps) {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [currentDate] = useState(new Date())

  // Determine what data to display - selected date or today
  const isShowingSelectedDate = selectedDate && selectedDateData
  const displayData = isShowingSelectedDate ? 
    selectedDateData.classes.map(classInfo => ({
      course_name: classInfo.course_name,
      course_code: classInfo.course_code,
      teacher_name: '', // Selected date data doesn't have teacher names
      status: classInfo.status as 'present' | 'absent' | 'not_marked',
      hours: 3 // Default hours since not available in calendar data
    })) : 
    attendanceData

  const displayDate = isShowingSelectedDate ? 
    new Date(selectedDate) : 
    currentDate

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
      default:        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }
    const presentCount = displayData.filter(record => record.status === 'present').length
  const absentCount = displayData.filter(record => record.status === 'absent').length
  
  return (
    <div className="space-y-4">
      {/* Summary Card - Same size as calendar */}
      {showSummaryCard && (
        <Card className="h-[300px] flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{isShowingSelectedDate ? 'Selected Date Attendance' : 'Today\'s Attendance'}</span>
            </CardTitle>
            <CardDescription className="text-sm">
              {displayDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 flex-1 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                <div className="text-4xl font-bold text-green-600">{presentCount}</div>
                <div className="text-sm text-green-700 mt-2">Present</div>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                <div className="text-4xl font-bold text-red-600">{absentCount}</div>
                <div className="text-sm text-red-700 mt-2">Absent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Attendance Card */}
      {showDetailsCard && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Class Details</CardTitle>
            <CardDescription className="text-sm">
              Individual class attendance for {isShowingSelectedDate ? 'selected date' : 'today'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {loading && !isShowingSelectedDate ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-gray-600 text-sm">Loading...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {displayData.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No classes scheduled</p>
                  </div>
                ) : (                  displayData.map((record, index) => (
                    <div 
                      key={index}
                      className="flex items-center p-6 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 mr-4">
                        {getStatusIcon(record.status)}
                      </div>                      <div className="flex-1 grid grid-cols-4 gap-8 items-center text-sm font-medium text-gray-900">
                        <div className="text-center">{record.course_code}</div>
                        <div className="text-center truncate" title={record.course_name}>{record.course_name}</div>
                        <div className="text-center whitespace-nowrap">Total hours: {record.hours}</div>
                        <div className="text-center whitespace-nowrap">Hours attended: {record.status === 'present' ? record.hours : 0}</div>
                      </div>
                      <div className={`ml-4 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(record.status)}`}>
                        {getStatusText(record.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
