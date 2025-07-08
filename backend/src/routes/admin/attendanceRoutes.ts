// src/routes/admin/attendanceRoutes.ts
import { Router } from 'express';
import DatabaseService from '../../lib/database';

const router = Router();

console.log('=== ADMIN ATTENDANCE ROUTES LOADED ===');

// Get attendance for a specific date
router.get('/attendance', async (req, res) => {
  try {
    console.log('=== ATTENDANCE ENDPOINT HIT ===');
    const { date, courseId, departmentId } = req.query;

    if (!date || typeof date !== 'string') {
      res.status(400).json({
        status: 'error',
        error: 'Date parameter is required'
      });
      return;
    }

    const prisma = DatabaseService.getInstance();
    const targetDate = new Date(date);

    console.log('Query date:', date);

    // First, get all students who should have attendance for this date
    // We'll get all students from active courses/offerings
    const students = await prisma.student.findMany({
      include: {
        user: true,
        sections: true,
        departments: true,
        enrollments: {
          include: {
            offering: {
              include: {
                course: true
              }
            }
          }
        }
      },
      orderBy: {
        usn: 'asc'
      }
    });

    console.log(`Found ${students.length} total students`);

    // Get existing attendance records for this date
    const existingAttendance = await prisma.attendanceRecord.findMany({
      where: {
        attendance: {
          classDate: targetDate
        }
      },
      include: {
        student: true,
        attendance: {
          include: {
            offering: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });

    console.log(`Found ${existingAttendance.length} existing attendance records for date ${date}`);

    // Create a map of existing attendance by student ID
    const attendanceMap = new Map();
    existingAttendance.forEach(record => {
      attendanceMap.set(record.studentId, record);
    });

    // Transform the data for frontend - show all students with their attendance status
    const transformedData = students.map(student => {
      const attendanceRecord = attendanceMap.get(student.id);
      
      // If student has attendance record, use it; otherwise show as "not marked"
      if (attendanceRecord) {
        return {
          id: attendanceRecord.id,
          date: attendanceRecord.attendance?.classDate?.toISOString().split('T')[0] || date,
          studentId: student.id,
          usn: student.usn,
          student_name: student.user?.name || '',
          status: attendanceRecord.status,
          courseId: attendanceRecord.attendance?.offering?.course?.id,
          courseName: attendanceRecord.attendance?.offering?.course?.name,
          courseCode: attendanceRecord.attendance?.offering?.course?.code,
          periodNumber: attendanceRecord.attendance?.periodNumber,
          sectionName: student.sections?.section_name || 'Section A'
        };
      } else {
        // Student doesn't have attendance record yet - show as "not marked"
        const primaryEnrollment = student.enrollments[0]; // Use first enrollment as default
        return {
          id: `pending-${student.id}`,
          date: date,
          studentId: student.id,
          usn: student.usn,
          student_name: student.user?.name || '',
          status: 'not_marked',
          courseId: primaryEnrollment?.offering?.course?.id || null,
          courseName: primaryEnrollment?.offering?.course?.name || 'No Course',
          courseCode: primaryEnrollment?.offering?.course?.code || 'N/A',
          periodNumber: 1,
          sectionName: student.sections?.section_name || 'Section A'
        };
      }
    });

    res.json({
      status: 'success',
      data: transformedData,
      count: transformedData.length
    });

  } catch (error) {
    console.error('Error fetching attendance data:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update attendance status for a specific record
router.put('/attendance/:attendanceId', async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status } = req.body;

    if (!status || !['present', 'absent'].includes(status)) {
      res.status(400).json({
        status: 'error',
        error: 'Valid status (present/absent) is required'
      });
      return;
    }

    const prisma = DatabaseService.getInstance();

    const updatedRecord = await prisma.attendanceRecord.update({
      where: { id: attendanceId },
      data: { status },
      include: {
        student: {
          include: {
            user: true
          }
        },
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
    });

  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
