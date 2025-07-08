// src/routes/colleges.ts
import { Router } from 'express';
import Database from '../lib/database';

const router = Router();

// Get all colleges
router.get('/', async (req, res) => {
  try {
    const prisma = Database.getInstance()
    
    const colleges = await prisma.college.findMany({
      orderBy: { name: 'asc' },
      include: {
        departments: {
          include: {
            _count: {
              select: {
                students: true,
                teachers: true,
                courses: true
              }
            }
          }
        },
        _count: {
          select: {
            departments: true,
            students: true,
            teachers: true
          }
        }
      }
    })

    // Calculate stats for each college
    const collegesWithStats = colleges.map(college => ({
      id: college.id,
      name: college.name,
      code: college.code,
      departments: college.departments,
      stats: {
        totalDepartments: college._count.departments,
        totalStudents: college._count.students,
        totalTeachers: college._count.teachers,
        totalCourses: college.departments.reduce((sum, dept) => sum + dept._count.courses, 0)
      }
    }))

    res.json({
      status: 'success',
      data: collegesWithStats,
      count: colleges.length
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({
      status: 'error',
      error: errorMessage
    })
  }
})

// Get college by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const prisma = Database.getInstance()
    
    const college = await prisma.college.findUnique({
      where: { id },
      include: {
        departments: {
          include: {
            _count: {
              select: {
                students: true,
                teachers: true,
                courses: true
              }
            }
          }
        },
        _count: {
          select: {
            departments: true,
            students: true,
            teachers: true
          }
        }
      }
    })

    if (!college) {
      res.status(404).json({
        status: 'error',
        error: 'College not found'
      })
      return
    }

    // Calculate stats
    const collegeWithStats = {
      id: college.id,
      name: college.name,
      code: college.code,
      departments: college.departments,
      stats: {
        totalDepartments: college._count.departments,
        totalStudents: college._count.students,
        totalTeachers: college._count.teachers,
        totalCourses: college.departments.reduce((sum, dept) => sum + dept._count.courses, 0)
      }
    }

    res.json({
      status: 'success',
      data: collegeWithStats
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({
      status: 'error',
      error: errorMessage
    })
  }
})

// Get college stats
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params
    const prisma = Database.getInstance()
    
    const college = await prisma.college.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            departments: true,
            students: true,
            teachers: true
          }
        },
        departments: {
          include: {
            _count: {
              select: {
                courses: true
              }
            }
          }
        }
      }
    })

    if (!college) {
      res.status(404).json({
        status: 'error',
        error: 'College not found'
      })
      return
    }

    const stats = {
      totalDepartments: college._count.departments,
      totalStudents: college._count.students,
      totalTeachers: college._count.teachers,
      totalCourses: college.departments.reduce((sum, dept) => sum + dept._count.courses, 0),
      departmentBreakdown: college.departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        code: dept.code,
        courseCount: dept._count.courses || 0
      }))
    }

    res.json({
      status: 'success',
      data: stats
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({
      status: 'error',
      error: errorMessage
    })
  }
})

// Create new college
router.post('/', async (req, res) => {
  try {
    const { name, code } = req.body
    
    if (!name || !code) {
      res.status(400).json({
        status: 'error',
        error: 'Name and code are required'
      })
      return
    }

    const prisma = Database.getInstance()
    
    // Check if college with this code already exists
    const existingCollege = await prisma.college.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (existingCollege) {
      res.status(409).json({
        status: 'error',
        error: 'College with this code already exists'
      })
      return
    }

    const college = await prisma.college.create({
      data: {
        name: name.trim(),
        code: code.toUpperCase().trim()
      }
    })

    res.status(201).json({
      status: 'success',
      data: college,
      message: 'College created successfully'
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({
      status: 'error',
      error: errorMessage
    })
  }
})

// Update college
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, code } = req.body
    const prisma = Database.getInstance()
    
    // Check if college exists
    const existingCollege = await prisma.college.findUnique({
      where: { id }
    })

    if (!existingCollege) {
      res.status(404).json({
        status: 'error',
        error: 'College not found'
      })
      return
    }

    // Check if code is being changed and if new code already exists
    if (code && code.toUpperCase() !== existingCollege.code) {
      const codeExists = await prisma.college.findUnique({
        where: { code: code.toUpperCase() }
      })

      if (codeExists) {
        res.status(409).json({
          status: 'error',
          error: 'College with this code already exists'
        })
        return
      }
    }

    const updateData: any = {}
    if (name) updateData.name = name.trim()
    if (code) updateData.code = code.toUpperCase().trim()

    const college = await prisma.college.update({
      where: { id },
      data: updateData
    })

    res.json({
      status: 'success',
      data: college,
      message: 'College updated successfully'
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({
      status: 'error',
      error: errorMessage
    })
  }
})

