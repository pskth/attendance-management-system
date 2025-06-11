// Types for student attendance system

export interface User {
  user_id: string
  username: string
  name: string
  phone?: string
  email?: string
  photo_url?: string
  created_at: string
}

export interface Student {
  student_id: string
  user_id: string
  usn: string
  college_name: string
  semester: number
  user: User
}

export interface Course {
  course_id: string
  course_code: string
  course_name: string
  department: string
  course_type: 'core' | 'department_elective' | 'open_elective'
}

export interface Teacher {
  teacher_id: string
  user_id: string
  department: string
  user: User
}

export interface CourseOffering {
  offering_id: string
  course_id: string
  teacher_id: string
  class_section: string
  academic_year: string
  semester: number
  department: string
  course: Course
  teacher: Teacher
}

export interface AttendanceClass {
  attendance_id: string
  offering_id: string
  teacher_id: string
  class_date: string
  period_number: number
  syllabus_covered?: string
  status: 'held' | 'canceled' | 'rescheduled'
  course_offering: CourseOffering
}

export interface AttendanceRecord {
  record_id: string
  attendance_id: string
  student_id: string
  status: 'present' | 'absent'
  attendance: AttendanceClass
}

export interface DailyAttendance {
  course_name: string
  course_code: string
  teacher_name: string
  period_number: number
  status: 'present' | 'absent' | 'not_marked'
  class_time: string
  syllabus_covered?: string
}

export interface CourseAttendanceStats {
  course_name: string
  course_code: string
  present: number
  absent: number
  total: number
  percentage: number
  required_percentage: number
  status: 'good' | 'warning' | 'critical'
}

export interface OverallAttendanceStats {
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

export interface MonthlyAttendanceData {
  [date: string]: {
    present: number
    absent: number
    total: number
    classes: Array<{
      course_name: string
      course_code: string
      status: 'present' | 'absent'
      period_number: number
      syllabus_covered?: string
    }>
  }
}

// Additional interfaces for teacher dashboard
export interface TeacherData {
  teacher_id: string
  user_id: string
  name: string
  phone?: string
  department: string
  designation?: string
  employee_id?: string
  college_name?: string
  photo_url?: string
}

export interface StudentEnrollment {
  enrollment_id: string
  student_id: string
  offering_id: string
  attempt_number: number
  academic_year: string
  student: Student
}

export interface CourseOfferingWithStats {
  offering_id: string
  course_id: string
  teacher_id: string
  class_section: string
  academic_year: string
  semester: number
  department: string
  course_code: string
  course_name: string
  course_type: 'core' | 'department_elective' | 'open_elective'
  total_students: number
  total_classes_held: number
  syllabus_completion: number
  attendance_percentage: number
}

export interface YearData {
  year: string
  academic_year: string
  semester: number
  total_students: number
  total_courses: number
}

export interface DepartmentData {
  department: string
  short_name: string
  total_students: number
  total_courses: number
  active_classes_today: number
  color: string
  icon_bg: string
  icon_color: string
}
