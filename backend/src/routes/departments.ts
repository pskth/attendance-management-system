// src/routes/departments.ts
import { Router } from 'express';
import Database from '../lib/database';

const router = Router()

// Get all departments
router.get('/', async (req, res) => {
  try {
    const prisma = Database.getInstance();
    
    const departments = await prisma.department.findMany({
      include: {
        colleges: true,
        courses: {
          take: 5, // Limit courses for performance
          orderBy: {
            code: 'asc'
          }
        },
        sections: {
          take: 10, // Limit sections for performance
          orderBy: {
            section_name: 'asc'
          }
        },
        students: {
          take: 5, // Limit students for performance
          include: {
            user: true
          }
        },
        teachers: {
          take: 5, // Limit teachers for performance
          include: {
            user: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      status: 'success',
      data: departments,
      count: departments.length,
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

// Get department by ID
router.get('/:id', async (req, res) => {
  try {
    const prisma = Database.getInstance();
    const { id } = req.params;
    
    const department = await prisma.department.findUnique({
      where: { id: id },
      include: {
        colleges: true,
        courses: {
          include: {
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
        },
        sections: {
          include: {
            students: {
              include: {
                user: true
              },
              take: 20 // Limit students per section
            }
          },
          orderBy: {
            section_name: 'asc'
          }
        },
        students: {
          include: {
            user: true,
            sections: true
          },
          take: 50, // Limit students for performance
          orderBy: {
            usn: 'asc'
          }
        },
        teachers: {
          include: {
            user: true,
            courseOfferings: {
              include: {
                course: true
              },
              take: 5
            }
          },
          orderBy: {
            user: {
              name: 'asc'
            }
          }
        }
      }
    });

    if (!department) {
      return res.status(404).json({
        status: 'error',
        error: 'Department not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      status: 'success',
      data: department,
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

// Get departments by college
router.get('/college/:collegeId', async (req, res) => {
  try {
    const prisma = Database.getInstance();
    const { collegeId } = req.params;
    
    const departments = await prisma.department.findMany({
      where: { college_id: collegeId },
      include: {
        colleges: true,
        courses: {
          take: 3,
          orderBy: {
            code: 'asc'
          }
        },
        sections: {
          take: 5,
          orderBy: {
            section_name: 'asc'
          }
        },
        _count: {
          select: {
            students: true,
            teachers: true,
            courses: true,
            sections: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      status: 'success',
      data: departments,
      count: departments.length,
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

// Get department statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const prisma = Database.getInstance();
    const { id } = req.params;
    
    const department = await prisma.department.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            courses: true,
            sections: true
          }
        },
        colleges: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });

    if (!department) {
      return res.status(404).json({
        status: 'error',
        error: 'Department not found',
        timestamp: new Date().toISOString()
      });
    }

    // Get course type breakdown
    const courseStats = await prisma.course.groupBy({
      by: ['type'],
      where: { departmentId: id },
      _count: {
        type: true
      }
    });

    res.json({
      status: 'success',
      data: {
        department: {
          id: department.id,
          name: department.name,
          code: department.code,
          college: department.colleges
        },
        counts: department._count,
        coursesByType: courseStats.map(stat => ({
          type: stat.type,
          count: stat._count.type
        }))
      },
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

// Delete department
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = Database.getInstance();

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            courses: true
          }
        }
      }
    });

    if (!existingDepartment) {
      return res.status(404).json({
        status: 'error',
        error: 'Department not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if department has students, teachers, or courses
    if (existingDepartment._count.students > 0 || 
        existingDepartment._count.teachers > 0 || 
        existingDepartment._count.courses > 0) {
      const dependencies = []
      if (existingDepartment._count.students > 0) {
        dependencies.push(`${existingDepartment._count.students} student(s)`)
      }
      if (existingDepartment._count.teachers > 0) {
        dependencies.push(`${existingDepartment._count.teachers} teacher(s)`)
      }
      if (existingDepartment._count.courses > 0) {
        dependencies.push(`${existingDepartment._count.courses} course(s)`)
      }
      
      return res.status(409).json({
        status: 'error',
        error: `Cannot delete department. It has ${dependencies.join(', ')}. Please remove these dependencies first.`,
        dependencies: {
          students: existingDepartment._count.students,
          teachers: existingDepartment._count.teachers,
          courses: existingDepartment._count.courses
        },
        timestamp: new Date().toISOString()
      });
    }

    // Delete department
    await prisma.department.delete({
      where: { id }
    });

    res.json({
      status: 'success',
      message: 'Department deleted successfully',
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

// Force delete department (cascading delete)
router.delete('/:id/force', async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = Database.getInstance();

    // Check if department exists and get all dependencies
    const existingDepartment = await prisma.department.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            attendanceRecords: true,
            enrollments: true,
            user: {
              include: {
                userRoles: true,
                admin: true,
                reportViewer: true
              }
            }
          }
        },
        teachers: {
          include: {
            attendances: true,
            courseOfferings: true,
            user: {
              include: {
                userRoles: true,
                admin: true,
                reportViewer: true
              }
            }
          }
        },
        courses: {
          include: {
            courseOfferings: true,
            courseElectiveGroupMembers: true
          }
        },
        sections: true,
        departmentElectiveGroups: {
          include: {
            courseElectiveGroupMembers: true
          }
        }
      }
    });

    if (!existingDepartment) {
      return res.status(404).json({
        status: 'error',
        error: 'Department not found',
        timestamp: new Date().toISOString()
      });
    }

    // Force delete department with explicit cascading deletes
    
    // Delete all students and their dependencies
    for (const student of existingDepartment.students) {
      // Delete attendance records
      await prisma.attendanceRecord.deleteMany({
        where: { studentId: student.id }
      })
      
      // Delete enrollments
      await prisma.studentEnrollment.deleteMany({
        where: { studentId: student.id }
      })
      
      // Delete student record
      await prisma.student.delete({
        where: { id: student.id }
      })
      
      // Delete user roles
      await prisma.userRoleAssignment.deleteMany({
        where: { userId: student.userId }
      })
      
      // Delete admin record if exists
      if (student.user.admin) {
        await prisma.admin.delete({
          where: { userId: student.userId }
        })
      }
      
      // Delete report viewer record if exists
      if (student.user.reportViewer) {
        await prisma.reportViewer.delete({
          where: { userId: student.userId }
        })
      }
      
      // Delete user
      await prisma.user.delete({
        where: { id: student.userId }
      })
    }

    // Delete all teachers and their dependencies
    for (const teacher of existingDepartment.teachers) {
      // Delete attendance records created by teacher
      await prisma.attendance.deleteMany({
        where: { teacherId: teacher.id }
      })
      
      // Delete course offerings
      await prisma.courseOffering.deleteMany({
        where: { teacherId: teacher.id }
      })
      
      // Delete teacher record
      await prisma.teacher.delete({
        where: { id: teacher.id }
      })
      
      // Delete user roles
      await prisma.userRoleAssignment.deleteMany({
        where: { userId: teacher.userId }
      })
      
      // Delete admin record if exists
      if (teacher.user.admin) {
        await prisma.admin.delete({
          where: { userId: teacher.userId }
        })
      }
      
      // Delete report viewer record if exists
      if (teacher.user.reportViewer) {
        await prisma.reportViewer.delete({
          where: { userId: teacher.userId }
        })
      }
      
      // Delete user
      await prisma.user.delete({
        where: { id: teacher.userId }
      })
    }

    // Delete all courses and their dependencies
    for (const course of existingDepartment.courses) {
      // Delete course elective group members
      await prisma.courseElectiveGroupMember.deleteMany({
        where: { courseId: course.id }
      })
      
      // Delete course offerings
      await prisma.courseOffering.deleteMany({
        where: { courseId: course.id }
      })
      
      // Delete course
      await prisma.course.delete({
        where: { id: course.id }
      })
    }

    // Delete department elective groups
    for (const group of existingDepartment.departmentElectiveGroups) {
      await prisma.courseElectiveGroupMember.deleteMany({
        where: { groupId: group.id }
      })
      await prisma.departmentElectiveGroup.delete({
        where: { id: group.id }
      })
    }
    
    // Delete sections
    await prisma.sections.deleteMany({
      where: { department_id: id }
    })

    // Finally delete the department
    await prisma.department.delete({
      where: { id }
    });

    res.json({
      status: 'success',
      message: 'Department and all related data deleted successfully (forced)',
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
