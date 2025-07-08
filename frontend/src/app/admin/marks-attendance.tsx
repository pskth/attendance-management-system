'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Save,
  Calendar,
  Users,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { adminApi } from '@/lib/api'

// Types for marks and attendance (simplified from database structure)
interface StudentMark {
  id: string
  enrollmentId: string
  usn: string
  student_name: string
  course_code: string
  course_name: string
  // Theory marks
  mse1_marks: number | null
  mse2_marks: number | null
  mse3_marks: number | null
  task1_marks: number | null
  task2_marks: number | null
  task3_marks: number | null
  theory_total: number
  // Lab marks
  record_marks: number | null
  continuous_evaluation_marks: number | null
  lab_mse_marks: number | null
  lab_total: number
  last_updated_at: string
}

interface AttendanceRecord {
  id: string
  date: string
  studentId: string
  usn: string
  student_name: string
  status: 'present' | 'absent'
  courseId?: string
  courseName?: string
}

interface AttendanceDay {
  present: number
  absent: number
  total: number
  students: AttendanceRecord[]
}

interface MarksAttendanceProps {
  onNavigateToUsers?: (filters: { usn?: string }) => void
  selectedStudentId?: string
  selectedStudentName?: string
  initialMode?: 'marks' | 'attendance'
}

