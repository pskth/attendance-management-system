// lib/teacher-api.ts
import Cookies from 'js-cookie';

const API_BASE_URL = 'http://localhost:4000/api';

// Utility function to get auth headers
function getAuthHeaders() {
    const token = Cookies.get('auth_token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

// Type definitions
export interface TeacherProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    photoUrl?: string;
    department: string;
    departmentCode: string;
    college: string;
    collegeCode: string;
}

export interface TeacherStatistics {
    totalCourses: number;
    totalStudents: number;
    totalSessions: number;
    averageAttendance: number;
}

export interface RecentSession {
    id: string;
    date: string;
    courseName: string;
    courseCode: string;
    section: string;
    topic: string;
    attendanceCount: number;
    presentCount: number;
}

export interface TodaySchedule {
    courseId: string;
    courseName: string;
    courseCode: string;
    section: string;
    time: string;
    duration: string;
    studentsEnrolled: number;
}

export interface TeacherDashboardData {
    teacher: TeacherProfile;
    statistics: TeacherStatistics;
    recentSessions: RecentSession[];
    todaySchedule: TodaySchedule[];
}

export interface CourseOffering {
    offeringId: string;
    course: {
        id: string;
        name: string;
        code: string;
        type: string;
        hasTheoryComponent: boolean;
        hasLabComponent: boolean;
        department: string;
    };
    section: {
        id: string;
        name: string;
    } | null;
    academicYear: string;
    enrolledStudents: number;
    students: Array<{
        id: string;
        name: string;
        usn: string;
    }>;
}

export interface Student {
    enrollmentId: string;
    student: {
        id: string;
        usn: string;
        name: string;
        email: string;
        phone: string;
        semester: number;
        department: string;
        section: string;
    };
    course: {
        id: string;
        name: string;
        code: string;
    };
}

export interface AttendanceRecord {
    studentId: string;
    status: 'present' | 'absent';
}

export interface AttendanceSession {
    offeringId: string;
    classDate: string;
    periodNumber?: number;
    syllabusCovered?: string;
    hoursTaken?: number;
    attendanceData: AttendanceRecord[];
}

export interface AttendanceHistory {
    id: string;
    date: string;
    periodNumber: number;
    topic: string;
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    attendancePercentage: number;
}

export interface StudentAttendanceAnalytics {
    student: {
        id: string;
        usn: string;
        name: string;
        email: string;
        phone: string;
    };
    attendance: {
        totalClasses: number;
        presentCount: number;
        absentCount: number;
        attendancePercentage: number;
    };
}

export interface LabMarks {
    id: string;
    record_marks: number | null;
    continuous_evaluation_marks: number | null;
    lab_mse_marks: number | null;
    last_updated_at: Date;
}

export interface TheoryMarks {
    id: string;
    mse1_marks: number | null;
    mse2_marks: number | null;
    mse3_marks: number | null;
    task1_marks: number | null;
    task2_marks: number | null;
    task3_marks: number | null;
    last_updated_at: Date;
}

export interface StudentMarksData {
    id: string;
    enrollmentId: string;
    student: {
        id: string;
        usn: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
    };
    course: {
        id: string;
        code: string;
        name: string;
    };
    theoryMarks: TheoryMarks | null;
    labMarks: LabMarks | null;
    updatedAt: Date;
}

// API Functions
export class TeacherAPI {

    // Get teacher dashboard data
    static async getDashboard(): Promise<TeacherDashboardData> {
        const response = await fetch(`${API_BASE_URL}/teacher/dashboard`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to fetch dashboard data');
        }

        return result.data;
    }

    // Get teacher's courses
    static async getCourses(): Promise<CourseOffering[]> {
        const response = await fetch(`${API_BASE_URL}/teacher/courses`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch courses: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to fetch courses');
        }

        return result.data;
    }

    // Get students for a specific course offering
    static async getCourseStudents(offeringId: string): Promise<Student[]> {
        const response = await fetch(`${API_BASE_URL}/teacher/courses/${offeringId}/students`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch students: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to fetch students');
        }

        return result.data;
    }

    // Take attendance
    static async takeAttendance(attendanceData: AttendanceSession): Promise<{
        sessionId: string;
        recordsCount: number;
        presentCount: number;
        absentCount: number;
    }> {
        const response = await fetch(`${API_BASE_URL}/teacher/attendance`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(attendanceData),
        });

        if (!response.ok) {
            throw new Error(`Failed to save attendance: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to save attendance');
        }

        return result.data;
    }

    // Get attendance history for a course
    static async getAttendanceHistory(offeringId: string, limit: number = 10): Promise<AttendanceHistory[]> {
        const response = await fetch(`${API_BASE_URL}/teacher/courses/${offeringId}/attendance-history?limit=${limit}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch attendance history: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to fetch attendance history');
        }

        return result.data;
    }

    // Get student attendance analytics for a course
    static async getAttendanceAnalytics(offeringId: string): Promise<StudentAttendanceAnalytics[]> {
        const response = await fetch(`${API_BASE_URL}/teacher/courses/${offeringId}/attendance-analytics`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch attendance analytics: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to fetch attendance analytics');
        }

        return result.data;
    }

    // Get marks for students in a course
    static async getMarks(courseId?: string, studentUsn?: string): Promise<StudentMarksData[]> {
        const params = new URLSearchParams();
        if (courseId) params.append('courseId', courseId);
        if (studentUsn) params.append('studentUsn', studentUsn);

        const url = `${API_BASE_URL}/teacher/marks${params.toString() ? `?${params.toString()}` : ''}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch marks: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to fetch marks');
        }

        return result.data;
    }

    // Get course statistics (classes completed, total classes, attendance percentage)
    static async getCourseStatistics(offeringId: string): Promise<{
        totalClasses: number;
        classesCompleted: number;
        overallAttendancePercentage: number;
    }> {
        try {
            const response = await fetch(`${API_BASE_URL}/teacher/courses/${offeringId}/statistics`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch course statistics: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.status !== 'success') {
                throw new Error(result.message || 'Failed to fetch course statistics');
            }

            return result.data;
        } catch (error) {
            console.error('Error fetching course statistics:', error);
            // Fallback to existing method if new endpoint fails
            try {
                const [historyData, analyticsData] = await Promise.all([
                    this.getAttendanceHistory(offeringId, 100),
                    this.getAttendanceAnalytics(offeringId)
                ]);

                const totalClasses = historyData.length;
                const classesCompleted = historyData.length;

                const overallAttendancePercentage = analyticsData.length > 0
                    ? analyticsData.reduce((sum, student) => sum + student.attendance.attendancePercentage, 0) / analyticsData.length
                    : 0;

                return {
                    totalClasses,
                    classesCompleted,
                    overallAttendancePercentage: Math.round(overallAttendancePercentage * 10) / 10
                };
            } catch (fallbackError) {
                console.error('Error with fallback course statistics:', fallbackError);
                return {
                    totalClasses: 0,
                    classesCompleted: 0,
                    overallAttendancePercentage: 0
                };
            }
        }
    }

    // Search functionality for master search
    static async searchAllEntities(searchTerm: string): Promise<{
        courses: CourseOffering[];
        students: (Student & { courseName: string; courseCode: string })[];
    }> {
        try {
            const [coursesData, allStudentsData] = await Promise.all([
                this.getCourses(),
                this.getAllStudents()
            ]);

            const searchLower = searchTerm.toLowerCase();

            // Filter courses
            const filteredCourses = coursesData.filter(course =>
                course.course.name.toLowerCase().includes(searchLower) ||
                course.course.code.toLowerCase().includes(searchLower) ||
                course.course.department.toLowerCase().includes(searchLower) ||
                course.academicYear.toLowerCase().includes(searchLower) ||
                (course.section && course.section.name.toLowerCase().includes(searchLower))
            );

            // Filter students
            const filteredStudents = allStudentsData.filter(student =>
                student.student.name.toLowerCase().includes(searchLower) ||
                student.student.usn.toLowerCase().includes(searchLower) ||
                student.student.email.toLowerCase().includes(searchLower) ||
                student.courseName.toLowerCase().includes(searchLower) ||
                student.courseCode.toLowerCase().includes(searchLower) ||
                student.student.department.toLowerCase().includes(searchLower)
            );

            return {
                courses: filteredCourses,
                students: filteredStudents
            };
        } catch (error) {
            console.error('Error searching entities:', error);
            return {
                courses: [],
                students: []
            };
        }
    }

    // Get all students across all courses (helper method for search)
    static async getAllStudents(): Promise<(Student & { courseName: string; courseCode: string })[]> {
        try {
            const courses = await this.getCourses();

            const studentPromises = courses.map(async (course) => {
                try {
                    const students = await this.getCourseStudents(course.offeringId);
                    return students.map(student => ({
                        ...student,
                        courseName: course.course.name,
                        courseCode: course.course.code
                    }));
                } catch (err) {
                    console.error(`Error loading students for course ${course.course.code}:`, err);
                    return [];
                }
            });

            const studentsData = await Promise.all(studentPromises);
            return studentsData.flat();
        } catch (error) {
            console.error('Error getting all students:', error);
            return [];
        }
    }

    // Update student marks (teacher-specific endpoint)
    static async updateStudentMark(enrollmentId: string, field: string, value: number | null): Promise<{
        status: 'success' | 'error';
        message?: string;
    }> {
        const response = await fetch(`${API_BASE_URL}/teacher/marks/${enrollmentId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ [field]: value }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText}`);
        }

        const result = await response.json();

        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to update marks');
        }

        return result;
    }

    // Get marks for students in teacher's courses
    static async getStudentMarks(courseId?: string, studentUsn?: string): Promise<{
        status: 'success' | 'error';
        data: any[];
        message?: string;
    }> {
        const params = new URLSearchParams();
        if (courseId) params.append('courseId', courseId);
        if (studentUsn) params.append('studentUsn', studentUsn);

        const response = await fetch(`${API_BASE_URL}/teacher/marks?${params.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText}`);
        }

        const result = await response.json();

        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to fetch marks');
        }

        return result;
    }

    // Attendance Management Methods
    static async getAttendanceByDate(date: string, courseId?: string): Promise<{ status: string; data: any[] }> {
        const params = new URLSearchParams();
        params.append('date', date);
        if (courseId) params.append('courseId', courseId);

        const response = await fetch(`${API_BASE_URL}/teacher/attendance?${params.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    static async createAttendanceRecord(data: {
        studentId: string;
        date: string;
        status: 'present' | 'absent';
        courseId?: string;
    }): Promise<{ status: string; data: any }> {
        const response = await fetch(`${API_BASE_URL}/teacher/attendance`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    static async updateAttendance(attendanceId: string, status: 'present' | 'absent'): Promise<{ status: string; data: any }> {
        const response = await fetch(`${API_BASE_URL}/teacher/attendance/${attendanceId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    static async createAttendanceSession(data: {
        courseId: string;
        date: string;
        periodNumber?: number;
        syllabusCovered?: string;
    }): Promise<{ status: string; data: any; message: string }> {
        const response = await fetch(`${API_BASE_URL}/teacher/attendance/session`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    static async getStudentAttendance(courseId: string, date: string): Promise<{ status: string; data: any[] }> {
        const params = new URLSearchParams();
        params.append('courseId', courseId);
        params.append('date', date);

        const response = await fetch(`${API_BASE_URL}/teacher/attendance/students?${params.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    static async updateStudentAttendance(data: {
        studentId: string;
        courseId: string;
        date: string;
        status: 'present' | 'absent' | 'unmarked';
    }): Promise<{ status: string; data: any }> {
        const response = await fetch(`${API_BASE_URL}/teacher/attendance/student`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }
}
