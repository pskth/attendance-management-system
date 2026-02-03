// lib/teacher-api.ts
import Cookies from '../lib/cookies';

// Ensure the base URL always includes the `/api` prefix (no trailing slash)
const envUrl = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '') : '';
const API_BASE_URL = envUrl ? `${envUrl}/api` : 'http://localhost:4000/api';

// Utility function to get auth headers
function getAuthHeaders() {
    const token = typeof window !== 'undefined' ? Cookies.get('auth_token') : null;
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

type CourseStats = {
    totalClasses: number;
    classesCompleted: number;
    overallAttendancePercentage: number;
};

type CourseNameCode = { status: string; data: { name: string; code: string } };
const courseNameCodeCache = new Map<string, { data: CourseNameCode; ts: number }>();
const courseNameCodeInflight = new Map<string, Promise<CourseNameCode>>();
const COURSE_NAME_CODE_TTL_MS = 5 * 60 * 1000;

const courseStatsCache = new Map<string, { data: CourseStats; ts: number }>();
const courseStatsInflight = new Map<string, Promise<CourseStats>>();
const COURSE_STATS_TTL_MS = 5 * 60 * 1000;

const attendanceAnalyticsCache = new Map<string, { data: StudentAttendanceAnalytics[]; ts: number }>();
const attendanceAnalyticsInflight = new Map<string, Promise<StudentAttendanceAnalytics[]>>();
const ATTENDANCE_ANALYTICS_TTL_MS = 2 * 60 * 1000;

const courseComponentsCache = new Map<string, { data: any; ts: number }>();
const courseComponentsInflight = new Map<string, Promise<any>>();
const COURSE_COMPONENTS_TTL_MS = 5 * 60 * 1000;

const courseStudentMarksCache = new Map<string, { data: CourseStudentMarksResponse; ts: number }>();
const courseStudentMarksInflight = new Map<string, Promise<CourseStudentMarksResponse>>();
const COURSE_STUDENT_MARKS_TTL_MS = 2 * 60 * 1000;

export interface TeacherDashboardData {
    teacher: TeacherProfile;
    statistics: TeacherStatistics;
    recentSessions: RecentSession[];
    teacherDashboardId: string; // New line to replace user id with teacher dashboard id
}

export interface CourseOffering {
    offeringId: string;
    teacherId?: string; // Add teacherId to the interface
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
    semester: number;
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
export interface StudentTestMark {
    testId: string;
    testName: string;
    type: 'theory' | 'lab';
    maxMarks: number;
    weightage: number;
    marksObtained: number | null;
}

export interface TestComponent {
    id: string;
    courseOfferingId: string;
    name: string;
    maxMarks: number;
    weightage: number;
    type: 'theory' | 'lab';
}

export interface StudentMarks {
    enrollmentId: string;
    student: {
        id: string;
        name: string;
        usn: string;
        email?: string;
    };
    theoryMarks: StudentTestMark[];
    labMarks: StudentTestMark[];
}

// Single mark entry (one component like MSE, Project, Lab, etc.)
export type StudentMarkComponent = {
    componentId: string
    componentName: string
    type: "theory" | "lab" | string   // restrict if you know all possible types
    obtainedMarks: number
    maxMarks: number
    weightage: number
}

// A student with marks across multiple components
export type StudentWithMarks = {
    studentId: string
    usn: string
    studentName: string
    studentEmail: string
    marks: StudentMarkComponent[]
}

// Full API response
export type CourseStudentMarksResponse = {
    status: string
    offeringId: string
    courseId: string
    teacherId: string
    students: StudentWithMarks[]
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

    //get course name and code

    static async getCourseNameAndCode(courseId: string): Promise<{ status: string; data: { name: string; code: string }; }> {
        const cached = courseNameCodeCache.get(courseId);
        if (cached && Date.now() - cached.ts < COURSE_NAME_CODE_TTL_MS) {
            return cached.data;
        }

        const inflight = courseNameCodeInflight.get(courseId);
        if (inflight) {
            return inflight;
        }

        const requestPromise = (async () => {
            const response = await fetch(`${API_BASE_URL}/teacher/coursecnc/${courseId}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch course name and code: ${response.statusText}`);
            }
            const result = await response.json();
            if (result.status !== 'success') {
                throw new Error(result.message || 'Failed to fetch course name and code');
            }
            const data = result as CourseNameCode;
            courseNameCodeCache.set(courseId, { data, ts: Date.now() });
            return data;
        })().finally(() => {
            courseNameCodeInflight.delete(courseId);
        });

        courseNameCodeInflight.set(courseId, requestPromise);
        return requestPromise;
    }


    // Get teacher dashboard data
    static async getDashboard(): Promise<TeacherDashboardData> {
        const response = await fetch(`${API_BASE_URL}/teacher/dashboard`, {
            method: 'GET',
            headers: getAuthHeaders(),
            credentials: 'include',
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
            credentials: 'include',
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
            credentials: 'include',
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
            credentials: 'include',
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
            credentials: 'include',
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
        const cached = attendanceAnalyticsCache.get(offeringId);
        if (cached && Date.now() - cached.ts < ATTENDANCE_ANALYTICS_TTL_MS) {
            return cached.data;
        }

        const inflight = attendanceAnalyticsInflight.get(offeringId);
        if (inflight) {
            return inflight;
        }

        const requestPromise = (async () => {
            const response = await fetch(`${API_BASE_URL}/teacher/courses/${offeringId}/attendance-analytics`, {
                method: 'GET',
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch attendance analytics: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.status !== 'success') {
                throw new Error(result.message || 'Failed to fetch attendance analytics');
            }

            const data = result.data as StudentAttendanceAnalytics[];
            attendanceAnalyticsCache.set(offeringId, { data, ts: Date.now() });
            return data;
        })().finally(() => {
            attendanceAnalyticsInflight.delete(offeringId);
        });

        attendanceAnalyticsInflight.set(offeringId, requestPromise);
        return requestPromise;
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
            credentials: 'include',
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
        const cached = courseStatsCache.get(offeringId);
        if (cached && Date.now() - cached.ts < COURSE_STATS_TTL_MS) {
            return cached.data;
        }

        const inflight = courseStatsInflight.get(offeringId);
        if (inflight) {
            return inflight;
        }

        const requestPromise = (async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/teacher/courses/${offeringId}/statistics`, {
                    method: 'GET',
                    headers: getAuthHeaders(),
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch course statistics: ${response.statusText}`);
                }

                const result = await response.json();

                if (result.status !== 'success') {
                    throw new Error(result.message || 'Failed to fetch course statistics');
                }
                const data = result.data as CourseStats;
                courseStatsCache.set(offeringId, { data, ts: Date.now() });
                return data;
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
            } finally {
                courseStatsInflight.delete(offeringId);
            }
        })();

        courseStatsInflight.set(offeringId, requestPromise);
        return requestPromise;
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
    // static async updateStudentMark(enrollmentId: string, field: string, value: number | null): Promise<{
    //     status: 'success' | 'error';
    //     message?: string;
    // }> {
    //     const response = await fetch(`${API_BASE_URL}/teacher/marks/${enrollmentId}`, {
    //         method: 'PUT',
    //         headers: getAuthHeaders(),
    //         body: JSON.stringify({ [field]: value }),
    //     });

    //     if (!response.ok) {
    //         const errorText = await response.text();
    //         throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText}`);
    //     }

    //     const result = await response.json();

    //     if (result.status !== 'success') {
    //         throw new Error(result.message || 'Failed to update marks');
    //     }

    //     return result;
    // }

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
            credentials: 'include',
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
            headers: getAuthHeaders(),
            credentials: 'include'
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
            credentials: 'include',
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
            credentials: 'include',
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

        console.log('Fetching attendance for:', { courseId, date, fullUrl: `${API_BASE_URL}/teacher/attendance/students?${params.toString()}` });

        const response = await fetch(`${API_BASE_URL}/teacher/attendance/students?${params.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders(),
            credentials: 'include'
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
    // Get test components for a course
    static async getCourseTestComponents(courseId: string, teacherId: string) {
        const key = `${courseId}:${teacherId}`;
        const cached = courseComponentsCache.get(key);
        if (cached && Date.now() - cached.ts < COURSE_COMPONENTS_TTL_MS) {
            return cached.data;
        }

        const inflight = courseComponentsInflight.get(key);
        if (inflight) {
            return inflight;
        }

        const requestPromise = (async () => {
            const response = await fetch(`${API_BASE_URL}/teacher/course/${courseId}/teacher/${teacherId}/components`, {
                method: 'GET',
                headers: getAuthHeaders(),
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.status !== 'success') {
                throw new Error(result.error || 'Failed to fetch test components');
            }

            courseComponentsCache.set(key, { data: result, ts: Date.now() });
            return result;
        })().finally(() => {
            courseComponentsInflight.delete(key);
        });

        courseComponentsInflight.set(key, requestPromise);
        return requestPromise;
    }
    //upadte component details
    // API.ts (or wherever you keep your API methods)
    static async saveComponents(
        courseId: string,
        teacherId: string,
        components: Array<{
            id?: string;
            name: string;
            maxMarks: number;
            weightage: number;
            type: string;
        }>
    ): Promise<any> {
        console.log('saveComponents API call:', {
            url: `${API_BASE_URL}/teacher/course/${courseId}/teacher/${teacherId}/components`,
            courseId,
            teacherId,
            components
        });

        const response = await fetch(`${API_BASE_URL}/teacher/course/${courseId}/teacher/${teacherId}/components`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ components }),
        });

        console.log('saveComponents response status:', response.status);
        console.log('saveComponents response ok:', response.ok);

        if (!response.ok) {
            let details = '';
            try {
                const errJson = await response.json();
                console.error('Error response body:', errJson);
                details = errJson?.error || errJson?.message || '';
            } catch { }
            throw new Error(`Failed to save components: ${response.status} ${response.statusText}${details ? ` - ${details}` : ''}`);
        }

        const result = await response.json();
        console.log('saveComponents result:', result);

        if (result.status !== 'success') {
            throw new Error(result.error || result.message || 'Failed to save components');
        }

        return result;
    }
    //to update student marks for a specific test component
    // static async saveStudentMarks(
    //   courseId: string,
    //   teacherId: string,
    //   students: Array<{
    //     studentId: string;
    //     marks: Array<{
    //       componentId: string;
    //       marksObtained: number;
    //     }>;
    //   }>
    // ): Promise<any> {
    //   const response = await fetch(`${API_BASE_URL}/teacher/course/${courseId}/teacher/${teacherId}/marks`, {
    //     method: 'POST',
    //     headers: {
    //       ...getAuthHeaders(),
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({ students }),
    //   });

    //   if (!response.ok) {
    //     throw new Error(`Failed to save student marks: ${response.statusText}`);
    //   }

    //   const result = await response.json();

    //   if (result.status !== 'success') {
    //     throw new Error(result.error || 'Failed to save student marks');
    //   }

    //   return result.students; // return updated students
    // }
    static async saveStudentMarks(
        courseId: string,
        teacherId: string,
        students: Array<{
            studentId: string;
            marks: Array<{
                componentId: string;
                marksObtained: number;
            }>;
        }>
    ): Promise<any> {
        const response = await fetch(
            `${API_BASE_URL}/teacher/course/${courseId}/teacher/${teacherId}/marks`,
            {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ students }),
            }
        );

        // Try to read informative error from body when available
        if (!response.ok) {
            let details = '';
            try {
                const errJson = await response.json();
                details = errJson?.error || errJson?.message || '';
            } catch { }
            throw new Error(`Failed to save student marks: ${response.status} ${response.statusText}${details ? ` - ${details}` : ''}`);
        }

        const result = await response.json();

        if (result.status !== 'success') {
            throw new Error(result.error || result.message || 'Failed to save student marks');
        }

        return result.updatedStudents; // ✅ backend sends updatedStudents
    }

    // Get student marks for a specific course taught by that teacher
    // static async getCourseStudentMarks(courseId: string, teacherId: string): Promise<CourseStudentMarksResponse> {
    //   const response = await fetch(`${API_BASE_URL}/teacher/course/${courseId}/teacher/${teacherId}/marks`, {
    //     method: 'GET',
    //     headers: getAuthHeaders(),
    //   });

    //   if (!response.ok) {
    //     const errorData = await response.json().catch(() => ({}));
    //     throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    //   }

    //   const result = await response.json();
    //   if (result.status !== 'success') {
    //     throw new Error(result.error || 'Failed to fetch student marks');
    //   }

    //   // Transform raw data into separated theory/lab marks
    //   return result.data.map((enrollment: CourseStudentMarksResponse) => {
    //     const theoryMarks: StudentTestMark[] = [];
    //     const labMarks: StudentTestMark[] = [];

    //     enrollment.students.forEach((mark: StudentWithMarks) => {
    //       const testMark: StudentTestMark = {
    //         testId: mark.studentId,
    //         testName: mark.marks,
    //         type: mark.testComponent.type,
    //         maxMarks: mark.testComponent.maxMarks,
    //         weightage: mark.testComponent.weightage,
    //         marksObtained: mark.marksObtained
    //       };
    //       if (mark.testComponent.type === 'theory') theoryMarks.push(testMark);
    //       else labMarks.push(testMark);
    //     });

    //     return {
    //       enrollmentId: enrollment.id,
    //       student: {
    //         id: enrollment.student.id,
    //         name: enrollment.student.user.name,
    //         usn: enrollment.student.usn,
    //         email: enrollment.student.user.email
    //       },
    //       theoryMarks,
    //       labMarks
    //     };
    //   });
    // }

    static async getCourseStudentMarks(courseId: string, teacherId: string): Promise<CourseStudentMarksResponse> {
        const key = `${courseId}:${teacherId}`;
        const cached = courseStudentMarksCache.get(key);
        if (cached && Date.now() - cached.ts < COURSE_STUDENT_MARKS_TTL_MS) {
            return cached.data;
        }

        const inflight = courseStudentMarksInflight.get(key);
        if (inflight) {
            return inflight;
        }

        const requestPromise = (async () => {
            const response = await fetch(`${API_BASE_URL}/teacher/course/${courseId}/teacher/${teacherId}/marks`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.status !== 'success') {
                throw new Error(result.error || 'Failed to fetch student marks');
            }

            // Map API response to our typed structure
            const students: StudentWithMarks[] = result.students.map((s: any) => ({
                studentId: s.studentId,
                usn: s.usn,
                studentName: s.studentName,
                studentEmail: s.studentEmail,
                marks: s.marks.map((m: any): StudentMarkComponent => ({
                    componentId: m.componentId,
                    componentName: m.componentName,
                    type: m.type,
                    obtainedMarks: m.obtainedMarks ?? null,
                    maxMarks: m.maxMarks,
                    weightage: m.weightage
                }))
            }));

            const data = {
                status: result.status,
                offeringId: result.offeringId,
                courseId: result.courseId,
                teacherId: result.teacherId,
                students
            } as CourseStudentMarksResponse;

            courseStudentMarksCache.set(key, { data, ts: Date.now() });
            return data;
        })().finally(() => {
            courseStudentMarksInflight.delete(key);
        });

        courseStudentMarksInflight.set(key, requestPromise);
        return requestPromise;
    }


    //to update student marks for a specific test component
    static async updateStudentMark(studentMarkId: string, marksObtained: number | null) {
        const response = await fetch(`${API_BASE_URL}/teacher/marks/${studentMarkId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ marksObtained }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText}`);
        }

        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message || 'Failed to update marks');

        return result;
    }

    // ========== NEW MARKS SCHEMA API FUNCTIONS ==========

    /**
     * Fetch student marks for a course using the new schema
     * Returns marks grouped by student with dynamic test components
     */
    static async getStudentMarksNewSchema(courseId?: string, studentUsn?: string): Promise<StudentMarks[]> {
        const params = new URLSearchParams();
        if (courseId) params.append('courseId', courseId);
        if (studentUsn) params.append('studentUsn', studentUsn);

        const response = await fetch(`${API_BASE_URL}/teacher/marks?${params.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch marks: ${response.status} ${response.statusText}. ${errorText}`);
        }

        const result = await response.json();
        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to fetch marks');
        }

        return result.data;
    }

    /**
     * Update marks for a student enrollment using the new schema
     * @param enrollmentId - The enrollment ID
     * @param marks - Array of marks to update: [{ testComponentId, marksObtained }]
     */
    static async updateEnrollmentMarks(
        enrollmentId: string,
        marks: { testComponentId: string; marksObtained: number }[]
    ): Promise<{ status: string; message: string }> {
        const response = await fetch(`${API_BASE_URL}/teacher/marks/${enrollmentId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ marks }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update marks: ${response.status} ${response.statusText}. ${errorText}`);
        }

        const result = await response.json();
        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to update marks');
        }

        return result;
    }

    /**
     * Get test components for a course offering
     * @param offeringId - The course offering ID
     */
    static async getTestComponents(offeringId: string): Promise<TestComponent[]> {
        const response = await fetch(`${API_BASE_URL}/admin/offerings/${offeringId}/components`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch test components: ${response.status} ${response.statusText}. ${errorText}`);
        }

        const result = await response.json();
        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to fetch test components');
        }

        return result.components;
    }

}
