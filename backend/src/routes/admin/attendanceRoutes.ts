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

// Create attendance record for a specific student
router.post('/attendance', async (req, res) => {
  try {
    const { studentId, date, status, courseId } = req.body;

    if (!studentId || !date || !status) {
      res.status(400).json({
        status: 'error',
        error: 'studentId, date, and status are required'
      });
      return;
    }

    if (!['present', 'absent'].includes(status)) {
      res.status(400).json({
        status: 'error',
        error: 'Status must be either present or absent'
      });
      return;
    }

    const prisma = DatabaseService.getInstance();
    const targetDate = new Date(date);

    // Find a suitable course offering for this student and date
    let courseOfferingId = null;
    
    if (courseId) {
      // Try to find a specific course offering for the given course
      const courseOffering = await prisma.courseOffering.findFirst({
        where: {
          courseId: courseId
        }
      });
      courseOfferingId = courseOffering?.id;
    }
    
    if (!courseOfferingId) {
      // Fall back to any course offering the student is enrolled in
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          enrollments: {
            include: {
              offering: true
            },
            take: 1
          }
        }
      });
      
      if (student?.enrollments?.[0]?.offering) {
        courseOfferingId = student.enrollments[0].offering.id;
      }
    }

    if (!courseOfferingId) {
      res.status(400).json({
        status: 'error',
        error: 'No suitable course offering found for this student'
      });
      return;
    }

    // Check if attendance record already exists for this date and offering
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        classDate: targetDate,
        offeringId: courseOfferingId
      }
    });

    let attendanceId;
    if (existingAttendance) {
      attendanceId = existingAttendance.id;
    } else {
      // Create new attendance session
      const newAttendance = await prisma.attendance.create({
        data: {
          classDate: targetDate,
          offeringId: courseOfferingId,
          periodNumber: 1
        }
      });
      attendanceId = newAttendance.id;
    }

    // Check if student already has an attendance record for this session
    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: {
        studentId: studentId,
        attendanceId: attendanceId
      }
    });

    if (existingRecord) {
      // Update existing record
      const updatedRecord = await prisma.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: { status },
        include: {
          student: {
            include: {
              user: true
            }
          },
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

      res.json({
        status: 'success',
        data: {
          id: updatedRecord.id,
          date: updatedRecord.attendance?.classDate?.toISOString().split('T')[0] || date,
          studentId: updatedRecord.studentId,
          usn: updatedRecord.student?.usn || '',
          student_name: updatedRecord.student?.user?.name || '',
          status: updatedRecord.status,
          courseId: updatedRecord.attendance?.offering?.course?.id,
          courseName: updatedRecord.attendance?.offering?.course?.name
        }
      });
    } else {
      // Create new record
      const newRecord = await prisma.attendanceRecord.create({
        data: {
          studentId: studentId,
          attendanceId: attendanceId,
          status: status
        },
        include: {
          student: {
            include: {
              user: true
            }
          },
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

      res.json({
        status: 'success',
        data: {
          id: newRecord.id,
          date: newRecord.attendance?.classDate?.toISOString().split('T')[0] || date,
          studentId: newRecord.studentId,
          usn: newRecord.student?.usn || '',
          student_name: newRecord.student?.user?.name || '',
          status: newRecord.status,
          courseId: newRecord.attendance?.offering?.course?.id,
          courseName: newRecord.attendance?.offering?.course?.name
        }
      });
    }

  } catch (error) {
    console.error('Error creating/updating attendance record:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});



export default router;
