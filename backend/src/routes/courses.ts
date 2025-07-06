// src/routes/courses.ts
import { Router } from 'express';
import Database from '../lib/database';

const router = Router()

// Get all courses
router.get('/', async (req, res) => {
  try {
    const prisma = Database.getInstance();
    
    const courses = await prisma.course.findMany({
      include: {
        department: {
          include: {
            colleges: true
          }
        },
        courseOfferings: {
          include: {
            teacher: {
              include: {
                user: true
              }
            },
            sections: true
          },
          take: 5 // Limit course offerings for performance
        }
      },
      orderBy: {
        code: 'asc'
      }
    });

    res.json({
      status: 'success',
      data: courses,
      count: courses.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      status: 'error', 
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const prisma = Database.getInstance();
    const { id } = req.params;
    
    const course = await prisma.course.findUnique({
      where: { id: id },
      include: {
        department: {
          include: {
            colleges: true
          }
        },
        courseOfferings: {
          include: {
            teacher: {
              include: {
                user: true
              }
            },
            sections: true,
            enrollments: {
              include: {
                student: {
                  include: {
                    user: true
                  }
                }
              },
              take: 10 // Limit enrollments for performance
            }
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({
        status: 'error',
        error: 'Course not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      status: 'success',
      data: course,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      status: 'error', 
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Get courses by department
router.get('/department/:departmentId', async (req, res) => {
  try {
    const prisma = Database.getInstance();
    const { departmentId } = req.params;
    
    const courses = await prisma.course.findMany({
      where: { departmentId },
      include: {
        department: {
          include: {
            colleges: true
          }
        },
        courseOfferings: {
          include: {
            teacher: {
              include: {
                user: true
              }
            },
            sections: true
          },
          take: 3 // Limit course offerings for performance
        }
      },
      orderBy: {
        code: 'asc'
      }
    });

    res.json({
      status: 'success',
      data: courses,
      count: courses.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      status: 'error', 
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Get courses by type
router.get('/type/:courseType', async (req, res) => {
  try {
    const prisma = Database.getInstance();
    const { courseType } = req.params;
    
    // Validate course type
    const validTypes = ['core', 'department_elective', 'open_elective'];
    if (!validTypes.includes(courseType)) {
      return res.status(400).json({
        status: 'error',
        error: 'Invalid course type. Must be one of: core, department_elective, open_elective',
        timestamp: new Date().toISOString()
      });
    }

    const courses = await prisma.course.findMany({
      where: { type: courseType as any },
      include: {
        department: {
          include: {
            colleges: true
          }
        },
        courseOfferings: {
          include: {
            teacher: {
              include: {
                user: true
              }
            },
            sections: true
          },
          take: 3
        }
      },
      orderBy: {
        code: 'asc'
      }
    });

    res.json({
      status: 'success',
      data: courses,
      count: courses.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      status: 'error', 
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Delete course
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = Database.getInstance();

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            courseOfferings: true
          }
        }
      }
    });

    if (!existingCourse) {
      return res.status(404).json({
        status: 'error',
        error: 'Course not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if course has offerings
    if (existingCourse._count.courseOfferings > 0) {
      return res.status(409).json({
        status: 'error',
        error: `Cannot delete course. It has ${existingCourse._count.courseOfferings} active offering(s). Please remove these offerings first.`,
        dependencies: {
          courseOfferings: existingCourse._count.courseOfferings
        },
        timestamp: new Date().toISOString()
      });
    }

    // Delete course
    await prisma.course.delete({
      where: { id }
    });

    res.json({
      status: 'success',
      message: 'Course deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      status: 'error', 
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Force delete course (cascading delete)
router.delete('/:id/force', async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = Database.getInstance();

    // Check if course exists and get all dependencies
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      include: {
        courseOfferings: {
          include: {
            enrollments: true,
            attendances: true
          }
        },
        courseElectiveGroupMembers: true
      }
    });

    if (!existingCourse) {
      return res.status(404).json({
        status: 'error',
        error: 'Course not found',
        timestamp: new Date().toISOString()
      });
    }

    // Force delete course with explicit cascading deletes
    
    // Delete all course offerings and their dependencies
    for (const offering of existingCourse.courseOfferings) {
      // Delete attendance records for this offering (through attendance sessions)
      for (const attendance of offering.attendances) {
        await prisma.attendanceRecord.deleteMany({
          where: { attendanceId: attendance.id }
        })
      }
      
      // Delete attendance sessions for this offering
      await prisma.attendance.deleteMany({
        where: { offeringId: offering.id }
      })
      
      // Delete theory marks for enrollments in this offering
      await prisma.theoryMarks.deleteMany({
        where: { 
          enrollment: {
            offeringId: offering.id
          }
        }
      })
      
      // Delete lab marks for enrollments in this offering
      await prisma.labMarks.deleteMany({
        where: { 
          enrollment: {
            offeringId: offering.id
          }
        }
      })
      
      // Delete enrollments for this offering
      await prisma.studentEnrollment.deleteMany({
        where: { offeringId: offering.id }
      })
      
      // Delete the offering
      await prisma.courseOffering.delete({
        where: { id: offering.id }
      })
    }

    // Delete course elective group members
    await prisma.courseElectiveGroupMember.deleteMany({
      where: { courseId: id }
    })

    // Finally delete the course
    await prisma.course.delete({
      where: { id }
    });

    res.json({
      status: 'success',
      message: 'Course and all related data deleted successfully (forced)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      status: 'error', 
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
