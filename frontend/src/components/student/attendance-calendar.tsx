'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle, 
  XCircle,
  Circle,
  RefreshCw
} from 'lucide-react'

interface AttendanceCalendarProps {
  studentId: string
  academicYear: string
}

interface MonthlyAttendance {
  [date: string]: {
    present: number
    absent: number
    total: number
    classes: Array<{      course_name: string
      course_code: string
      status: 'present' | 'absent'
    }>
  }
}

// Mock data - replace with actual API calls
const mockMonthlyData: MonthlyAttendance = {
  '2025-06-02': { present: 3, absent: 1, total: 4, classes: [
    { course_name: 'Data Structures', course_code: 'CS301', status: 'present' },
    { course_name: 'DBMS', course_code: 'CS302', status: 'present' },
    { course_name: 'Networks', course_code: 'CS303', status: 'absent' },
    { course_name: 'Software Eng', course_code: 'CS304', status: 'present' }
  ]},
  '2025-06-03': { present: 4, absent: 0, total: 4, classes: [
    { course_name: 'Data Structures', course_code: 'CS301', status: 'present' },
    { course_name: 'DBMS', course_code: 'CS302', status: 'present' },
    { course_name: 'Networks', course_code: 'CS303', status: 'present' },
    { course_name: 'Software Eng', course_code: 'CS304', status: 'present' }
  ]},
  '2025-06-04': { present: 4, absent: 0, total: 4, classes: [
    { course_name: 'Data Structures', course_code: 'CS301', status: 'present' },
    { course_name: 'DBMS', course_code: 'CS302', status: 'present' },
    { course_name: 'Networks', course_code: 'CS303', status: 'present' },
    { course_name: 'Software Eng', course_code: 'CS304', status: 'present' }
  ]},
  '2025-06-05': { present: 2, absent: 2, total: 4, classes: [
    { course_name: 'Data Structures', course_code: 'CS301', status: 'absent' },
    { course_name: 'DBMS', course_code: 'CS302', status: 'present' },
    { course_name: 'Networks', course_code: 'CS303', status: 'absent' },
    { course_name: 'Software Eng', course_code: 'CS304', status: 'present' }
  ]},
  '2025-06-06': { present: 2, absent: 2, total: 4, classes: [
    { course_name: 'Data Structures', course_code: 'CS301', status: 'absent' },
    { course_name: 'DBMS', course_code: 'CS302', status: 'present' },
    { course_name: 'Networks', course_code: 'CS303', status: 'absent' },
    { course_name: 'Software Eng', course_code: 'CS304', status: 'present' }
  ]},
  '2025-06-09': { present: 0, absent: 4, total: 4, classes: [
    { course_name: 'Data Structures', course_code: 'CS301', status: 'absent' },
    { course_name: 'DBMS', course_code: 'CS302', status: 'absent' },
    { course_name: 'Networks', course_code: 'CS303', status: 'absent' },
    { course_name: 'Software Eng', course_code: 'CS304', status: 'absent' }
  ]},
  '2025-06-10': { present: 4, absent: 0, total: 4, classes: [
    { course_name: 'Data Structures', course_code: 'CS301', status: 'present' },
    { course_name: 'DBMS', course_code: 'CS302', status: 'present' },
    { course_name: 'Networks', course_code: 'CS303', status: 'present' },
    { course_name: 'Software Eng', course_code: 'CS304', status: 'present' }
  ]},
  '2025-06-11': { present: 3, absent: 1, total: 4, classes: [
    { course_name: 'Data Structures', course_code: 'CS301', status: 'present' },
    { course_name: 'DBMS', course_code: 'CS302', status: 'present' },
    { course_name: 'Networks', course_code: 'CS303', status: 'present' },
    { course_name: 'Software Eng', course_code: 'CS304', status: 'absent' }
  ]},
  '2025-06-12': { present: 3, absent: 1, total: 4, classes: [
    { course_name: 'Data Structures', course_code: 'CS301', status: 'present' },
    { course_name: 'DBMS', course_code: 'CS302', status: 'present' },
    { course_name: 'Networks', course_code: 'CS303', status: 'present' },
    { course_name: 'Software Eng', course_code: 'CS304', status: 'absent' }
  ]},
  '2025-06-13': { present: 1, absent: 3, total: 4, classes: [
    { course_name: 'Data Structures', course_code: 'CS301', status: 'absent' },
    { course_name: 'DBMS', course_code: 'CS302', status: 'present' },
    { course_name: 'Networks', course_code: 'CS303', status: 'absent' },
    { course_name: 'Software Eng', course_code: 'CS304', status: 'absent' }
  ]},
  '2025-06-16': { present: 4, absent: 0, total: 4, classes: [
    { course_name: 'Data Structures', course_code: 'CS301', status: 'present' },
    { course_name: 'DBMS', course_code: 'CS302', status: 'present' },
    { course_name: 'Networks', course_code: 'CS303', status: 'present' },
    { course_name: 'Software Eng', course_code: 'CS304', status: 'present' }
  ]},
  '2025-06-17': { present: 2, absent: 2, total: 4, classes: [
    { course_name: 'Data Structures', course_code: 'CS301', status: 'present' },
    { course_name: 'DBMS', course_code: 'CS302', status: 'absent' },
    { course_name: 'Networks', course_code: 'CS303', status: 'present' },
    { course_name: 'Software Eng', course_code: 'CS304', status: 'absent' }
  ]},
  '2025-06-18': { present: 4, absent: 0, total: 4, classes: [
    { course_name: 'Data Structures', course_code: 'CS301', status: 'present' },
    { course_name: 'DBMS', course_code: 'CS302', status: 'present' },
    { course_name: 'Networks', course_code: 'CS303', status: 'present' },
    { course_name: 'Software Eng', course_code: 'CS304', status: 'present' }
  ]},
  '2025-06-19': { present: 3, absent: 1, total: 4, classes: [
    { course_name: 'Data Structures', course_code: 'CS301', status: 'present' },
    { course_name: 'DBMS', course_code: 'CS302', status: 'present' },
    { course_name: 'Networks', course_code: 'CS303', status: 'absent' },
    { course_name: 'Software Eng', course_code: 'CS304', status: 'present' }
  ]},
  '2025-06-20': { present: 0, absent: 4, total: 4, classes: [
    { course_name: 'Data Structures', course_code: 'CS301', status: 'absent' },
    { course_name: 'DBMS', course_code: 'CS302', status: 'absent' },
    { course_name: 'Networks', course_code: 'CS303', status: 'absent' },
    { course_name: 'Software Eng', course_code: 'CS304', status: 'absent' }
  ]},
  '2025-06-23': { present: 2, absent: 2, total: 4, classes: [
    { course_name: 'Data Structures', course_code: 'CS301', status: 'present' },
    { course_name: 'DBMS', course_code: 'CS302', status: 'present' },
    { course_name: 'Networks', course_code: 'CS303', status: 'absent' },
    { course_name: 'Software Eng', course_code: 'CS304', status: 'absent' }
  ]},
  '2025-06-24': { present: 4, absent: 0, total: 4, classes: [
    { course_name: 'Data Structures', course_code: 'CS301', status: 'present' },
    { course_name: 'DBMS', course_code: 'CS302', status: 'present' },
    { course_name: 'Networks', course_code: 'CS303', status: 'present' },
    { course_name: 'Software Eng', course_code: 'CS304', status: 'present' }
  ]},
  '2025-06-25': { present: 1, absent: 3, total: 4, classes: [
    { course_name: 'Data Structures', course_code: 'CS301', status: 'absent' },
    { course_name: 'DBMS', course_code: 'CS302', status: 'absent' },
    { course_name: 'Networks', course_code: 'CS303', status: 'present' },
    { course_name: 'Software Eng', course_code: 'CS304', status: 'absent' }
  ]},
  '2025-06-26': { present: 3, absent: 1, total: 4, classes: [
    { course_name: 'Data Structures', course_code: 'CS301', status: 'present' },
    { course_name: 'DBMS', course_code: 'CS302', status: 'present' },
    { course_name: 'Networks', course_code: 'CS303', status: 'present' },
    { course_name: 'Software Eng', course_code: 'CS304', status: 'absent' }
  ]}
}

