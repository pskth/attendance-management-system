'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  AlertTriangle,
  TrendingDown,
  Calendar,
  BarChart3,
  Download,
  Loader2
} from 'lucide-react'

import { Course, Section } from './dropdown-navigation'
import { TeacherAPI, StudentAttendanceAnalytics } from '@/lib/teacher-api'

interface AttendanceAnalyticsProps {
  courseOffering: Course
  selectedYear: string
  selectedDepartment: string
  selectedSection: Section
}

export function AttendanceAnalytics({
  courseOffering,
  selectedYear,
  selectedDepartment,
  selectedSection
}: AttendanceAnalyticsProps) {
  const [selectedThreshold, setSelectedThreshold] = useState<75 | 85>(85)
  const [analyticsData, setAnalyticsData] = useState<StudentAttendanceAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load real attendance data
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!courseOffering.offering_id) {
        setError('No course offering ID available')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await TeacherAPI.getAttendanceAnalytics(courseOffering.offering_id)
        setAnalyticsData(data)
      } catch (err) {
        console.error('Failed to load attendance analytics:', err)
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [courseOffering.offering_id])

  // Filter students based on attendance threshold
  const lowAttendanceStudents = analyticsData.filter(
    student => student.attendance.attendancePercentage < selectedThreshold
  )

  const criticalStudents = analyticsData.filter(
    student => student.attendance.attendancePercentage < 75
  )

  const warningStudents = analyticsData.filter(
    student => student.attendance.attendancePercentage >= 75 && student.attendance.attendancePercentage < 85
  )

  const exportData = () => {
    // Export real data to CSV
    const csvContent = [
      ['USN', 'Name', 'Total Classes', 'Attended', 'Attendance %', 'Phone', 'Email'].join(','),
      ...lowAttendanceStudents.map(student => [
        student.student.usn,
        student.student.name,
        student.attendance.totalClasses,
        student.attendance.presentCount,
        student.attendance.attendancePercentage.toFixed(1),
        student.student.phone || '',
        student.student.email || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${courseOffering.course_code}_low_attendance_report.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-gray-600">Loading attendance analytics...</span>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Error Loading Analytics</h3>
            <p className="text-gray-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center space-x-2 mb-1">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                <span>Attendance Analytics</span>
              </CardTitle>
              <CardDescription className="text-sm">
                {courseOffering.course_code} - {courseOffering.course_name} • Section {selectedSection.section_name} • {selectedDepartment}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{selectedYear}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{analyticsData.length}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{criticalStudents.length}</p>
                <p className="text-sm text-gray-600">Below 75%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-3">
              <TrendingDown className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{warningStudents.length}</p>
                <p className="text-sm text-gray-600">75% - 85%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {analyticsData.length - criticalStudents.length - warningStudents.length}
                </p>
                <p className="text-sm text-gray-600">Above 85%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Show students below:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedThreshold(75)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${selectedThreshold === 75
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  75%
                </button>
                <button
                  onClick={() => setSelectedThreshold(85)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${selectedThreshold === 85
                      ? 'bg-orange-100 text-orange-700 border border-orange-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  85%
                </button>
              </div>
            </div>

            <button
              onClick={exportData}
              className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded text-sm font-medium hover:bg-emerald-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Low Attendance Students */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            Students with Attendance Below {selectedThreshold}%
          </CardTitle>
          <CardDescription className="text-sm">
            {lowAttendanceStudents.length} students need attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lowAttendanceStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-green-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Great Job!</h3>
              <p className="text-gray-500">
                All students have attendance above {selectedThreshold}%
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-4 text-base font-semibold text-gray-900">Student</th>
                    <th className="text-left py-2 px-4 text-base font-semibold text-gray-900">USN</th>
                    <th className="text-center py-2 px-4 text-base font-semibold text-gray-900">Classes</th>
                    <th className="text-center py-2 px-4 text-base font-semibold text-gray-900">Attendance</th>
                    <th className="text-left py-2 px-4 text-base font-semibold text-gray-900">Phone</th>
                    <th className="text-left py-2 px-4 text-base font-semibold text-gray-900">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {lowAttendanceStudents.map((student) => (
                    <tr
                      key={student.student.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <span className="text-base font-medium text-gray-900">{student.student.name}</span>
                      </td>
                      <td className="py-3 px-4 text-base text-gray-900">{student.student.usn}</td>
                      <td className="py-3 px-4 text-center text-sm text-gray-600">
                        {student.attendance.presentCount}/{student.attendance.totalClasses}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-base font-semibold ${student.attendance.attendancePercentage < 75
                            ? 'text-red-600'
                            : student.attendance.attendancePercentage < 85
                              ? 'text-orange-600'
                              : 'text-green-600'
                          }`}>
                          {student.attendance.attendancePercentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-base text-gray-700">{student.student.phone || '-'}</td>
                      <td className="py-3 px-4 text-base text-gray-700">{student.student.email || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