export default function MarksAttendanceManagement({ 
  selectedStudentId, 
  selectedStudentName, 
  initialMode = 'marks' 
}: MarksAttendanceProps) {
  // State management
  const [activeTab, setActiveTab] = useState<'marks' | 'attendance'>(initialMode)
  const [marks, setMarks] = useState<StudentMark[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [editingMarkId, setEditingMarkId] = useState<string | null>(null)
  const [editingMarkField, setEditingMarkField] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear())
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Load data from database
  useEffect(() => {
    if (activeTab === 'marks') {
      loadMarksData()
    } else {
      loadAttendanceData()
    }
  }, [activeTab, selectedDate, selectedDepartment])

  const loadMarksData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await adminApi.getStudentMarks(
        selectedCourse !== 'all' ? selectedCourse : undefined,
        selectedDepartment !== 'all' ? selectedDepartment : undefined,
        undefined, // year
        undefined, // studentId (UUID)
        selectedStudentId // studentUsn (USN string)
      )
      
      if (response.status === 'success') {
        // Transform API response to match our interface
        const transformedMarks: StudentMark[] = response.data.map((item: any) => ({
          id: item.id,
          enrollmentId: item.enrollmentId,
          usn: item.student?.usn || '',
          student_name: item.student?.user?.name || '',
          course_code: item.course?.code || '',
          course_name: item.course?.name || '',
          // Theory marks
          mse1_marks: item.theoryMarks?.mse1_marks || null,
          mse2_marks: item.theoryMarks?.mse2_marks || null,
          mse3_marks: item.theoryMarks?.mse3_marks || null,
          task1_marks: item.theoryMarks?.task1_marks || null,
          task2_marks: item.theoryMarks?.task2_marks || null,
          task3_marks: item.theoryMarks?.task3_marks || null,
          theory_total: (item.theoryMarks?.mse1_marks || 0) + (item.theoryMarks?.mse2_marks || 0) + 
                       (item.theoryMarks?.mse3_marks || 0) + (item.theoryMarks?.task1_marks || 0) + 
                       (item.theoryMarks?.task2_marks || 0) + (item.theoryMarks?.task3_marks || 0),
          // Lab marks
          record_marks: item.labMarks?.record_marks || null,
          continuous_evaluation_marks: item.labMarks?.continuous_evaluation_marks || null,
          lab_mse_marks: item.labMarks?.lab_mse_marks || null,
          lab_total: (item.labMarks?.record_marks || 0) + (item.labMarks?.continuous_evaluation_marks || 0) + 
                    (item.labMarks?.lab_mse_marks || 0),
          last_updated_at: item.updatedAt || new Date().toISOString()
        }))
        
        // Filter for specific student if provided
        const filteredMarks = selectedStudentId 
          ? transformedMarks.filter(mark => 
              mark.usn === selectedStudentId || mark.student_name === selectedStudentName
            )
          : transformedMarks
        
        setMarks(filteredMarks)
      }
    } catch (err) {
      setError('Failed to load marks data')
      console.error('Error loading marks:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAttendanceData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await adminApi.getAttendanceByDate(
        selectedDate,
        selectedCourse !== 'all' ? selectedCourse : undefined,
        selectedDepartment !== 'all' ? selectedDepartment : undefined
      )
      
      if (response.status === 'success') {
        // Transform API response to match our interface
        const transformedAttendance: AttendanceRecord[] = response.data.map((item: any) => ({
          id: item.id,
          date: item.date,
          studentId: item.studentId,
          usn: item.student?.usn || '',
          student_name: item.student?.user?.name || '',
          status: item.status,
          courseId: item.courseOffering?.course?.id,
          courseName: item.courseOffering?.course?.name
        }))
        
        // Filter for specific student if provided
        const filteredAttendance = selectedStudentId 
          ? transformedAttendance.filter(record => 
              record.usn === selectedStudentId || record.student_name === selectedStudentName
            )
          : transformedAttendance
        
        setAttendanceRecords(filteredAttendance)
      }
    } catch (err) {
      setError('Failed to load attendance data')
      console.error('Error loading attendance:', err)
    } finally {
      setLoading(false)
    }
  }

  // Display all marks without filtering
  const filteredMarks = marks

  // Display all attendance records without filtering
  const filteredAttendanceRecords = attendanceRecords

  // Handle marks editing
  const handleMarkEdit = async (enrollmentId: string, field: string, value: string) => {
    const numValue = value === '' ? null : parseInt(value)
    try {
      const response = await adminApi.updateStudentMark(enrollmentId, field, numValue)
      if (response.status === 'success') {
        // Update local state
        setMarks(prev => prev.map(mark => {
          if (mark.enrollmentId === enrollmentId) {
            const updatedMark = { ...mark, [field]: numValue }
            
            // Handle MSE3 eligibility constraint
            if (field === 'mse1_marks' || field === 'mse2_marks') {
              const mse1 = field === 'mse1_marks' ? numValue : updatedMark.mse1_marks;
              const mse2 = field === 'mse2_marks' ? numValue : updatedMark.mse2_marks;
              
              // If MSE1 + MSE2 >= 20, clear MSE3
              if ((mse1 || 0) + (mse2 || 0) >= 20) {
                updatedMark.mse3_marks = null;
              }
            }
            
            // Recalculate totals
            const theoryTotal = [
              updatedMark.mse1_marks,
              updatedMark.mse2_marks,
              updatedMark.mse3_marks,
              updatedMark.task1_marks,
              updatedMark.task2_marks,
              updatedMark.task3_marks
            ].reduce((sum, val) => (sum || 0) + (val || 0), 0)
            
            const labTotal = [
              updatedMark.record_marks,
              updatedMark.continuous_evaluation_marks,
              updatedMark.lab_mse_marks
            ].reduce((sum, val) => (sum || 0) + (val || 0), 0)
            
            updatedMark.theory_total = theoryTotal || 0
            updatedMark.lab_total = labTotal || 0
            updatedMark.last_updated_at = new Date().toISOString()
            return updatedMark
          }
          return mark
        }))
      }
    } catch (err) {
      console.error('Error updating mark:', err)
      console.error('Enrollment ID:', enrollmentId)
      console.error('Field:', field)
      console.error('Value:', value)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update mark'
      setError(`Failed to update mark: ${errorMessage}`)
    }
    setEditingMarkId(null)
    setEditingMarkField(null)
  }

  // Handle attendance toggle
  const toggleAttendance = async (recordId: string) => {
    const record = attendanceRecords.find(r => r.id === recordId)
    if (!record) return

    const newStatus = record.status === 'present' ? 'absent' : 'present'
    try {
      const response = await adminApi.updateAttendance(recordId, newStatus)
      if (response.status === 'success') {
        setAttendanceRecords(prev => prev.map(r => 
          r.id === recordId ? { ...r, status: newStatus } : r
        ))
      }
    } catch (err) {
      console.error('Error updating attendance:', err)
      setError('Failed to update attendance')
    }
  }

  // Calculate attendance summary for selected date
  const attendanceSummary = {
    present: attendanceRecords.filter(r => r.status === 'present').length,
    absent: attendanceRecords.filter(r => r.status === 'absent').length,
    total: attendanceRecords.length
  }

  // Generate calendar for current month
  const generateCalendar = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
    
    const days = []
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>)
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const hasData = false // We'll load this from API later
      const isSelected = date === selectedDate
      
      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`h-8 w-8 text-sm rounded ${
            isSelected 
              ? 'bg-blue-600 text-white' 
              : hasData 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : 'hover:bg-gray-100'
          }`}
        >
          {day}
        </button>
      )
    }
    
    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  const getMonthName = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return monthNames[currentMonth]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Student Marks & Attendance Management
                {selectedStudentName && (
                  <span className="text-base font-normal text-gray-600">
                    - {selectedStudentName}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-gray-800">
                Manage student academic records and attendance
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={activeTab === 'marks' ? 'default' : 'outline'}
                onClick={() => setActiveTab('marks')}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Marks
              </Button>
              <Button 
                variant={activeTab === 'attendance' ? 'default' : 'outline'}
                onClick={() => setActiveTab('attendance')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Attendance
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters for Attendance */}
      {activeTab === 'attendance' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                title="Filter by course"
              >
                <option value="all">All Courses</option>
                <option value="CS301">Data Structures</option>
                <option value="CS302">DBMS</option>
                <option value="CS303">Networks</option>
                <option value="CS304">Software Engineering</option>
              </select>
              <div className="text-sm text-gray-600 flex items-center">
                Selected Date: <span className="font-medium ml-1">{new Date(selectedDate).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'marks' && (
        /* Marks Management */
        <Card>
          <CardHeader>
            <CardTitle>Course Marks</CardTitle>
            <CardDescription>Click on any mark to edit. Shows theory marks and lab marks for each course. Totals are automatically calculated.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Course</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" colSpan={7}>Theory Marks</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" colSpan={4}>Lab Marks</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Last Updated</th>
                  </tr>
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code & Name</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MSE 1</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MSE 2</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MSE 3</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task 1</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task 2</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task 3</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Theory Total</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Continuous</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab MSE</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab Total</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredMarks.map((mark) => (
                    <tr key={mark.enrollmentId} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2">
                        <div className="font-mono text-sm font-bold">{mark.course_code}</div>
                        <div className="text-sm text-gray-600">{mark.course_name}</div>
                      </td>
                      {/* Theory Marks */}
                      {['mse1_marks', 'mse2_marks', 'mse3_marks', 'task1_marks', 'task2_marks', 'task3_marks'].map((field) => {
                        const isMse3 = field === 'mse3_marks';
                        const mse1 = mark.mse1_marks || 0;
                        const mse2 = mark.mse2_marks || 0;
                        const isMse3Ineligible = isMse3 && (mse1 + mse2) >= 20;
                        
                        return (
                        <td key={field} className="border border-gray-300 px-3 py-2">
                          {editingMarkId === mark.enrollmentId && editingMarkField === field && !isMse3Ineligible ? (
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              defaultValue={mark[field as keyof StudentMark] as string || ''}
                              className="w-16 h-8 text-sm"
                              onBlur={(e) => handleMarkEdit(mark.enrollmentId, field, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleMarkEdit(mark.enrollmentId, field, (e.target as HTMLInputElement).value)
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => {
                                if (!isMse3Ineligible) {
                                  setEditingMarkId(mark.enrollmentId)
                                  setEditingMarkField(field)
                                }
                              }}
                              className={`w-full text-left p-1 rounded ${
                                isMse3Ineligible 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                  : 'hover:bg-blue-50'
                              }`}
                              disabled={isMse3Ineligible}
                              title={isMse3Ineligible ? 'MSE3 not allowed when MSE1 + MSE2 ≥ 20' : ''}
                            >
                              {isMse3Ineligible ? '-' : (mark[field as keyof StudentMark] as string || '-')}
                            </button>
                          )}
                        </td>
                        );
                      })}
                      <td className="border border-gray-300 px-3 py-2 font-bold text-blue-600">{mark.theory_total}</td>
                      
                      {/* Lab Marks */}
                      {['record_marks', 'continuous_evaluation_marks', 'lab_mse_marks'].map((field) => (
                        <td key={field} className="border border-gray-300 px-3 py-2">
                          {editingMarkId === mark.enrollmentId && editingMarkField === field ? (
                            <Input
                              type="number"
                              min="0"
                              max={field === 'record_marks' ? '10' : '20'}
                              defaultValue={mark[field as keyof StudentMark] as string || ''}
                              className="w-16 h-8 text-sm"
                              onBlur={(e) => handleMarkEdit(mark.enrollmentId, field, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleMarkEdit(mark.enrollmentId, field, (e.target as HTMLInputElement).value)
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => {
                                setEditingMarkId(mark.enrollmentId)
                                setEditingMarkField(field)
                              }}
                              className="w-full text-left hover:bg-blue-50 p-1 rounded"
                            >
                              {mark[field as keyof StudentMark] as string || '-'}
                            </button>
                          )}
                        </td>
                      ))}
                      <td className="border border-gray-300 px-3 py-2 font-bold text-green-600">{mark.lab_total}</td>
                      
                      <td className="border border-gray-300 px-3 py-2 text-xs text-gray-500">
                        {new Date(mark.last_updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Attendance Calendar</CardTitle>
              <CardDescription>Click on a date to view/edit attendance</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="p-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="font-medium text-lg">
                  {getMonthName()} {currentYear}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="p-1"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {generateCalendar()}
              </div>
              <div className="mt-4 text-xs text-gray-600">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-green-100 rounded"></div>
                  <span>Has attendance data</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span>Selected date</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Attendance */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Attendance for {new Date(selectedDate).toLocaleDateString()}
                  </CardTitle>
                  <CardDescription>
                    {attendanceRecords.length > 0 ? 
                      `${attendanceSummary.present} present, ${attendanceSummary.absent} absent` :
                      'No attendance data for this date'
                    }
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">USN</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Student Name</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredAttendanceRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2 font-mono text-sm">{record.usn}</td>
                        <td className="border border-gray-300 px-3 py-2 font-medium">{record.student_name}</td>
                        <td className="border border-gray-300 px-3 py-2">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            record.status === 'present' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.status === 'present' ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {record.status}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleAttendance(record.id)}
                          >
                            <Clock className="w-4 h-4 mr-1" />
                            Toggle
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
