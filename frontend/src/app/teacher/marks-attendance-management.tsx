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
    ChevronRight,
    Download
} from 'lucide-react'
import { TeacherAPI, type CourseOffering } from '@/lib/teacher-api'

// Types for marks and attendance 
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
    status: 'present' | 'absent' | 'unmarked'
    courseId?: string
    courseName?: string
}

interface MarksAttendanceProps {
    courses: CourseOffering[]
    selectedCourseId?: string
    initialMode?: 'marks' | 'attendance'
}

export default function TeacherMarksAttendanceManagement({
    courses,
    selectedCourseId,
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
    const [selectedCourse, setSelectedCourse] = useState<string>(selectedCourseId || 'all')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState<string>('')

    // Load data from database
    useEffect(() => {
        if (activeTab === 'marks') {
            loadMarksData()
        } else {
            loadAttendanceData()
        }
    }, [activeTab, selectedDate, selectedCourse])

    const loadMarksData = async () => {
        setLoading(true)
        setError(null)
        try {
            // Get marks for courses assigned to teacher
            if (selectedCourse === 'all') {
                // Load marks for all teacher's courses
                const allMarks: StudentMark[] = []

                for (const course of courses) {
                    try {
                        // Get students for this course offering
                        const studentsResponse = await TeacherAPI.getCourseStudents(course.offeringId)

                        // For each student, get their marks
                        for (const studentData of studentsResponse) {
                            try {
                                const marksResponse = await TeacherAPI.getStudentMarks(
                                    course.course.id, // courseId
                                    studentData.student.usn // studentUsn
                                )

                                if (marksResponse.status === 'success' && marksResponse.data.length > 0) {
                                    const item = marksResponse.data[0] // Should only be one result for specific USN and course

                                    const studentMark: StudentMark = {
                                        id: item.id,
                                        enrollmentId: item.enrollmentId,
                                        usn: item.student?.usn || studentData.student.usn,
                                        student_name: item.student?.user?.name || studentData.student.name,
                                        course_code: item.course?.code || course.course.code,
                                        course_name: item.course?.name || course.course.name,
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
                                    }

                                    allMarks.push(studentMark)
                                }
                            } catch (err) {
                                console.warn(`Could not load marks for student ${studentData.student.usn} in course ${course.course.code}:`, err)
                                // Create empty marks record for students without marks yet
                                const studentMark: StudentMark = {
                                    id: `${studentData.enrollmentId}-empty`,
                                    enrollmentId: studentData.enrollmentId,
                                    usn: studentData.student.usn,
                                    student_name: studentData.student.name,
                                    course_code: course.course.code,
                                    course_name: course.course.name,
                                    mse1_marks: null,
                                    mse2_marks: null,
                                    mse3_marks: null,
                                    task1_marks: null,
                                    task2_marks: null,
                                    task3_marks: null,
                                    theory_total: 0,
                                    record_marks: null,
                                    continuous_evaluation_marks: null,
                                    lab_mse_marks: null,
                                    lab_total: 0,
                                    last_updated_at: new Date().toISOString()
                                }
                                allMarks.push(studentMark)
                            }
                        }
                    } catch (err) {
                        console.error(`Error loading course ${course.course.code}:`, err)
                    }
                }

                setMarks(allMarks)
            } else {
                // Load marks for specific course
                const course = courses.find(c => c.offeringId === selectedCourse)
                if (!course) return

                const studentsResponse = await TeacherAPI.getCourseStudents(course.offeringId)
                const courseMarks: StudentMark[] = []

                for (const studentData of studentsResponse) {
                    try {
                        const marksResponse = await TeacherAPI.getStudentMarks(
                            course.course.id,
                            studentData.student.usn
                        )

                        if (marksResponse.status === 'success' && marksResponse.data.length > 0) {
                            const item = marksResponse.data[0]

                            const studentMark: StudentMark = {
                                id: item.id,
                                enrollmentId: item.enrollmentId,
                                usn: item.student?.usn || studentData.student.usn,
                                student_name: item.student?.user?.name || studentData.student.name,
                                course_code: item.course?.code || course.course.code,
                                course_name: item.course?.name || course.course.name,
                                mse1_marks: item.theoryMarks?.mse1_marks || null,
                                mse2_marks: item.theoryMarks?.mse2_marks || null,
                                mse3_marks: item.theoryMarks?.mse3_marks || null,
                                task1_marks: item.theoryMarks?.task1_marks || null,
                                task2_marks: item.theoryMarks?.task2_marks || null,
                                task3_marks: item.theoryMarks?.task3_marks || null,
                                theory_total: (item.theoryMarks?.mse1_marks || 0) + (item.theoryMarks?.mse2_marks || 0) +
                                    (item.theoryMarks?.mse3_marks || 0) + (item.theoryMarks?.task1_marks || 0) +
                                    (item.theoryMarks?.task2_marks || 0) + (item.theoryMarks?.task3_marks || 0),
                                record_marks: item.labMarks?.record_marks || null,
                                continuous_evaluation_marks: item.labMarks?.continuous_evaluation_marks || null,
                                lab_mse_marks: item.labMarks?.lab_mse_marks || null,
                                lab_total: (item.labMarks?.record_marks || 0) + (item.labMarks?.continuous_evaluation_marks || 0) +
                                    (item.labMarks?.lab_mse_marks || 0),
                                last_updated_at: item.updatedAt || new Date().toISOString()
                            }

                            courseMarks.push(studentMark)
                        }
                    } catch (err) {
                        console.warn(`Could not load marks for student ${studentData.student.usn}:`, err)
                        // Create empty marks record
                        const studentMark: StudentMark = {
                            id: `${studentData.enrollmentId}-empty`,
                            enrollmentId: studentData.enrollmentId,
                            usn: studentData.student.usn,
                            student_name: studentData.student.name,
                            course_code: course.course.code,
                            course_name: course.course.name,
                            mse1_marks: null,
                            mse2_marks: null,
                            mse3_marks: null,
                            task1_marks: null,
                            task2_marks: null,
                            task3_marks: null,
                            theory_total: 0,
                            record_marks: null,
                            continuous_evaluation_marks: null,
                            lab_mse_marks: null,
                            lab_total: 0,
                            last_updated_at: new Date().toISOString()
                        }
                        courseMarks.push(studentMark)
                    }
                }

                setMarks(courseMarks)
            }
        } catch (err) {
            setError('Failed to load marks data')
            console.error('Error loading marks:', err)
        } finally {
            setLoading(false)
        }
    }

    const loadAttendanceData = async () => {
        if (selectedCourse === 'all') {
            setAttendanceRecords([])
            return
        }

        setLoading(true)
        setError(null)
        try {
            // Load student attendance for the selected date and course
            const response = await TeacherAPI.getStudentAttendance(selectedCourse, selectedDate)

            if (response.status === 'success') {
                const transformedAttendance: AttendanceRecord[] = response.data.map((item: any) => ({
                    id: item.attendanceRecordId || `temp-${item.studentId}`, // Use temp ID if no record exists yet
                    date: selectedDate,
                    studentId: item.studentId,
                    usn: item.usn || '',
                    student_name: item.student_name || '',
                    status: item.status as 'present' | 'absent' | 'unmarked',
                    courseId: item.courseId,
                    courseName: item.courseName
                }))

                setAttendanceRecords(transformedAttendance)
            }
        } catch (err) {
            setError('Failed to load attendance data')
            console.error('Error loading attendance:', err)
        } finally {
            setLoading(false)
        }
    }

    // Handle marks editing
    const handleMarkEdit = async (enrollmentId: string, field: string, value: string) => {
        const numValue = value === '' ? null : parseInt(value)
        try {
            const response = await TeacherAPI.updateStudentMark(enrollmentId, field, numValue)
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

        if (selectedCourse === 'all') {
            setError('Please select a specific course to mark attendance')
            return
        }

        try {
            // Cycle through the three states: unmarked -> present -> absent -> unmarked
            let newStatus: 'present' | 'absent' | 'unmarked'
            if (record.status === 'unmarked') {
                newStatus = 'present'
            } else if (record.status === 'present') {
                newStatus = 'absent'
            } else {
                newStatus = 'unmarked'
            }

            const response = await TeacherAPI.updateStudentAttendance({
                studentId: record.studentId,
                courseId: selectedCourse,
                date: selectedDate,
                status: newStatus
            })

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

    // Bulk mark all students with a specific status
    const markAllAttendance = async (status: 'present' | 'absent' | 'unmarked') => {
        if (selectedCourse === 'all') {
            setError('Please select a specific course to mark attendance')
            return
        }

        if (filteredAttendanceRecords.length === 0) {
            setError('No students to mark attendance for')
            return
        }

        try {
            setLoading(true)

            // Update all filtered records
            const updatePromises = filteredAttendanceRecords.map(record =>
                TeacherAPI.updateStudentAttendance({
                    studentId: record.studentId,
                    courseId: selectedCourse,
                    date: selectedDate,
                    status: status
                })
            )

            await Promise.all(updatePromises)

            // Update local state
            setAttendanceRecords(prev => prev.map(r => {
                const isFiltered = filteredAttendanceRecords.some(fr => fr.id === r.id)
                return isFiltered ? { ...r, status } : r
            }))

            // Success feedback via console for now
            console.log(`Successfully marked ${filteredAttendanceRecords.length} student(s) as ${status}`)
        } catch (err) {
            console.error('Error marking bulk attendance:', err)
            setError('Failed to mark attendance for all students')
        } finally {
            setLoading(false)
        }
    }

    // Create attendance session for selected date and course
    // Export marks functionality
    const exportMarks = () => {
        const csvContent = [
            ['USN', 'Name', 'Course', 'MSE1', 'MSE2', 'MSE3', 'Task1', 'Task2', 'Task3', 'Theory Total', 'Record', 'Continuous', 'Lab MSE', 'Lab Total'].join(','),
            ...marks.map(mark => [
                mark.usn,
                mark.student_name,
                `${mark.course_code} - ${mark.course_name}`,
                mark.mse1_marks || '',
                mark.mse2_marks || '',
                mark.mse3_marks || '',
                mark.task1_marks || '',
                mark.task2_marks || '',
                mark.task3_marks || '',
                mark.theory_total,
                mark.record_marks || '',
                mark.continuous_evaluation_marks || '',
                mark.lab_mse_marks || '',
                mark.lab_total
            ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `teacher_marks_${selectedCourse === 'all' ? 'all_courses' : selectedCourse}_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    // Filter data based on search term
    const filteredMarks = marks.filter(mark => {
        if (!searchTerm.trim()) return true
        const search = searchTerm.toLowerCase()
        return (
            mark.usn.toLowerCase().includes(search) ||
            mark.student_name.toLowerCase().includes(search) ||
            mark.course_code.toLowerCase().includes(search) ||
            mark.course_name.toLowerCase().includes(search)
        )
    })

    const filteredAttendanceRecords = attendanceRecords.filter(record => {
        if (!searchTerm.trim()) return true
        const search = searchTerm.toLowerCase()
        return (
            record.usn.toLowerCase().includes(search) ||
            record.student_name.toLowerCase().includes(search) ||
            (record.courseName && record.courseName.toLowerCase().includes(search))
        )
    })

    // Calculate attendance summary for selected date (using filtered data)
    const attendanceSummary = {
        present: filteredAttendanceRecords.filter(r => r.status === 'present').length,
        absent: filteredAttendanceRecords.filter(r => r.status === 'absent').length,
        unmarked: filteredAttendanceRecords.filter(r => r.status === 'unmarked').length,
        total: filteredAttendanceRecords.length
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
                    className={`h-8 w-8 text-sm rounded ${isSelected
                        ? 'bg-emerald-600 text-white'
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
                                Marks & Attendance Management
                            </CardTitle>
                            <CardDescription className="text-gray-800">
                                View and edit student marks and attendance for your assigned courses
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={activeTab === 'marks' ? 'default' : 'outline'}
                                onClick={() => setActiveTab('marks')}
                                className={activeTab === 'marks' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                            >
                                <BookOpen className="w-4 h-4 mr-2" />
                                Marks
                            </Button>
                            <Button
                                variant={activeTab === 'attendance' ? 'default' : 'outline'}
                                onClick={() => setActiveTab('attendance')}
                                className={activeTab === 'attendance' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                Attendance
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Course Filter */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4 items-center flex-wrap">
                        <div className="flex gap-4 items-center">
                            <label htmlFor="course-select" className="text-sm font-medium">
                                Select Course:
                            </label>
                            <select
                                id="course-select"
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                className="rounded-md border border-gray-300 px-3 py-2 text-sm min-w-[300px]"
                            >
                                <option value="all">All My Courses</option>
                                {courses.map((course) => (
                                    <option key={course.offeringId} value={course.offeringId}>
                                        {course.course.code} - {course.course.name}
                                        {course.section && ` (Section ${course.section.name})`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-4 items-center">
                            <label htmlFor="student-search" className="text-sm font-medium">
                                Search Student:
                            </label>
                            <Input
                                id="student-search"
                                type="text"
                                placeholder="Search by USN, name, or course..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="min-w-[250px]"
                            />
                        </div>
                        {activeTab === 'marks' && (
                            <Button onClick={exportMarks} variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Export Marks
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <p className="text-red-600">{error}</p>
                    </CardContent>
                </Card>
            )}

            {loading && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                            <span className="ml-2 text-gray-600">Loading...</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!loading && activeTab === 'marks' && (
                /* Marks Management */
                <Card>
                    <CardHeader>
                        <CardTitle>Student Marks</CardTitle>
                        <CardDescription>
                            Click on any mark to edit. Shows theory marks and lab marks for each course. Totals are automatically calculated.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Student</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Course</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" colSpan={7}>Theory Marks</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" colSpan={4}>Lab Marks</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Last Updated</th>
                                    </tr>
                                    <tr>
                                        <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USN & Name</th>
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
                                    {filteredMarks.length === 0 ? (
                                        <tr>
                                            <td colSpan={12} className="border border-gray-300 px-6 py-8 text-center">
                                                <div className="text-gray-500">
                                                    {searchTerm.trim() ? (
                                                        <div>
                                                            <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                            <p className="font-medium">No students found</p>
                                                            <p className="text-sm">No students match "{searchTerm}". Try a different search term.</p>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                            <p className="font-medium">No marks data available</p>
                                                            <p className="text-sm">Select a course to view and edit student marks</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredMarks.map((mark) => (
                                            <tr key={mark.enrollmentId} className="hover:bg-gray-50">
                                                <td className="border border-gray-300 px-3 py-2">
                                                    <div className="font-mono text-sm font-bold">{mark.usn}</div>
                                                    <div className="text-sm text-gray-600">{mark.student_name}</div>
                                                </td>
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
                                                                    className={`w-full text-left p-1 rounded ${isMse3Ineligible
                                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                        : 'hover:bg-emerald-50'
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
                                                <td className="border border-gray-300 px-3 py-2 font-bold text-emerald-600">{mark.theory_total}</td>

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
                                                                className="w-full text-left hover:bg-emerald-50 p-1 rounded"
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
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!loading && activeTab === 'attendance' && (
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
                                    <div className="w-3 h-3 bg-emerald-600 rounded"></div>
                                    <span>Selected date</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Daily Attendance */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <div className="flex flex-col space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">
                                            Attendance for {new Date(selectedDate).toLocaleDateString()}
                                        </CardTitle>
                                        <CardDescription>
                                            {attendanceRecords.length > 0 ? (
                                                <>
                                                    {attendanceSummary.present} present, {attendanceSummary.absent} absent
                                                    {attendanceSummary.unmarked > 0 && `, ${attendanceSummary.unmarked} unmarked`}
                                                </>
                                            ) : selectedCourse === 'all' ? (
                                                'Select a specific course to view attendance'
                                            ) : (
                                                'All students are unmarked for this date - click to mark attendance'
                                            )}
                                        </CardDescription>
                                    </div>
                                </div>

                                {/* Bulk Action Buttons */}
                                {selectedCourse !== 'all' && filteredAttendanceRecords.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            onClick={() => markAllAttendance('present')}
                                            disabled={loading}
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Mark All Present
                                        </Button>
                                        <Button
                                            onClick={() => markAllAttendance('absent')}
                                            disabled={loading}
                                            size="sm"
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Mark All Absent
                                        </Button>
                                        <Button
                                            onClick={() => markAllAttendance('unmarked')}
                                            disabled={loading}
                                            size="sm"
                                            variant="outline"
                                        >
                                            <Clock className="w-4 h-4 mr-2" />
                                            Mark All Unmarked
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">USN</th>
                                            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Student Name</th>
                                            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Course</th>
                                            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status (Click to Toggle)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {filteredAttendanceRecords.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="border border-gray-300 px-6 py-8 text-center">
                                                    <div className="text-gray-500">
                                                        {searchTerm.trim() ? (
                                                            <div>
                                                                <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                                <p className="font-medium">No students found</p>
                                                                <p className="text-sm">No students match "{searchTerm}". Try a different search term.</p>
                                                            </div>
                                                        ) : selectedCourse === 'all' ? (
                                                            <div>
                                                                <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                                <p className="font-medium">Select a specific course to mark attendance</p>
                                                                <p className="text-sm">Choose a course from the dropdown above to view and mark student attendance</p>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                                <p className="font-medium">Loading attendance data...</p>
                                                                <p className="text-sm">Attendance data will appear automatically when loaded</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAttendanceRecords.map((record) => (
                                                <tr key={record.id} className="hover:bg-gray-50">
                                                    <td className="border border-gray-300 px-3 py-2 font-mono text-sm">{record.usn}</td>
                                                    <td className="border border-gray-300 px-3 py-2 font-medium">{record.student_name}</td>
                                                    <td className="border border-gray-300 px-3 py-2">
                                                        <div className="text-sm">
                                                            <div className="font-medium">{record.courseName || 'No Course'}</div>
                                                        </div>
                                                    </td>
                                                    <td className="border border-gray-300 px-3 py-2">
                                                        <button
                                                            onClick={() => toggleAttendance(record.id)}
                                                            className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium transition-colors duration-200 ${record.status === 'present'
                                                                ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
                                                                : record.status === 'absent'
                                                                    ? 'bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer'
                                                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer'
                                                                } hover:scale-105`}
                                                            title={
                                                                record.status === 'unmarked'
                                                                    ? 'Click to mark as Present'
                                                                    : record.status === 'present'
                                                                        ? 'Click to mark as Absent'
                                                                        : 'Click to mark as Unmarked'
                                                            }
                                                        >
                                                            {record.status === 'present' ? (
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                            ) : record.status === 'absent' ? (
                                                                <XCircle className="w-3 h-3 mr-1" />
                                                            ) : (
                                                                <Clock className="w-3 h-3 mr-1" />
                                                            )}
                                                            {record.status === 'unmarked' ? 'Unmarked' : record.status === 'present' ? 'Present' : 'Absent'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
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
