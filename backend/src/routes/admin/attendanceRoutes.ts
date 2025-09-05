// src/routes/admin/attendanceRoutes.ts
import { Router } from 'express';
import DatabaseService from '../../lib/database';
import { AuthenticatedRequest } from '../../middleware/auth';

const router = Router();

console.log('=== ADMIN ATTENDANCE ROUTES LOADED ===');

// Get courses assigned to the current user (for filtering attendance management)
router.get('/assigned-courses', async (req: AuthenticatedRequest, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        error: 'User authentication required'
      });
    }

    // Check user roles
    const userRoles = req.user?.roles || [];
    
    // If user is admin, return all courses
    if (userRoles.includes('admin')) {
      const allCourses = await prisma.course.findMany({
        include: {
          department: true,
          courseOfferings: {
            include: {
              sections: true,
              academic_years: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      const formattedCourses = allCourses.map(course => ({
        id: course.id,
        code: course.code,
        name: course.name,
        type: course.type,
        department: course.department?.name,
        hasTheoryComponent: course.hasTheoryComponent,
        hasLabComponent: course.hasLabComponent
      }));

      return res.json({
        status: 'success',
        data: formattedCourses
      });
    }

    // If user is teacher, return only courses they're assigned to
    if (userRoles.includes('teacher')) {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: userId },
        include: {
          courseOfferings: {
            include: {
              course: {
                include: {
                  department: true
                }
              },
              sections: true,
              academic_years: true
            }
          }
        }
      });

      if (!teacher) {
        return res.json({
          status: 'success',
          data: []
        });
      }

      // Get unique courses from course offerings
      const assignedCourses = teacher.courseOfferings.reduce((acc, offering) => {
        const course = offering.course;
        if (!acc.find(c => c.id === course.id)) {
          acc.push({
            id: course.id,
            code: course.code,
            name: course.name,
            type: course.type,
            department: course.department?.name,
            hasTheoryComponent: course.hasTheoryComponent,
            hasLabComponent: course.hasLabComponent
          });
        }
        return acc;
      }, [] as any[]);

      return res.json({
        status: 'success',
        data: assignedCourses
      });
    }

    // For other roles, return empty list
    return res.json({
      status: 'success',
      data: []
    });

  } catch (error) {
    console.error('Error fetching assigned courses:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get attendance for a specific date
router.get('/attendance', async (req: AuthenticatedRequest, res) => {
  try {
    console.log('=== ATTENDANCE ENDPOINT HIT ===');
    const { date, courseId, departmentId } = req.query;
    const userId = req.user?.id;
    const userRoles = req.user?.roles || [];

    if (!date || typeof date !== 'string') {
      res.status(400).json({
        status: 'error',
        error: 'Date parameter is required'
      });
      return;
    }

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        error: 'User authentication required'
      });
    }

    const prisma = DatabaseService.getInstance();
    const targetDate = new Date(date);

    console.log('Query date:', date);
    console.log('User roles:', userRoles);

    // Get courses that the user is allowed to view
    let allowedCourseIds: string[] = [];
    
    if (userRoles.includes('admin')) {
      // Admin can see all courses
      const allCourses = await prisma.course.findMany({
        select: { id: true }
      });
      allowedCourseIds = allCourses.map(c => c.id);
    } else if (userRoles.includes('teacher')) {
      // Teacher can only see courses they're assigned to
      const teacher = await prisma.teacher.findUnique({
        where: { userId: userId },
        include: {
          courseOfferings: {
            include: {
              course: true
            }
          }
        }
      });
      
      if (teacher) {
        allowedCourseIds = [...new Set(teacher.courseOfferings.map(offering => offering.course.id))];
      }
    }

    console.log('Allowed course IDs:', allowedCourseIds);

    // Apply course filter if specified and user is allowed to view it
    let courseFilter: any = {};
    if (courseId && typeof courseId === 'string') {
      if (allowedCourseIds.includes(courseId)) {
        courseFilter = { id: courseId };
      } else {
        // User is not allowed to view this course
        return res.json({
          status: 'success',
          data: [],
          count: 0,
          message: 'Access denied to this course'
        });
      }
    } else {
      // Filter to only allowed courses
      if (allowedCourseIds.length > 0) {
        courseFilter = { id: { in: allowedCourseIds } };
      } else {
        // User has no course access
        return res.json({
          status: 'success',
          data: [],
          count: 0
        });
      }
    }

    // First, get all students who should have attendance for this date
    // We'll get all students from active courses/offerings that the user can access
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
          },
          where: {
            offering: {
              course: courseFilter
            }
          }
        }
      },
      where: {
        enrollments: {
          some: {
            offering: {
              course: courseFilter
            }
          }
        }
      },
      orderBy: {
        usn: 'asc'
      }
    });

    console.log(`Found ${students.length} total students`);

    // Get existing attendance records for this date (filtered by allowed courses)
    const existingAttendance = await prisma.attendanceRecord.findMany({
      where: {
        attendance: {
          classDate: targetDate,
          offering: {
            course: courseFilter
          }
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
