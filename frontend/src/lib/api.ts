// API functions for student attendance system
import { StudentInfo ,StudentMarksResponse, AttendanceReport } from '@/types/student';
import { 
  DailyAttendance, 
  CourseAttendanceStats, 

  MonthlyAttendanceData 
} from './types'

import { 
  CourseEnrollmentData, 
  EnrollmentResult, 
  CourseEnrollment 
} from '@/types/admin'
import Cookies from 'js-cookie'

// Base API URL - should be configured from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// Generic API request helper with authentication
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  console.log('Making API request to:', url);

  // Get auth token from cookies
  const token = Cookies.get('auth_token')

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    credentials: 'include', // Include cookies
    ...options,
  })

  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json()
    console.log('Response data type:', typeof data);
    console.log('Response data preview:', JSON.stringify(data).substring(0, 200) + '...');

    // For 409 Conflict responses (dependency issues), return the data instead of throwing
    // This allows the calling code to handle dependencies and offer force delete
    if (response.status === 409) {
      return data as T
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return data
  } else {
    const text = await response.text()
    console.error('Non-JSON response received:');
    console.error('URL:', url);
    console.error('Status:', response.status);
    console.error('Content-Type:', contentType);
    console.error('Response text (first 500 chars):', text.substring(0, 500));

    // If it looks like HTML, it might be a Next.js routing issue
    if (text.trim().startsWith('<!DOCTYPE')) {
      throw new Error('Received HTML instead of JSON - possible routing issue or server error')
    }

    throw new Error('Received non-JSON response from server')
  }
}

// Student API functions
export const studentApi = {
  // Get student profile information
  async getStudentProfile(UserId: string): Promise<StudentInfo> {
    console.log(`/api/student/students/${UserId}`  )
    return apiRequest<StudentInfo>(`/api/student/students/${UserId}`)
  },


  // Get today's attendance for a student
  async getTodayAttendance(userId: string): Promise<DailyAttendance[]> {
    const today = new Date().toISOString().split('T')[0]
    return apiRequest<DailyAttendance[]>(`/api/students/${userId}/attendance/daily?date=${today}`)
  },

  // Get attendance for a specific date
  async getAttendanceByDate(studentId: string, date: string): Promise<DailyAttendance[]> {
    return apiRequest<DailyAttendance[]>(`/api/students/${studentId}/attendance/daily?date=${date}`)
  },    

  // Get monthly attendance data for calendar
  async getMonthlyAttendance(
    userId: string, 
    year: number, 
    month: number
  ): Promise<MonthlyAttendanceData> {
    return apiRequest<MonthlyAttendanceData>(
      `/api/student/${userId}/attendance/monthly?year=${year}&month=${month}`
    )
  },

  // // Get overall attendance statistics
  // async getOverallStats(studentId: string, academicYear?: string): Promise<OverallAttendanceStats> {
  //   const params = academicYear ? `?academic_year=${academicYear}` : ''
  //   return apiRequest<OverallAttendanceStats>(`/api/students/${studentId}/attendance/stats${params}`)
  // },

  // Get student marks
async getStudentMarks(userId: string): Promise<StudentMarksResponse> {
  return apiRequest<StudentMarksResponse>(`/api/student/${userId}/marks`);
},

  // Get all stats at once
  async getAllStats(userId: string): Promise<AttendanceReport> {
    
    return apiRequest<AttendanceReport>(`/api/student/${userId}/stats`)
  },

  // async getCourseWiseStats(studentId: string, academicYear?: string): Promise<CourseAttendanceStats[]> {
  //   const params = academicYear ? `?academic_year=${academicYear}` : ''
  //   return apiRequest<CourseAttendanceStats[]>(`/api/students/${studentId}/attendance/courses${params}`)
  // },

  // Get attendance trend data
  // async getAttendanceTrend(
  //   studentId: string,
  //   period: 'weekly' | 'monthly' | 'semester',
  //   academicYear?: string
  // ): Promise<Array<{ period: string; percentage: number }>> {
  //   const params = new URLSearchParams()
  //   params.append('period', period)
  //   if (academicYear) params.append('academic_year', academicYear)

  //   return apiRequest<Array<{ period: string; percentage: number }>>(
  //     `/api/students/${studentId}/attendance/trend?${params.toString()}`
  //   )
//   },  // Get student's enrolled courses
//   async getEnrolledCourses(studentId: string, academicYear?: string): Promise<any[]> {
//     const params = academicYear ? `?academic_year=${academicYear}` : ''
//     return apiRequest<any[]>(`/api/students/${studentId}/courses${params}`)
//   }
// }
};

