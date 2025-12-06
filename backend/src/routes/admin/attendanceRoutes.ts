// src/routes/admin/attendanceRoutes.ts
/**
 * Attendance management routes for admins and teachers
 * Handles CRUD operations for attendance records and course assignments
 */
import { Router } from 'express';
import DatabaseService from '../../lib/database';
import { AuthenticatedRequest } from '../../middleware/auth';
import { GetAttendanceParams, CreateAttendanceRequest, UpdateAttendanceRequest } from '../../types/attendance.types';
import { ApiResponse } from '../../types/common.types';
import {
  getAccessibleCourseIds,
  buildCourseFilter,
  transformToAttendanceRecord,
  findCourseOfferingForAttendance,
  findOrCreateAttendanceSession,
  isValidAttendanceStatus
} from '../../utils/attendance.helpers';

const router = Router();

console.log('=== ADMIN ATTENDANCE ROUTES LOADED ===');

/**
 * GET /assigned-courses
 * Returns list of courses assigned to the current user
 * - Admin users see all courses
 * - Teacher users see only their assigned courses
 */
/**
 * GET /assigned-courses
 * Returns list of courses assigned to the current user
 * - Admin users see all courses
 * - Teacher users see only their assigned courses
 */
router.get('/assigned-courses', async (req: AuthenticatedRequest, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    const userId = req.user?.id;
    const userRoles = req.user?.roles || [];

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        error: 'User authentication required'
      } as ApiResponse);
    }

    // Get courses based on user role
    let courses: any[] = [];

    if (userRoles.includes('admin')) {
      // Admin sees all courses
      courses = await prisma.course.findMany({
        include: {
          department: true,
          courseOfferings: {
            include: {
              sections: true,
              academic_years: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });
    } else if (userRoles.includes('teacher')) {
      // Teacher sees only assigned courses
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
        include: {
          courseOfferings: {
            include: {
              course: { include: { department: true } },
              sections: true,
              academic_years: true
            }
          }
        }
      });

      if (teacher) {
        // Extract unique courses from course offerings
        const courseMap = new Map();
        teacher.courseOfferings.forEach((offering: any) => {
          const course = offering.course;
          if (!courseMap.has(course.id)) {
            courseMap.set(course.id, course);
          }
        });
        courses = Array.from(courseMap.values());
      }
    }

    // Format courses for response
    const formattedCourses = courses.map((course: any) => ({
      id: course.id,
      code: course.code,
      name: course.name,
      type: course.type,
      department: course.department?.name
    }));

    return res.json({
      status: 'success',
      data: formattedCourses
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching assigned courses:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /attendance
 * Retrieves attendance records for a specific date
 * Query parameters:
 * - date: Required - Date in ISO format (YYYY-MM-DD)
 * - courseId: Optional - Filter by specific course
 * - departmentId: Optional - Filter by department (not fully implemented)
 */
router.get('/attendance', async (req: AuthenticatedRequest, res) => {
  try {
    console.log('=== ATTENDANCE ENDPOINT HIT ===');

    const { date, courseId, departmentId } = req.query as Partial<GetAttendanceParams>;
    const userId = req.user?.id;
    const userRoles = req.user?.roles || [];

    // Validate required parameters
    if (!date || typeof date !== 'string') {
      return res.status(400).json({
        status: 'error',
        error: 'Date parameter is required'
      } as ApiResponse);
    }

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        error: 'User authentication required'
      } as ApiResponse);
    }

    const prisma = DatabaseService.getInstance();
    const targetDate = new Date(date);

    console.log('Query date:', date);
    console.log('User roles:', userRoles);

    // Get courses that the user is allowed to view
    const allowedCourseIds = await getAccessibleCourseIds(prisma, userId, userRoles);
    console.log('Allowed course IDs:', allowedCourseIds);

    // Build course filter
    const courseFilter = buildCourseFilter(allowedCourseIds, courseId as string | undefined);

    // Check if user has no access
    if (courseFilter.id === 'no-access') {
      return res.json({
        status: 'success',
        data: [],
        count: 0,
        message: 'No courses accessible'
      } as ApiResponse);
    }

    // Get all students who should have attendance for this date
    const students = await prisma.student.findMany({
      include: {
        user: true,
        sections: true,
        departments: true,
        enrollments: {
          include: {
            offering: { include: { course: true } }
          },
          where: {
            offering: { course: courseFilter }
          }
        }
      },
      where: {
        enrollments: {
          some: {
            offering: { course: courseFilter }
          }
        }
      },
      orderBy: { usn: 'asc' }
    });

    console.log(`Found ${students.length} total students`);

    // Get existing attendance records for this date
    const existingAttendance = await prisma.attendanceRecord.findMany({
      where: {
        attendance: {
          classDate: targetDate,
          offering: { course: courseFilter }
        }
      },
      include: {
        student: true,
        attendance: {
          include: {
            offering: { include: { course: true } }
          }
        }
      }
    });

    console.log(`Found ${existingAttendance.length} existing attendance records for date ${date}`);

    // Create a map of existing attendance by student ID
    const attendanceMap = new Map();
    existingAttendance.forEach((record: any) => {
      attendanceMap.set(record.studentId, record);
    });

    // Transform the data for frontend
    const transformedData = students.map((student: any) =>
      transformToAttendanceRecord(student, attendanceMap, date)
    );

    res.json({
      status: 'success',
      data: transformedData,
      count: transformedData.length
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching attendance data:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * PUT /attendance/:attendanceId
 * Updates the status of an existing attendance record
 * Body: { status: 'present' | 'absent' }
 */
router.put('/attendance/:attendanceId', async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status } = req.body as UpdateAttendanceRequest;

    // Validate status
    if (!status || !isValidAttendanceStatus(status)) {
      return res.status(400).json({
        status: 'error',
        error: 'Valid status (present/absent) is required'
      } as ApiResponse);
    }

    const prisma = DatabaseService.getInstance();

    // Update the attendance record
    const updatedRecord = await prisma.attendanceRecord.update({
      where: { id: attendanceId },
      data: { status },
      include: {
        student: { include: { user: true } },
        attendance: true
      }
    });

    res.json({
      status: 'success',
      data: {
        id: updatedRecord.id,
        date: updatedRecord.attendance?.classDate?.toISOString().split('T')[0] || '',
        studentId: updatedRecord.studentId,
        usn: updatedRecord.student?.usn || '',
        student_name: updatedRecord.student?.user?.name || '',
        status: updatedRecord.status
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * POST /attendance
 * Creates or updates an attendance record for a student
 * Body: { studentId, date, status, courseId? }
 */
router.post('/attendance', async (req, res) => {
  try {
    const { studentId, date, status, courseId } = req.body as CreateAttendanceRequest;

    // Validate required fields
    if (!studentId || !date || !status) {
      return res.status(400).json({
        status: 'error',
        error: 'studentId, date, and status are required'
      } as ApiResponse);
    }

    // Validate status
    if (!isValidAttendanceStatus(status)) {
      return res.status(400).json({
        status: 'error',
        error: 'Status must be either present or absent'
      } as ApiResponse);
    }

    const prisma = DatabaseService.getInstance();
    const targetDate = new Date(date);

    // Find a suitable course offering for this student
    const courseOfferingId = await findCourseOfferingForAttendance(prisma, courseId, studentId);

    if (!courseOfferingId) {
      return res.status(400).json({
        status: 'error',
        error: 'No suitable course offering found for this student'
      } as ApiResponse);
    }

    // Find or create attendance session
    const attendanceId = await findOrCreateAttendanceSession(prisma, targetDate, courseOfferingId);

    // Check if student already has an attendance record for this session
    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: {
        studentId: studentId,
        attendanceId: attendanceId
      }
    });

    let recordData;

    if (existingRecord) {
      // Update existing record
      const updatedRecord = await prisma.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: { status },
        include: {
          student: { include: { user: true } },
          attendance: { include: { offering: { include: { course: true } } } }
        }
      });

      recordData = {
        id: updatedRecord.id,
        date: updatedRecord.attendance?.classDate?.toISOString().split('T')[0] || date,
        studentId: updatedRecord.studentId,
        usn: updatedRecord.student?.usn || '',
        student_name: updatedRecord.student?.user?.name || '',
        status: updatedRecord.status,
        courseId: updatedRecord.attendance?.offering?.course?.id,
        courseName: updatedRecord.attendance?.offering?.course?.name
      };
    } else {
      // Create new record
      const newRecord = await prisma.attendanceRecord.create({
        data: {
          studentId: studentId,
          attendanceId: attendanceId,
          status: status
        },
        include: {
          student: { include: { user: true } },
          attendance: { include: { offering: { include: { course: true } } } }
        }
      });

      recordData = {
        id: newRecord.id,
        date: newRecord.attendance?.classDate?.toISOString().split('T')[0] || date,
        studentId: newRecord.studentId,
        usn: newRecord.student?.usn || '',
        student_name: newRecord.student?.user?.name || '',
        status: newRecord.status,
        courseId: newRecord.attendance?.offering?.course?.id,
        courseName: newRecord.attendance?.offering?.course?.name
      };
    }

    res.json({
      status: 'success',
      data: recordData
    } as ApiResponse);

  } catch (error) {
    console.error('Error creating/updating attendance record:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});



export default router;
