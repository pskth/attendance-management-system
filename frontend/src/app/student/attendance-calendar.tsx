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
import { studentApi } from '@/lib/api'
import type { MonthlyAttendanceData } from '@/lib/types'

interface AttendanceCalendarProps {
  studentId: string
  academicYear?: string
  onDateSelect?: (date: string, data: MonthlyAttendanceData[string] | null) => void
}

export function AttendanceCalendar({ studentId, onDateSelect }: AttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyAttendanceData>({})
  const [loading, setLoading] = useState(false)  // Load attendance data for current month
  const loadMonthlyAttendance = async () => {
    setLoading(true)
    try {
      // Simulate API call

      
      await new Promise(resolve => setTimeout(resolve, 1000))

      const res = await studentApi.getMonthlyAttendance(studentId, currentDate.getFullYear(), currentDate.getMonth() + 1)
      console.log("Monthly attendance data:", res.data)
      // The API returns either keyed by date or a single month aggregation
      // If it's a keyed object, use it directly; if not, wrap it
      let monthlyAttendance: MonthlyAttendanceData = {}
      if (res.data && typeof res.data === 'object') {
        // Check if it has date keys or if it's a single month aggregation
        const keys = Object.keys(res.data)
        if (keys.length > 0 && (keys[0].includes('-') || keys[0].match(/^\d/))) {
          // Looks like date keys, use directly
          monthlyAttendance = res.data as unknown as MonthlyAttendanceData
        } else if ('present' in res.data && 'absent' in res.data) {
          // Single aggregation, wrap it with a generic key
          monthlyAttendance = { 'aggregated': res.data as unknown as any }
        }
      }
      setMonthlyData(monthlyAttendance)
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
    const days = []    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-8 w-full" />
      )
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day)
      const status = getDayStatus(dateKey)
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()
      const isSelected = selectedDate === dateKey

      days.push(        <button
          key={day}
          onClick={() => {
            setSelectedDate(dateKey)
            const data = monthlyData[dateKey] || null
            onDateSelect?.(dateKey, data)
          }}          className={`h-8 w-full rounded flex items-center justify-center text-xs font-medium transition-all duration-200 relative ${
            getDayColor(status)
          } ${
            isSelected ? 'ring-2 ring-blue-500' : ''
          } ${
            isToday ? 'ring-2 ring-blue-300' : ''
          }`}
        >
          {day}
          {status !== 'no-class' && (
            <div className="absolute -bottom-0.5 -right-0.5">
              {status === 'full-present' && <CheckCircle className="w-1.5 h-1.5 text-green-600 bg-white rounded-full" />}
              {status === 'full-absent' && <XCircle className="w-1.5 h-1.5 text-red-600 bg-white rounded-full" />}
              {status === 'partial' && <Circle className="w-1.5 h-1.5 text-yellow-600 bg-white rounded-full" />}
            </div>
          )}
        </button>
      )    }    return days
  }
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 sm:pb-3">        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
              <CalendarIcon className="w-4 h-4 text-blue-600" />
              <span>Attendance Calendar </span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Click dates to view details
            </CardDescription>
          </div>
        </div></CardHeader>      <CardContent className="pt-0 pb-3 flex-1 overflow-y-auto flex flex-col">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="h-7 w-7 p-0">
            <ChevronLeft className="w-3 h-3" />
          </Button>
          <h3 className="text-sm font-semibold">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <Button variant="outline" size="sm" onClick={goToNextMonth} className="h-7 w-7 p-0">
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>{/* Day Labels */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="h-6 w-full flex items-center justify-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>        {/* Calendar Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600 mr-1" />
            <span className="text-gray-600 text-xs">Loading...</span>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-0.5 mb-3 flex-1">
            {renderCalendarGrid()}
          </div>
        )}        {/* Compact Legend */}
        <div className="grid grid-cols-4 gap-1 text-xs mt-auto pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded"></div>
            <span className="text-xs">Full</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-yellow-500 rounded"></div>
            <span className="text-xs">Partial</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded"></div>
            <span className="text-xs">Absent</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-200 border rounded"></div>
            <span className="text-xs">None</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}