// Admin API functions
export const adminApi = {

  //for imports
  async getImportStatus() {
  return apiRequest<any>('/api/admin/import-status')
},
// Import management
async importTable(stepId: string, file: File): Promise<any> {
  const formData = new FormData()
  formData.append("file", file)

  return apiRequest<any>(`/api/admin/import/${stepId}`, {
    method: "POST",
    body: formData
  })
},

async clearDatabase(): Promise<any> {
  return apiRequest<any>('/api/admin/clear-database', {
    method: "POST"
  })
},

  // User management
  async getAllUsers(): Promise<any> {
    return apiRequest<any>('/api/users')
  },

  async getUserById(userId: string): Promise<any> {
    return apiRequest<any>(`/api/users/${userId}`)
  },

  async getUsersByRole(role: string): Promise<any> {
    return apiRequest<any>(`/api/users/role/${role}`)
  },

  async deleteUser(userId: string): Promise<any> {
    return apiRequest<any>(`/api/users/${userId}`, {
      method: 'DELETE'
    })
  },

  async forceDeleteUser(userId: string): Promise<any> {
    return apiRequest<any>(`/api/users/${userId}/force`, {
      method: 'DELETE'
    })
  },

  async updateUser(userId: string, data: {
    name: string;
    email?: string;
    username: string;
    phone: string;
    role: string;
    // Student-specific fields
    departmentId?: string;
    year?: number;
    section?: string;
    usn?: string;
  }): Promise<any> {
    return apiRequest<any>(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  async createUser(data: {
    name: string;
    username: string;
    phone?: string;
    role: string;
    password?: string;
    departmentId?: string;
    year?: number;
    section?: string;
  }): Promise<any> {
    return apiRequest<any>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Course management
  async getAllCourses(): Promise<any> {
    return apiRequest<any>('/api/courses')
  },

  async getCourseById(courseId: string): Promise<any> {
    return apiRequest<any>(`/api/courses/${courseId}`)
  },

  async getCoursesByDepartment(departmentId: string): Promise<any> {
    return apiRequest<any>(`/api/courses/department/${departmentId}`)
  },

  async getCoursesByType(courseType: string): Promise<any> {
    return apiRequest<any>(`/api/courses/type/${courseType}`)
  },

  async deleteCourse(courseId: string): Promise<any> {
    return apiRequest<any>(`/api/courses/${courseId}`, {
      method: 'DELETE'
    })
  },

  async forceDeleteCourse(courseId: string): Promise<any> {
    return apiRequest<any>(`/api/courses/${courseId}/force`, {
      method: 'DELETE'
    })
  },

  async updateCourse(courseId: string, data: {
    code: string;
    name: string;
    department: string;
    year?: string;
    type: 'core' | 'department_elective' | 'open_elective';
    hasTheoryComponent: boolean;
    hasLabComponent: boolean;
    restrictedDepartments?: string[];
  }): Promise<any> {
    return apiRequest<any>(`/api/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  async createCourse(data: {
    code: string;
    name: string;
    department: string;
    year: string;
    type: 'core' | 'department_elective' | 'open_elective';
    hasTheoryComponent: boolean;
    hasLabComponent: boolean;
    restrictedDepartments?: string[]; // Add restricted departments for open electives
  }): Promise<any> {
    return apiRequest<any>('/api/courses', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Course management with teacher assignments
  async getCourseManagement(): Promise<any> {
    return apiRequest<any>('/api/admin/course-management')
  },

  // Teacher assignment endpoints
  async assignTeacher(data: {
    offering_id: string;
    teacher_id: string
  }): Promise<any> {
    return apiRequest<any>('/api/admin/assign-teacher', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  async unassignTeacher(data: {
    offering_id: string
  }): Promise<any> {
    return apiRequest<any>('/api/admin/unassign-teacher', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  async autoAssignTeachers(): Promise<any> {
    return apiRequest<any>('/api/admin/auto-assign-teachers', {
      method: 'POST'
    })
  },

  // Department management
  async getAllDepartments(): Promise<any> {
    return apiRequest<any>('/api/departments')
  },

  async getDepartmentById(departmentId: string): Promise<any> {
    return apiRequest<any>(`/api/departments/${departmentId}`)
  },

  async getDepartmentsByCollege(collegeId: string): Promise<any> {
    return apiRequest<any>(`/api/departments/college/${collegeId}`)
  },

  async getDepartmentStats(departmentId: string): Promise<any> {
    return apiRequest<any>(`/api/departments/${departmentId}/stats`)
  },

  async createDepartment(departmentData: { name: string; code: string; college: string }): Promise<any> {
    return apiRequest<any>('/api/departments', {
      method: 'POST',
      body: JSON.stringify(departmentData)
    })
  },

  async updateDepartment(departmentId: string, departmentData: { name: string; code: string; college: string; sections?: any[] }): Promise<any> {
    return apiRequest<any>(`/api/departments/${departmentId}`, {
      method: 'PUT',
      body: JSON.stringify(departmentData)
    })
  },

  async deleteDepartment(departmentId: string): Promise<any> {
    return apiRequest<any>(`/api/departments/${departmentId}`, {
      method: 'DELETE'
    })
  },

  async forceDeleteDepartment(departmentId: string): Promise<any> {
    return apiRequest<any>(`/api/departments/${departmentId}/force`, {
      method: 'DELETE'
    })
  },

  // College management
  async getAllColleges(): Promise<any> {
    return apiRequest<any>('/api/colleges')
  },

  async getCollegeById(collegeId: string): Promise<any> {
    return apiRequest<any>(`/api/colleges/${collegeId}`)
  },

  async getCollegeStats(collegeId: string): Promise<any> {
    return apiRequest<any>(`/api/colleges/${collegeId}/stats`)
  },

  async deleteCollege(collegeId: string): Promise<any> {
    return apiRequest<any>(`/api/colleges/${collegeId}`, {
      method: 'DELETE'
    })
  },

  async forceDeleteCollege(collegeId: string): Promise<any> {
    return apiRequest<any>(`/api/colleges/${collegeId}/force`, {
      method: 'DELETE'
    })
  },

  async updateCollege(collegeId: string, data: { name: string; code: string }): Promise<any> {
    return apiRequest<any>(`/api/colleges/${collegeId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  async createCollege(data: { name: string; code: string }): Promise<any> {
    return apiRequest<any>('/api/colleges', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Database health
  async getDatabaseHealth(): Promise<any> {
    return apiRequest<any>('/api/db/health')
  },

  async getDatabaseSummary(): Promise<any> {
    return apiRequest<any>('/api/db/summary')
  },

  // Marks Management
  async getStudentMarks(courseId?: string, departmentId?: string, year?: number, studentId?: string, studentUsn?: string): Promise<{ status: string; data: any[] }> {
    const params = new URLSearchParams()
    if (courseId) params.append('courseId', courseId)
    if (departmentId) params.append('departmentId', departmentId)
    if (year) params.append('year', year.toString())
    if (studentId) params.append('studentId', studentId)
    if (studentUsn) params.append('studentUsn', studentUsn)

    return apiRequest<{ status: string; data: any[] }>(`/api/admin/marks?${params.toString()}`)
  },

  async updateStudentMark(enrollmentId: string, markType: string, value: number | null): Promise<{ status: string; data: any }> {
    return apiRequest<{ status: string; data: any }>(`/api/admin/marks/${enrollmentId}`, {
      method: 'PUT',
      body: JSON.stringify({ [markType]: value })
    })
  },

  async getStudentMarksByEnrollment(enrollmentId: string): Promise<{ status: string; data: any }> {
    return apiRequest<{ status: string; data: any }>(`/api/admin/marks/${enrollmentId}`)
  },

  // Attendance Management
  async getAttendanceByDate(date: string, courseId?: string, departmentId?: string): Promise<{ status: string; data: any[] }> {
    const params = new URLSearchParams()
    params.append('date', date)
    if (courseId) params.append('courseId', courseId)
    if (departmentId) params.append('departmentId', departmentId)

    return apiRequest<{ status: string; data: any[] }>(`/api/admin/attendance?${params.toString()}`)
  },

  async getAssignedCourses(): Promise<{ status: string; data: any[] }> {
    return apiRequest<{ status: string; data: any[] }>('/api/admin/assigned-courses')
  },

  async getStudentCourses(studentId: string): Promise<{ status: string; data: any[] }> {
    return apiRequest<{ status: string; data: any[] }>(`/api/admin/student-courses/${studentId}`)
  },

  async updateAttendance(attendanceId: string, status: 'present' | 'absent'): Promise<{ status: string; data: any }> {
    return apiRequest<{ status: string; data: any }>(`/api/admin/attendance/${attendanceId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    })
  },

  async createAttendanceRecord(data: {
    studentId: string
    date: string
    status: 'present' | 'absent'
    courseId?: string
  }): Promise<{ status: string; data: any }> {
    return apiRequest<{ status: string; data: any }>('/api/admin/attendance', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  async getAttendanceCalendar(month: number, year: number, departmentId?: string): Promise<{ status: string; data: any[] }> {
    const params = new URLSearchParams()
    params.append('month', month.toString())
    params.append('year', year.toString())
    if (departmentId) params.append('departmentId', departmentId)

    return apiRequest<{ status: string; data: any[] }>(`/api/admin/attendance/calendar?${params.toString()}`)
  },

  // Course Enrollment Management
  async getEligibleStudents(courseId: string, year: string, semester: string): Promise<{ status: string; data: CourseEnrollmentData }> {
    const params = new URLSearchParams()
    params.append('courseId',courseId)
    params.append('year', year)
    params.append('semester', semester)

    return apiRequest<{ status: string; data: CourseEnrollmentData }>(`/api/admin/courses/${courseId}/eligible-students?${params.toString()}`)
  },

  async enrollStudents(courseId: string, studentIds: string[], year: string, semester: string, teacherId?: string): Promise<{ status: string; data: EnrollmentResult }> {
    return apiRequest<{ status: string; data: EnrollmentResult }>(`/api/admin/courses/${courseId}/enroll-students`, {
      method: 'POST',
      body: JSON.stringify({
        studentIds,
        year,
        semester,
        teacherId
      })
    })
  },

  async getCourseEnrollments(courseId: string, year?: string, semester?: string): Promise<{ status: string; data: CourseEnrollment[] }> {
    const params = new URLSearchParams()
    if (year) params.append('year', year)
    if (semester) params.append('semester', semester)

    return apiRequest<{ status: string; data: CourseEnrollment[] }>(`/api/admin/courses/${courseId}/enrollments?${params.toString()}`)
  }
}

// Utility functions for data processing
export const attendanceUtils = {
  // Calculate attendance percentage
  calculatePercentage(present: number, total: number): number {
    return total > 0 ? Math.round((present / total) * 100 * 10) / 10 : 0
  },

  // Determine attendance status based on percentage and requirement
  getAttendanceStatus(percentage: number, required: number = 75): 'good' | 'warning' | 'critical' {
    if (percentage >= required + 5) return 'good'
    if (percentage >= required) return 'warning'
    return 'critical'
  },

  // Format date for display
  formatDate(date: string | Date): string {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  },

  // Format date for API requests (YYYY-MM-DD)
  formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0]
  },

  // Get month name
  getMonthName(monthIndex: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return months[monthIndex] || 'Unknown'
  },

  // Calculate days until minimum attendance requirement
  calculateDaysToMinimum(present: number, total: number, required: number = 75): number {
    const currentPercentage = this.calculatePercentage(present, total)
    if (currentPercentage >= required) return 0

    // Calculate how many more present days needed
    const requiredPresent = Math.ceil((required * total) / 100)
    return Math.max(0, requiredPresent - present)
  },

  // Generate time slots for a day (assuming 8 periods)
  generateTimeSlots(): string[] {
    return [
      '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
    ]
  }
}

// Mock data generators for development/testing
export const mockDataGenerators = {
  // Generate mock daily attendance
  generateMockDailyAttendance(): DailyAttendance[] {
    const subjects = [
      { name: 'Data Structures and Algorithms', code: 'CS301' },
      { name: 'Database Management Systems', code: 'CS302' },
      { name: 'Computer Networks', code: 'CS303' },
      { name: 'Software Engineering', code: 'CS304' },
      { name: 'Machine Learning', code: 'CS305' }
    ]

    const teachers = ['Dr. Smith', 'Prof. Johnson', 'Dr. Williams', 'Prof. Brown', 'Dr. Davis']
    const timeSlots = attendanceUtils.generateTimeSlots()
    const statuses: ('present' | 'absent' | 'not_marked')[] = ['present', 'present', 'absent', 'not_marked', 'not_marked']

    return subjects.map((subject, index) => ({
      course_name: subject.name,
      course_code: subject.code,
      teacher_name: teachers[index],
      period_number: index + 1,
      status: statuses[index],
      class_time: timeSlots[index],
      syllabus_covered: index < 3 ? `Topic ${index + 1} - Advanced concepts` : undefined
    }))
  },

  // Generate mock course statistics
  generateMockCourseStats(): CourseAttendanceStats[] {
    const subjects = [
      { name: 'Data Structures and Algorithms', code: 'CS301' },
      { name: 'Database Management Systems', code: 'CS302' },
      { name: 'Computer Networks', code: 'CS303' },
      { name: 'Software Engineering', code: 'CS304' }, { name: 'Machine Learning', code: 'CS305' }
    ]

    return subjects.map((subject) => {
      const present = Math.floor(Math.random() * 10) + 20 // 20-30
      const absent = Math.floor(Math.random() * 8) + 2    // 2-10
      const total = present + absent
      const percentage = attendanceUtils.calculatePercentage(present, total)

      return {
        course_name: subject.name,
        course_code: subject.code,
        present,
        absent,
        total,
        percentage,
        required_percentage: 75,
        status: attendanceUtils.getAttendanceStatus(percentage, 75)
      }
    })
  }
}
