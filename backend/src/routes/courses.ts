// src/routes/courses.ts
import { Router } from 'express';
import Database from '../lib/database';

const router = Router();

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
            sections: true,
            academic_years: true
          },
          take: 5 // Limit course offerings for performance
        },
        openElectiveRestrictions: {
          include: {
            restrictedDepartment: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    });

    // Extract year from each course code and add it to the response
    const coursesWithYear = courses.map(course => {
      let year = 1; // default
      
      // Try to extract year from course code pattern
      const yearMatch = course.code.match(/[A-Z]{2,4}([1-4])[0-9]{2,3}/);
      if (yearMatch) {
        year = parseInt(yearMatch[1]);
      }
      
      return {
        ...course,
        year
      };
    });

    res.json({
      status: 'success',
      data: coursesWithYear,
      count: coursesWithYear.length,
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
            academic_years: true,
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

// Create new course
router.post('/', async (req, res) => {
  try {
    const { name, code, department, year, credits, type, restrictedDepartments } = req.body;
    
    if (!name || !code || !department || !year) {
      return res.status(400).json({
        status: 'error',
        error: 'Missing required fields: name, code, department, year',
        timestamp: new Date().toISOString()
      });
    }

    // Validate year (should be 1-4)
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1 || yearNum > 4) {
      return res.status(400).json({
        status: 'error',
        error: 'Year must be a number between 1 and 4',
        timestamp: new Date().toISOString()
      });
    }

    // Validate restricted departments if provided (for open electives)
    if (type === 'open_elective' && restrictedDepartments && !Array.isArray(restrictedDepartments)) {
      return res.status(400).json({
        status: 'error',
        error: 'Restricted departments must be an array',
        timestamp: new Date().toISOString()
      });
    }

    const prisma = Database.getInstance();

    // Check if course code already exists
    const existingCourse = await prisma.course.findFirst({
      where: { code: code.toUpperCase() }
    });

    if (existingCourse) {
      return res.status(409).json({
        status: 'error',
        error: 'Course code already exists',
        timestamp: new Date().toISOString()
      });
    }

    // Find the department
    const departmentRecord = await prisma.department.findFirst({
      where: { code: department },
      include: {
        colleges: true
      }
    });

    if (!departmentRecord) {
      return res.status(404).json({
        status: 'error',
        error: 'Department not found',
        timestamp: new Date().toISOString()
      });
    }

    // Create the course - we'll embed the year info in the course code pattern
    // Ensure the course code follows a pattern that includes the year
    let finalCode = code.toUpperCase().trim();
    
    // If the code doesn't already contain the year pattern, prepend it
    if (!finalCode.match(/^[A-Z]{2,4}[1-4][0-9]{2,3}$/)) {
      // Extract department prefix (first 2-4 letters)
      const deptPrefix = (departmentRecord.code || 'DEPT').substring(0, Math.min(4, (departmentRecord.code || 'DEPT').length));
      // Create a pattern like CS3XX where 3 is the year
      const codeNumber = finalCode.match(/\d+$/) ? finalCode.match(/\d+$/)[0] : '01';
      finalCode = `${deptPrefix}${yearNum}${codeNumber.padStart(2, '0')}`;
    }

    const course = await prisma.course.create({
      data: {
        name: name.trim(),
        code: finalCode,
        college_id: departmentRecord.college_id,
        departmentId: departmentRecord.id,
        type: type || 'theory'
      },
      include: {
        department: {
          include: {
            colleges: true
          }
        }
      }
    });

    // Add open elective restrictions if provided
    if (type === 'open_elective' && restrictedDepartments && restrictedDepartments.length > 0) {
      // Find department IDs for the restricted department codes
      const restrictedDepts = await prisma.department.findMany({
        where: {
          code: {
            in: restrictedDepartments
          }
        },
        select: {
          id: true,
          code: true,
          name: true
        }
      });

      // Create restrictions
      const restrictions = restrictedDepts.map(dept => ({
        courseId: course.id,
        restrictedDepartmentId: dept.id
      }));

      if (restrictions.length > 0) {
        await prisma.openElectiveRestriction.createMany({
          data: restrictions
        });
      }
    }

    // Fetch the course with restrictions for response
    const courseWithRestrictions = await prisma.course.findUnique({
      where: { id: course.id },
      include: {
        department: {
          include: {
            colleges: true
          }
        },
        openElectiveRestrictions: {
          include: {
            restrictedDepartment: true
          }
        }
      }
    });

    res.status(201).json({
      status: 'success',
      data: {
        ...courseWithRestrictions,
        year: yearNum // Include the year in the response
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating course:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      status: 'error',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Update course
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, department, year, type, restrictedDepartments } = req.body;
    
    if (!name || !code || !department) {
      return res.status(400).json({
        status: 'error',
        error: 'Missing required fields: name, code, department',
        timestamp: new Date().toISOString()
      });
    }

    // Validate year if provided (should be 1-4)
    let yearNum = null;
    if (year) {
      yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 1 || yearNum > 4) {
        return res.status(400).json({
          status: 'error',
          error: 'Year must be a number between 1 and 4',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Validate restricted departments if provided (for open electives)
    if (type === 'open_elective' && restrictedDepartments && !Array.isArray(restrictedDepartments)) {
      return res.status(400).json({
        status: 'error',
        error: 'Restricted departments must be an array',
        timestamp: new Date().toISOString()
      });
    }

    const prisma = Database.getInstance();

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id }
    });

    if (!existingCourse) {
      return res.status(404).json({
        status: 'error',
        error: 'Course not found',
        timestamp: new Date().toISOString()
      });
    }

    // Find the department
    const departmentRecord = await prisma.department.findFirst({
      where: { code: department },
      include: {
        colleges: true
      }
    });

    if (!departmentRecord) {
      return res.status(404).json({
        status: 'error',
        error: 'Department not found',
        timestamp: new Date().toISOString()
      });
    }

    // Prepare the final code first
    let finalCode = code.toUpperCase().trim();
    
    // If year is provided, ensure the course code embeds the year information
    if (yearNum) {
      // If the code doesn't already contain the year pattern, modify it
      if (!finalCode.match(/^[A-Z]{2,4}[1-4][0-9]{2,3}$/)) {
        // Extract department prefix (first 2-4 letters)
        const deptPrefix = (departmentRecord.code || 'DEPT').substring(0, Math.min(4, (departmentRecord.code || 'DEPT').length));
        // Create a pattern like CS3XX where 3 is the year
        const codeNumber = finalCode.match(/\d+$/) ? finalCode.match(/\d+$/)[0] : '01';
        finalCode = `${deptPrefix}${yearNum}${codeNumber.padStart(2, '0')}`;
      } else {
        // Replace the year digit in existing pattern
        finalCode = finalCode.replace(/^([A-Z]{2,4})[1-4]/, `$1${yearNum}`);
      }
    }

    // Check if the final course code already exists (excluding current course)
    const codeConflict = await prisma.course.findFirst({
      where: { 
        code: finalCode,
        id: { not: id }
      }
    });

    if (codeConflict) {
      return res.status(409).json({
        status: 'error',
        error: 'Course code already exists',
        timestamp: new Date().toISOString()
      });
    }

    // Update the course
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        name: name.trim(),
        code: finalCode,
        college_id: departmentRecord.college_id,
        departmentId: departmentRecord.id,
        type: type || 'theory'
      },
      include: {
        department: {
          include: {
            colleges: true
          }
        }
      }
    });

    // Handle open elective restrictions
    if (type === 'open_elective') {
      // First, delete all existing restrictions for this course
      await prisma.openElectiveRestriction.deleteMany({
        where: { courseId: id }
      });

      // Then add new restrictions if provided
      if (restrictedDepartments && restrictedDepartments.length > 0) {
        // Find department IDs for the restricted department codes
        const restrictedDepts = await prisma.department.findMany({
          where: {
            code: {
              in: restrictedDepartments
            }
          },
          select: {
            id: true,
            code: true,
            name: true
          }
        });

        // Create restrictions
        const restrictions = restrictedDepts.map(dept => ({
          courseId: id,
          restrictedDepartmentId: dept.id
        }));

        if (restrictions.length > 0) {
          await prisma.openElectiveRestriction.createMany({
            data: restrictions
          });
        }
      }
    } else {
      // If not an open elective, remove any existing restrictions
      await prisma.openElectiveRestriction.deleteMany({
        where: { courseId: id }
      });
    }

    // Fetch the updated course with restrictions for response
    const courseWithRestrictions = await prisma.course.findUnique({
      where: { id },
      include: {
        department: {
          include: {
            colleges: true
          }
        },
        openElectiveRestrictions: {
          include: {
            restrictedDepartment: true
          }
        }
      }
    });

    res.json({
      status: 'success',
      data: {
        ...courseWithRestrictions,
        year: yearNum // Include the year in the response if provided
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating course:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
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
