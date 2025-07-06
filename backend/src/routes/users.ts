// src/routes/users.ts
import { Router } from 'express';
import Database from '../lib/database';

const router = Router()

// Get all users with roles
router.get('/', async (req, res) => {
  try {
    const prisma = Database.getInstance();
    
    const users = await prisma.user.findMany({
      include: {
        userRoles: true,
        student: {
          include: {
            colleges: true,
            departments: true,
            sections: true,
            enrollments: {
              include: {
                offering: {
                  include: {
                    course: true
                  }
                }
              }
            }
          }
        },
        teacher: {
          include: {
            colleges: true,
            department: true,
          }
        }
      },
      take: 100, // Increase limit to get more users including students
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      status: 'success',
      data: users,
      count: users.length,
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

// Get users by role
router.get('/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const prisma = Database.getInstance();
    
    const users = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: role as any
          }
        }
      },
      include: {
        userRoles: true,
        student: {
          include: {
            colleges: true,
            departments: true,
            sections: true,
            enrollments: {
              include: {
                offering: {
                  include: {
                    course: true
                  }
                }
              }
            }
          }
        },
        teacher: {
          include: {
            colleges: true,
            department: true,
          }
        }
      },
      take: 50,
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      status: 'success',
      data: users,
      count: users.length,
      role: role,
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

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = Database.getInstance();
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: true,
        student: {
          include: {
            colleges: true,
            departments: true,
            sections: true,
            enrollments: {
              include: {
                offering: {
                  include: {
                    course: true,
                    teacher: {
                      include: {
                        user: {
                          select: {
                            name: true,
                            username: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        teacher: {
          include: {
            colleges: true,
            department: true,
            courseOfferings: {
              include: {
                course: true,
                sections: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      status: 'success',
      data: user,
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

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const prisma = Database.getInstance();
    const userId = req.params.id;

    // Check if user exists and get dependencies
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            _count: {
              select: {
                enrollments: true,
                attendanceRecords: true
              }
            }
          }
        },
        teacher: {
          include: {
            _count: {
              select: {
                courseOfferings: true,
                attendances: true
              }
            }
          }
        }
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        status: 'error',
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check for dependencies
    let hasDependencies = false;
    const dependencies: any = {};

    if (existingUser.student) {
      dependencies.enrollments = existingUser.student._count.enrollments;
      dependencies.attendanceRecords = existingUser.student._count.attendanceRecords;
      if (dependencies.enrollments > 0 || dependencies.attendanceRecords > 0) {
        hasDependencies = true;
      }
    }

    if (existingUser.teacher) {
      dependencies.courseOfferings = existingUser.teacher._count.courseOfferings;
      dependencies.attendances = existingUser.teacher._count.attendances;
      if (dependencies.courseOfferings > 0 || dependencies.attendances > 0) {
        hasDependencies = true;
      }
    }

    if (hasDependencies) {
      const depList = Object.entries(dependencies)
        .filter(([, count]) => (count as number) > 0)
        .map(([type, count]) => `${count} ${type}`)
        .join(', ');
      
      return res.status(409).json({
        status: 'error',
        error: `Cannot delete user. User has ${depList}. Please remove these dependencies first.`,
        dependencies,
        timestamp: new Date().toISOString()
      });
    }

    // Delete user (this will cascade to related records)
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({
      status: 'success',
      message: 'User deleted successfully',
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

// Force delete user (cascading delete)
router.delete('/:id/force', async (req, res) => {
  try {
    const prisma = Database.getInstance();
    const userId = req.params.id;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            attendanceRecords: true,
            enrollments: true
          }
        },
        teacher: {
          include: {
            attendances: true,
            courseOfferings: true
          }
        },
        admin: true,
        reportViewer: true,
        userRoles: true
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        status: 'error',
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Force delete user with explicit cascading deletes
    // Delete all related records manually to ensure complete removal
    
    // Delete student-related records
    if (existingUser.student) {
      // Delete attendance records
      await prisma.attendanceRecord.deleteMany({
        where: { studentId: existingUser.student.id }
      });
      
      // Delete enrollments
      await prisma.studentEnrollment.deleteMany({
        where: { studentId: existingUser.student.id }
      });
      
      // Delete student record
      await prisma.student.delete({
        where: { id: existingUser.student.id }
      });
    }

    // Delete teacher-related records
    if (existingUser.teacher) {
      // Delete attendance records created by teacher
      await prisma.attendance.deleteMany({
        where: { teacherId: existingUser.teacher.id }
      });
      
      // Delete course offerings
      await prisma.courseOffering.deleteMany({
        where: { teacherId: existingUser.teacher.id }
      });
      
      // Delete teacher record
      await prisma.teacher.delete({
        where: { id: existingUser.teacher.id }
      });
    }

    // Delete admin record
    if (existingUser.admin) {
      await prisma.admin.delete({
        where: { userId: userId }
      });
    }

    // Delete report viewer record
    if (existingUser.reportViewer) {
      await prisma.reportViewer.delete({
        where: { userId: userId }
      });
    }

    // Delete user roles
    await prisma.userRoleAssignment.deleteMany({
      where: { userId: userId }
    });

    // Finally delete the user
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({
      status: 'success',
      message: 'User and all related data deleted successfully (forced)',
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
