// src/routes/users.ts
import { Router } from 'express';
import Database from '../lib/database';
import bcrypt from 'bcryptjs';

import { autoEnrollFirstYearStudent, autoEnrollStudentBySemester, autoEnrollStudentForSemester } from '../services/autoEnrollmentService';

const router = Router();
const SALT_ROUNDS = 12;
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

// Create new user
router.post('/', async (req, res) => {
  try {
    const {
      name,
      username,
      phone,
      role,
      password,
      departmentId,
      year,
      section,
      email,
      usn,
      collegeId
    } = req.body;

    console.log('🔍 Received request body (sanitized):', {
      name,
      username,
      role,
      departmentId,
      year,
      section,
      email,
      usn,
      collegeId
    });

    if (!name || !username || !role) {
      return res.status(400).json({
        status: 'error',
        error: 'Missing required fields: name, username, role',
        timestamp: new Date().toISOString()
      });
    }

    const validRoles = ['student', 'teacher', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: 'error',
        error: 'Invalid role. Must be one of: student, teacher, admin',
        timestamp: new Date().toISOString()
      });
    }

    const prisma = Database.getInstance();

    const existingUser = await prisma.user.findFirst({
      where: { username }
    });

    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        error: 'User with this username already exists',
        timestamp: new Date().toISOString()
      });
    }

    // 🔐 PASSWORD HASHING (FIX)
    const passwordHash = password
      ? await bcrypt.hash(password, SALT_ROUNDS)
      : await bcrypt.hash('default123', SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        passwordHash
      }
    });

    await prisma.userRoleAssignment.create({
      data: {
        userId: user.id,
        role: role as any
      }
    });

    // ---------------- STUDENT ----------------
    if (role === 'student') {
      let collegeIdToUse = collegeId || null;
      let departmentIdToUse = null;

      if (departmentId) {
        const department = await prisma.department.findUnique({
          where: { id: departmentId }
        });

        if (department) {
          collegeIdToUse ??= department.college_id;
          departmentIdToUse = departmentId;
        }
      }

      if (!collegeIdToUse) {
        const firstCollege = await prisma.college.findFirst();
        if (!firstCollege) {
          return res.status(500).json({
            status: 'error',
            error: 'No college found in the system',
            timestamp: new Date().toISOString()
          });
        }
        collegeIdToUse = firstCollege.id;
      }

      const semester = year ? year * 2 - 1 : 1;

      let sectionId = null;
      if (section?.trim() && departmentIdToUse) {
        const existingSection = await prisma.sections.findFirst({
          where: { section_name: section.trim() }
        });

        sectionId = existingSection
          ? existingSection.section_id
          : (
              await prisma.sections.create({
                data: {
                  section_name: section.trim(),
                  department_id: departmentIdToUse
                }
              })
            ).section_id;
      }

      const student = await prisma.student.create({
        data: {
          userId: user.id,
          college_id: collegeIdToUse,
          department_id: departmentIdToUse,
          section_id: sectionId,
          usn: usn || `USN${Date.now()}`,
          semester,
          batchYear: new Date().getFullYear()
        }
      });

      if (departmentIdToUse) {
        try {
          await autoEnrollStudentForSemester(student.id, semester);
        } catch (e) {
          console.warn('Auto-enrollment failed:', e);
        }
      }
    }

    // ---------------- TEACHER ----------------
    if (role === 'teacher') {
      let collegeIdToUse = collegeId;

      if (!collegeIdToUse && departmentId) {
        const department = await prisma.department.findUnique({
          where: { id: departmentId }
        });
        collegeIdToUse = department?.college_id ?? null;
      }

      if (!collegeIdToUse) {
        const firstCollege = await prisma.college.findFirst();
        if (!firstCollege) {
          return res.status(500).json({
            status: 'error',
            error: 'No college found in the system',
            timestamp: new Date().toISOString()
          });
        }
        collegeIdToUse = firstCollege.id;
      }

      await prisma.teacher.create({
        data: {
          userId: user.id,
          college_id: collegeIdToUse
        }
      });
    }

    // ---------------- ADMIN ----------------
    if (role === 'admin') {
      await prisma.admin.create({
        data: { userId: user.id }
      });
    }

    const completeUser = await prisma.user.findUnique({
      where: { id: user.id },
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
                  include: { course: true }
                }
              }
            }
          }
        },
        teacher: {
          include: {
            colleges: true,
            department: true
          }
        }
      }
    });

    return res.status(201).json({
      status: 'success',
      data: completeUser,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, phone, role, departmentId, year, section, usn, email } = req.body;
    const { collegeId } = req.body;
    
    if (!name || !username || !role) {
      return res.status(400).json({
        status: 'error',
        error: 'Missing required fields: name, username, role',
        timestamp: new Date().toISOString()
      });
    }

    // Validate role
    const validRoles = ['student', 'teacher', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: 'error',
        error: 'Invalid role. Must be one of: student, teacher, admin',
        timestamp: new Date().toISOString()
      });
    }

    const prisma = Database.getInstance();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: true,
        student: true,
        teacher: true,
        admin: true
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        status: 'error',
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if username conflicts with other users
    const conflictUser = await prisma.user.findFirst({
      where: { 
        AND: [
          { id: { not: id } },
          { username: username }
        ]
      }
    });

    if (conflictUser) {
      return res.status(409).json({
        status: 'error',
        error: 'Username already exists for another user',
        timestamp: new Date().toISOString()
      });
    }

    // Update user basic info
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name.trim(),
        username: username.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null
      }
    });

    // Handle role changes
    const currentRole = existingUser.userRoles?.[0]?.role;
    if (currentRole !== role) {
      // Delete existing role assignments
      await prisma.userRoleAssignment.deleteMany({
        where: { userId: id }
      });

      // Create new role assignment
      await prisma.userRoleAssignment.create({
        data: {
          userId: id,
          role: role as any
        }
      });

      // Get the first college for role-specific records (temporary approach)
      const firstCollege = await prisma.college.findFirst();
      if (!firstCollege) {
        return res.status(500).json({
          status: 'error',
          error: 'No college found in the system',
          timestamp: new Date().toISOString()
        });
      }

      // Handle role-specific record changes
      if (currentRole === 'student' && existingUser.student) {
        await prisma.student.delete({
          where: { id: existingUser.student.id }
        });
      } else if (currentRole === 'teacher' && existingUser.teacher) {
        await prisma.teacher.delete({
          where: { id: existingUser.teacher.id }
        });
      } else if (currentRole === 'admin' && existingUser.admin) {
        await prisma.admin.delete({
          where: { userId: id }
        });
      }

      // Create new role-specific records
      if (role === 'student') {
        await prisma.student.create({
          data: {
            userId: id,
            college_id: firstCollege.id,
            usn: `USN${Date.now()}`,
            semester: 1,
            batchYear: new Date().getFullYear()
          }
        });
      } else if (role === 'teacher') {
        await prisma.teacher.create({
          data: {
            userId: id,
            college_id: firstCollege.id
          }
        });
      } else if (role === 'admin') {
        await prisma.admin.create({
          data: {
            userId: id
          }
        });
      }
    }

    // Update student-specific fields if user is a student
    if (role === 'student' && existingUser.student) {
      let collegeId = existingUser.student.college_id;
      let departmentIdToUse = existingUser.student.department_id;
      // Update department if provided
      if (departmentId) {
        const department = await prisma.department.findUnique({
          where: { id: departmentId },
          include: { colleges: true }
        });
        if (department) {
          collegeId = department.college_id;
          departmentIdToUse = departmentId;
        }
      }
      // Calculate semester from year if provided
      let semester = existingUser.student.semester;
      if (year) {
        semester = year * 2 - 1; // 1st year = semester 1, 2nd year = semester 3, etc.
      }
      // Handle section update
      let sectionId = existingUser.student.section_id;
      if (section !== undefined) {
        if (section && section.trim()) {
          // Try to find existing section or create new one
          const existingSection = await prisma.sections.findFirst({
            where: { section_name: section.trim() }
          });
          if (existingSection) {
            sectionId = existingSection.section_id;
          } else if (departmentIdToUse) {
            // Create new section only if we have a department
            const newSection = await prisma.sections.create({
              data: {
                section_name: section.trim(),
                department_id: departmentIdToUse
              }
            });
            sectionId = newSection.section_id;
          }
        } else {
          sectionId = null; // Clear section if empty string provided
        }
      }
      // Update student record
      await prisma.student.update({
        where: { id: existingUser.student.id },
        data: {
          college_id: collegeId,
          department_id: departmentIdToUse,
          section_id: sectionId,
          usn: usn || existingUser.student.usn,
          semester: semester,
          batchYear: existingUser.student.batchYear // Keep existing batch year
        }
      });
    }

    // Update teacher-specific fields if user is a teacher
    if (role === 'teacher' && existingUser.teacher) {
      let collegeId = existingUser.teacher.college_id;
      let departmentIdToUse = existingUser.teacher.departmentId;
      // Update department if provided
      if (departmentId) {
        const department = await prisma.department.findUnique({
          where: { id: departmentId },
          include: { colleges: true }
        });
        if (department) {
          collegeId = department.college_id;
          departmentIdToUse = departmentId;
        }
      }
      // Update teacher record
      await prisma.teacher.update({
        where: { id: existingUser.teacher.id },
        data: {
          college_id: collegeId,
          departmentId: departmentIdToUse
        }
      });
    }

    // Fetch the complete updated user
    const completeUser = await prisma.user.findUnique({
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
            department: true
          }
        }
      }
    });

    res.json({
      status: 'success',
      data: completeUser,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
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
