'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Target,
  RefreshCw,
  Award,
  AlertTriangle
} from 'lucide-react'

interface AttendanceStatsProps {
  studentId: string
  compact?: boolean
}

interface CourseAttendance {
  course_name: string
  course_code: string
  present: number
  absent: number
  total: number
  percentage: number
  required_percentage: number
  status: 'good' | 'warning' | 'critical'
}

interface OverallStats {
  total_present: number
  total_absent: number
  total_classes: number
  overall_percentage: number
  trend: 'up' | 'down' | 'stable'
  monthly_trend: Array<{
    month: string
    percentage: number
  }>
}

// Mock data - replace with actual API calls
const mockCourseAttendance: CourseAttendance[] = [
  {
    course_name: 'Data Structures and Algorithms',
    course_code: 'CS301',
    present: 28,
    absent: 4,
    total: 32,
    percentage: 87.5,
    required_percentage: 75,
    status: 'good'
  },
  {
    course_name: 'Database Management Systems',
    course_code: 'CS302',
    present: 30,
    absent: 2,
    total: 32,
    percentage: 93.75,
    required_percentage: 75,
    status: 'good'
  },
  {
    course_name: 'Computer Networks',
    course_code: 'CS303',
    present: 24,
    absent: 8,
    total: 32,
    percentage: 75,
    required_percentage: 75,
    status: 'warning'
  },
  {
    course_name: 'Software Engineering',
    course_code: 'CS304',
    present: 22,
    absent: 10,
    total: 32,
    percentage: 68.75,
    required_percentage: 75,
    status: 'critical'
  },
  {
    course_name: 'Machine Learning',
    course_code: 'CS305',
    present: 26,
    absent: 6,
    total: 32,
    percentage: 81.25,
    required_percentage: 75,
    status: 'good'
  }
]

const mockOverallStats: OverallStats = {
  total_present: 130,
  total_absent: 30,
  total_classes: 160,
  overall_percentage: 81.25,
  trend: 'up',
  monthly_trend: [
    { month: 'Aug', percentage: 78 },
    { month: 'Sep', percentage: 82 },
    { month: 'Oct', percentage: 79 },
    { month: 'Nov', percentage: 84 },
    { month: 'Dec', percentage: 81 }
  ]
}

const COLORS = {
  present: '#10b981',
  absent: '#ef4444',
  good: '#10b981',
  warning: '#f59e0b',
  critical: '#ef4444'
}

export function AttendanceStats({ studentId, compact = false }: AttendanceStatsProps) {
  const [courseData, setCourseData] = useState<CourseAttendance[]>([])
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null)
  const [loading, setLoading] = useState(false)

  // Mock function to load attendance statistics - replace with actual API call
  const loadAttendanceStats = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setCourseData(mockCourseAttendance)
      setOverallStats(mockOverallStats)
    } catch (error) {
      console.error('Error loading attendance stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAttendanceStats()
  }, [studentId])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Loading attendance statistics...</span>
        </CardContent>
      </Card>
    )
  }

  if (!overallStats) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">No attendance data available</p>
        </CardContent>
      </Card>
    )
  }
  // Data for pie chart
  const pieData = [
    { name: 'Present', value: overallStats.total_present, color: COLORS.present },
    { name: 'Absent', value: overallStats.total_absent, color: COLORS.absent }
  ]

  if (compact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span>Quick Stats</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Overall Percentage */}
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {overallStats.overall_percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-blue-700">Overall Attendance</div>
              <div className="flex items-center justify-center mt-2">
                {overallStats.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                ) : overallStats.trend === 'down' ? (
                  <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                ) : null}
                <span className="text-xs text-gray-600">
                  {overallStats.total_present}/{overallStats.total_classes} classes
                </span>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex justify-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Present ({overallStats.total_present})</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Absent ({overallStats.total_absent})</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{overallStats.total_present}</p>
                <p className="text-sm text-gray-600">Classes Attended</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{overallStats.total_absent}</p>
                <p className="text-sm text-gray-600">Classes Missed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{overallStats.total_classes}</p>
                <p className="text-sm text-gray-600">Total Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-lg ${
                overallStats.overall_percentage >= 75 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {overallStats.overall_percentage >= 75 ? (
                  <Award className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div>
                <p className={`text-2xl font-bold ${
                  overallStats.overall_percentage >= 75 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {overallStats.overall_percentage.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Overall Percentage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Distribution</CardTitle>
            <CardDescription>Overall attendance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
            <CardDescription>Attendance percentage over months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overallStats.monthly_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Attendance']} />
                  <Line 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Attendance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subject-wise Attendance</CardTitle>
              <CardDescription>Attendance percentage for each subject</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadAttendanceStats}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courseData.map((course, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{course.course_name}</h4>
                    <p className="text-sm text-gray-500">{course.course_code}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    course.status === 'good' ? 'bg-green-100 text-green-800' :
                    course.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {course.percentage.toFixed(1)}%
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Present: {course.present}</span>
                    <span>Absent: {course.absent}</span>
                    <span>Total: {course.total}</span>
                  </div>                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${Math.min(course.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>        </CardContent>
      </Card>
    </div>
  )
}