export function AttendanceCalendar({ studentId }: AttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyAttendance>({})
  const [loading, setLoading] = useState(false)
  // Load attendance data for current month
  const loadMonthlyAttendance = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMonthlyData(mockMonthlyData)
    } catch (error) {
      console.error('Error loading monthly attendance:', error)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    loadMonthlyAttendance()
  }, [currentDate, studentId])

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    setCurrentDate(newDate)
    setSelectedDate(null)
  }

  const goToNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    setCurrentDate(newDate)
    setSelectedDate(null)
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const getDayStatus = (dateKey: string) => {
    const data = monthlyData[dateKey]
    if (!data || data.total === 0) return 'no-class'
    
    const attendanceRate = data.present / data.total
    if (attendanceRate === 1) return 'full-present'
    if (attendanceRate === 0) return 'full-absent'
    return 'partial'
  }

  const getDayColor = (status: string) => {
    switch (status) {
      case 'full-present':
        return 'bg-green-500 text-white'
      case 'full-absent':
        return 'bg-red-500 text-white'
      case 'partial':
        return 'bg-yellow-500 text-white'
      default:
        return 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }
  }

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-12 w-12" />
      )
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day)
      const status = getDayStatus(dateKey)
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()
      const isSelected = selectedDate === dateKey

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(dateKey)}
          className={`h-12 w-12 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-200 relative ${
            getDayColor(status)
          } ${
            isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
          } ${
            isToday ? 'ring-1 ring-blue-300' : ''
          }`}
        >
          {day}
          {status !== 'no-class' && (
            <div className="absolute -bottom-1 -right-1">
              {status === 'full-present' && <CheckCircle className="w-3 h-3 text-green-600 bg-white rounded-full" />}
              {status === 'full-absent' && <XCircle className="w-3 h-3 text-red-600 bg-white rounded-full" />}
              {status === 'partial' && <Circle className="w-3 h-3 text-yellow-600 bg-white rounded-full" />}
            </div>
          )}
        </button>
      )
    }

    return days
  }

  const selectedDateData = selectedDate ? monthlyData[selectedDate] : null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <span>Attendance Calendar</span>
              </CardTitle>
              <CardDescription>
                Click on any date to view detailed attendance
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadMonthlyAttendance()}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Day Labels */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
              <span className="text-gray-600">Loading calendar...</span>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {renderCalendarGrid()}
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Full Attendance</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Partial Attendance</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>All Absent</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 border rounded"></div>
              <span>No Classes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && selectedDateData && (
        <Card>
          <CardHeader>
            <CardTitle>
              Attendance Details - {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardTitle>
            <CardDescription>
              {selectedDateData.present} present, {selectedDateData.absent} absent out of {selectedDateData.total} classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedDateData.classes.map((classInfo, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {classInfo.status === 'present' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{classInfo.course_name}</h4>                      <p className="text-sm text-gray-500">
                        {classInfo.course_code}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    classInfo.status === 'present' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {classInfo.status === 'present' ? 'Present' : 'Absent'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