// Delete college
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const prisma = Database.getInstance()
    
    // Check if college exists
    const existingCollege = await prisma.college.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            departments: true,
            students: true,
            teachers: true
          }
        }
      }
    })

    if (!existingCollege) {
      res.status(404).json({
        status: 'error',
        error: 'College not found'
      })
      return
    }

    // Check if college has dependencies
    if (existingCollege._count.departments > 0 || 
        existingCollege._count.students > 0 || 
        existingCollege._count.teachers > 0) {
      const dependencies = []
      if (existingCollege._count.departments > 0) {
        dependencies.push(`${existingCollege._count.departments} department(s)`)
      }
      if (existingCollege._count.students > 0) {
        dependencies.push(`${existingCollege._count.students} student(s)`)
      }
      if (existingCollege._count.teachers > 0) {
        dependencies.push(`${existingCollege._count.teachers} teacher(s)`)
      }
      
      res.status(409).json({
        status: 'error',
        error: `Cannot delete college. It has ${dependencies.join(', ')}. Please remove these dependencies first.`,
        dependencies: {
          departments: existingCollege._count.departments,
          students: existingCollege._count.students,
          teachers: existingCollege._count.teachers
        }
      })
      return
    }

    await prisma.college.delete({
      where: { id }
    })

    res.json({
      status: 'success',
      message: 'College deleted successfully'
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({
      status: 'error',
      error: errorMessage
    })
  }
})

// Force delete college (cascading delete)
router.delete('/:id/force', async (req, res) => {
  try {
    const { id } = req.params
    const prisma = Database.getInstance()
    
    // Check if college exists and get all dependencies
    const existingCollege = await prisma.college.findUnique({
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
        departments: {
          include: {
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
        },
        courses: {
          include: {
            courseOfferings: true,
            courseElectiveGroupMembers: true
          }
        }
      }
    })

    if (!existingCollege) {
      res.status(404).json({
        status: 'error',
        error: 'College not found'
      })
      return
    }

    // Force delete college with explicit cascading deletes
    // Delete all related records manually to ensure complete removal
    
    // Delete all students and their dependencies
    for (const student of existingCollege.students) {
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
    for (const teacher of existingCollege.teachers) {
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
    for (const course of existingCollege.courses) {
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

    // Delete all departments and their dependencies
    for (const department of existingCollege.departments) {
      // Delete department elective groups
      for (const group of department.departmentElectiveGroups) {
        await prisma.courseElectiveGroupMember.deleteMany({
          where: { groupId: group.id }
        })
        await prisma.departmentElectiveGroup.delete({
          where: { id: group.id }
        })
      }
      
      // Delete sections
      await prisma.sections.deleteMany({
        where: { department_id: department.id }
      })
      
      // Delete department
      await prisma.department.delete({
        where: { id: department.id }
      })
    }

    // Finally delete the college
    await prisma.college.delete({
      where: { id }
    })

    res.json({
      status: 'success',
      message: 'College and all related data deleted successfully (forced)',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({
      status: 'error',
      error: errorMessage,
      timestamp: new Date().toISOString()
    })
  }
})

export default router
