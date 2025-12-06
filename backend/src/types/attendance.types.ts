/**
 * Type definitions for attendance-related operations
 */

/**
 * Status of an attendance record
 */
export type AttendanceStatus = 'present' | 'absent' | 'not_marked';

/**
 * Status of an attendance session
 */
export type AttendanceSessionStatus = 'held' | 'confirmed' | 'cancelled';

/**
 * Represents a student's attendance record
 */
export interface AttendanceRecordData {
    id: string;
    date: string;
    studentId: string;
    usn: string;
    student_name: string;
    status: AttendanceStatus;
    courseId?: string | null;
    courseName?: string;
    courseCode?: string;
    periodNumber?: number;
    sectionName?: string;
}

/**
 * Request parameters for fetching attendance
 */
export interface GetAttendanceParams {
    date: string;
    courseId?: string;
    departmentId?: string;
}

/**
 * Request body for creating attendance record
 */
export interface CreateAttendanceRequest {
    studentId: string;
    date: string;
    status: AttendanceStatus;
    courseId?: string;
}

/**
 * Request body for updating attendance status
 */
export interface UpdateAttendanceRequest {
    status: AttendanceStatus;
}

/**
 * Course information for attendance filtering
 */
export interface CourseInfo {
    id: string;
    code: string;
    name: string;
    type: string;
    department?: string;
}

/**
 * Prisma enrollment object with all includes
 */
export interface EnrollmentWithDetails {
    id: string;
    studentId: string | null;
    offeringId: string;
    student: {
        id: string;
        usn: string | null;
        user: {
            name: string;
        } | null;
        sections: {
            section_name: string;
        } | null;
    } | null;
    enrollments: Array<{
        offering: {
            course: {
                id: string;
                name: string;
                code: string;
            };
        };
    }>;
}
