// API functions for student attendance system
import { 
  Student, 
  DailyAttendance, 
  CourseAttendanceStats, 
  OverallAttendanceStats, 
  MonthlyAttendanceData 
} from './types'

// Base API URL - should be configured from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// Generic API request helper
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  const data = await response.json()

  // For 409 Conflict responses (dependency issues), return the data instead of throwing
  // This allows the calling code to handle dependencies and offer force delete
  if (response.status === 409) {
    return data as T
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  return data
}

// Student API functions
export const studentApi = {
  // Get student profile information
  async getStudentProfile(studentId: string): Promise<Student> {
    return apiRequest<Student>(`/api/students/${studentId}`)
  },

  // Get today's attendance for a student
  async getTodayAttendance(studentId: string): Promise<DailyAttendance[]> {
    const today = new Date().toISOString().split('T')[0]
    return apiRequest<DailyAttendance[]>(`/api/students/${studentId}/attendance/daily?date=${today}`)
  },

  // Get attendance for a specific date
  async getAttendanceByDate(studentId: string, date: string): Promise<DailyAttendance[]> {
    return apiRequest<DailyAttendance[]>(`/api/students/${studentId}/attendance/daily?date=${date}`)
  },

  // Get monthly attendance data for calendar
  async getMonthlyAttendance(
    studentId: string, 
    year: number, 
    month: number
  ): Promise<MonthlyAttendanceData> {
    return apiRequest<MonthlyAttendanceData>(
      `/api/students/${studentId}/attendance/monthly?year=${year}&month=${month}`
    )
  },

  // Get overall attendance statistics
  async getOverallStats(studentId: string, academicYear?: string): Promise<OverallAttendanceStats> {
    const params = academicYear ? `?academic_year=${academicYear}` : ''
    return apiRequest<OverallAttendanceStats>(`/api/students/${studentId}/attendance/stats${params}`)
  },

  // Get course-wise attendance statistics
  async getCourseWiseStats(studentId: string, academicYear?: string): Promise<CourseAttendanceStats[]> {
    const params = academicYear ? `?academic_year=${academicYear}` : ''
    return apiRequest<CourseAttendanceStats[]>(`/api/students/${studentId}/attendance/courses${params}`)
  },

  // Get attendance trend data
  async getAttendanceTrend(
    studentId: string, 
    period: 'weekly' | 'monthly' | 'semester',
    academicYear?: string
  ): Promise<Array<{ period: string; percentage: number }>> {
    const params = new URLSearchParams()
    params.append('period', period)
    if (academicYear) params.append('academic_year', academicYear)
    
    return apiRequest<Array<{ period: string; percentage: number }>>(
      `/api/students/${studentId}/attendance/trend?${params.toString()}`
    )
  },  // Get student's enrolled courses
  async getEnrolledCourses(studentId: string, academicYear?: string): Promise<any[]> {
    const params = academicYear ? `?academic_year=${academicYear}` : ''
    return apiRequest<any[]>(`/api/students/${studentId}/courses${params}`)
  }
}

// Admin API functions
export const adminApi = {
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

  // Database health
  async getDatabaseHealth(): Promise<any> {
    return apiRequest<any>('/api/db/health')
  },

  async getDatabaseSummary(): Promise<any> {
    return apiRequest<any>('/api/db/summary')
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
      { name: 'Software Engineering', code: 'CS304' },      { name: 'Machine Learning', code: 'CS305' }
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
