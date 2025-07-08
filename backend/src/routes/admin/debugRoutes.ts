// src/routes/admin/debugRoutes.ts
import { Router } from 'express';
import DatabaseService from '../../lib/database';

const router = Router();

console.log('=== ADMIN DEBUG ROUTES LOADED ===');

// Debug endpoint to check student data
router.get('/debug/students', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    
    const students = await prisma.student.findMany({
      include: {
        user: { select: { name: true } },
        departments: { select: { code: true, name: true } }
      },
      orderBy: { usn: 'asc' },
      take: 10 // Just first 10 for debugging
    });
    
    const summary = await prisma.student.groupBy({
      by: ['batchYear', 'semester'],
      _count: true,
      orderBy: [
        { batchYear: 'asc' },
        { semester: 'asc' }
      ]
    });
    
    res.json({
      status: 'success',
      data: {
        sampleStudents: students.map(s => ({
          usn: s.usn,
          name: s.user.name,
          batchYear: s.batchYear,
          semester: s.semester,
          department: s.departments?.code
        })),
        summary: summary.map(s => ({
          batchYear: s.batchYear,
          semester: s.semester,
          count: s._count
        }))
      }
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Debug endpoint to check data consistency
router.get('/debug/data-mismatch', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    
    // Get student data grouped by year/semester
    const students = await prisma.student.findMany({
      select: {
        batchYear: true,
        semester: true,
        department_id: true
      }
    });
    
    // Get course offering data
    const courseOfferings = await prisma.courseOffering.findMany({
      include: {
        academic_years: {
          select: {
            year_name: true
          }
        }
      }
    });
    
    // Group students by batch year and semester
    const studentGroups = students.reduce((acc: Record<string, number>, student: any) => {
      const key = `batch${student.batchYear}_sem${student.semester}_dept${student.department_id}`;
      if (!acc[key]) {
        acc[key] = 0;
      }
      acc[key]++;
      return acc;
    }, {} as Record<string, number>);
    
    // Group course offerings by year/semester
    const courseGroups = courseOfferings.reduce((acc: Record<string, number>, offering: any) => {
      const year = offering.academic_years?.year_name || 'unknown';
      const key = `year${year}_sem${offering.semester}`;
      if (!acc[key]) {
        acc[key] = 0;
      }
      acc[key]++;
      return acc;
    }, {} as Record<string, number>);
    
    res.json({
      success: true,
      data: {
        studentGroups,
        courseGroups,
        totalStudents: students.length,
        totalCourseOfferings: courseOfferings.length
      }
    });
  } catch (error) {
    console.error('Error in data mismatch debug:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Simple debug endpoint to check raw data
router.get('/debug/raw-data', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    
    // Get sample student data
    const sampleStudents = await prisma.student.findMany({
      take: 5,
      select: {
        batchYear: true,
        semester: true,
        department_id: true,
        usn: true
      }
    });
    
    // Get sample course offering data
    const sampleOfferings = await prisma.courseOffering.findMany({
      take: 5,
      select: {
        semester: true,
        courseId: true,
        year_id: true
      }
    });
    
    // Get academic years
    const academicYears = await prisma.academic_years.findMany({
      select: {
        year_id: true,
        year_name: true
      }
    });
    
    res.json({
      success: true,
      data: {
        sampleStudents,
        sampleOfferings,
        academicYears
      }
    });
  } catch (error) {
    console.error('Error in raw data debug:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Debug endpoint to check department-course alignment
router.get('/debug/department-courses', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    
    // Get students by department and semester
    const studentsByDept = await prisma.student.findMany({
      include: {
        departments: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });
    
    // Get courses by department
    const coursesByDept = await prisma.course.findMany({
      include: {
        department: {
          select: {
            name: true,
            code: true
          }
        },
        courseOfferings: {
          select: {
            semester: true
          }
        }
      }
    });
    
    // Group data for analysis
    const deptStudentMap = studentsByDept.reduce((acc: any, student: any) => {
      const deptKey = student.departments?.code || 'Unknown';
      const semKey = `sem${student.semester}`;
      
      if (!acc[deptKey]) acc[deptKey] = {};
      if (!acc[deptKey][semKey]) acc[deptKey][semKey] = [];
      
      acc[deptKey][semKey].push(student.usn);
      return acc;
    }, {});
    
    const deptCourseMap = coursesByDept.reduce((acc: any, course: any) => {
      const deptKey = course.department?.code || 'Unknown';
      
      if (!acc[deptKey]) acc[deptKey] = [];
      
      acc[deptKey].push({
        code: course.code,
        name: course.name,
        type: course.type,
        semesters: course.courseOfferings.map((o: any) => o.semester)
      });
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        studentsByDepartment: deptStudentMap,
        coursesByDepartment: deptCourseMap
      }
    });
  } catch (error) {
    console.error('Error in department-courses debug:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Debug endpoint to check teacher assignments
router.get('/debug/teacher-assignments', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    
    // Get course offerings with teacher information
    const courseOfferingsWithTeachers = await prisma.courseOffering.findMany({
      include: {
        course: {
          select: {
            code: true,
            name: true
          }
        },
        teacher: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        academic_years: {
          select: {
            year_name: true
          }
        }
      }
    });
    
    // Separate offerings with and without teachers
    const withTeachers = courseOfferingsWithTeachers.filter(co => co.teacherId);
    const withoutTeachers = courseOfferingsWithTeachers.filter(co => !co.teacherId);
    
    res.json({
      success: true,
      data: {
        totalOfferings: courseOfferingsWithTeachers.length,
        withTeachers: {
          count: withTeachers.length,
          sample: withTeachers.slice(0, 5).map(co => ({
            courseCode: co.course?.code,
            courseName: co.course?.name,
            semester: co.semester,
            academicYear: co.academic_years?.year_name,
            teacherName: co.teacher?.user?.name,
            teacherId: co.teacherId
          }))
        },
        withoutTeachers: {
          count: withoutTeachers.length,
          sample: withoutTeachers.slice(0, 5).map(co => ({
            courseCode: co.course?.code,
            courseName: co.course?.name,
            semester: co.semester,
            academicYear: co.academic_years?.year_name,
            teacherId: null
          }))
        }
      }
    });
  } catch (error) {
    console.error('Error in teacher assignments debug:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Enhanced debug endpoint for course offerings structure
router.get('/debug/course-offerings-detailed', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    
    // Get all course offerings with complete information
    const courseOfferings = await prisma.courseOffering.findMany({
      include: {
        course: {
          select: {
            code: true,
            name: true,
            departmentId: true
          }
        },
        teacher: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        academic_years: {
          select: {
            year_name: true
          }
        },
        sections: {
          select: {
            section_name: true,
            departmentId: true
          }
        }
      },
      orderBy: [
        { course: { code: 'asc' } },
        { semester: 'asc' }
      ]
    });

    // Group by course code to see the pattern
    const groupedByCourse = courseOfferings.reduce((acc, offering) => {
      const key = `${offering.course?.code}-${offering.semester}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({
        id: offering.id,
        courseCode: offering.course?.code,
        courseName: offering.course?.name,
        semester: offering.semester,
        academicYear: offering.academic_years?.year_name,
        sectionName: offering.sections?.section_name,
        teacherName: offering.teacher?.user?.name,
        teacherId: offering.teacherId,
        hasTeacher: !!offering.teacherId
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Find courses with mixed teacher assignments
    const coursesWithMixedAssignments = Object.entries(groupedByCourse)
      .filter(([_, offerings]) => {
        const withTeacher = offerings.filter(o => o.hasTeacher).length;
        const withoutTeacher = offerings.filter(o => !o.hasTeacher).length;
        return withTeacher > 0 && withoutTeacher > 0;
      })
      .map(([courseKey, offerings]) => ({
        courseKey,
        totalOfferings: offerings.length,
        withTeacher: offerings.filter(o => o.hasTeacher).length,
        withoutTeacher: offerings.filter(o => !o.hasTeacher).length,
        offerings
      }));

    res.json({
      success: true,
      data: {
        totalOfferings: courseOfferings.length,
        totalUniqueCourses: Object.keys(groupedByCourse).length,
        coursesWithMixedAssignments: {
          count: coursesWithMixedAssignments.length,
          details: coursesWithMixedAssignments.slice(0, 3) // Show first 3 for analysis
        },
        sampleGroupedData: Object.entries(groupedByCourse).slice(0, 3).map(([key, offerings]) => ({
          courseKey: key,
          count: offerings.length,
          offerings
        }))
      }
    });
  } catch (error) {
    console.error('Error in detailed course offerings debug:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Simple debug to check course offering structure
router.get('/debug/ui-teacher-issue', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    
    // Get sample course offerings that should have teachers
    const sampleOfferings = await prisma.courseOffering.findMany({
      where: {
        teacherId: { not: null }
      },
      include: {
        course: true,
        teacher: {
          include: {
            user: true
          }
        },
        sections: true,
        academic_years: true
      },
      take: 5
    });

    // Check what the frontend API returns for course management
    const courseManagementData = await prisma.course.findMany({
      include: {
        department: true,
        courseOfferings: {
          include: {
            teacher: {
              include: {
                user: true
              }
            },
            sections: true,
            academic_years: true
          }
        }
      },
      take: 3
    });

    res.json({
      success: true,
      data: {
        sampleOfferingsWithTeachers: sampleOfferings.map(offering => ({
          id: offering.id,
          courseCode: offering.course.code,
          courseName: offering.course.name,
          teacherId: offering.teacherId,
          teacherName: offering.teacher?.user?.name,
          sectionName: offering.sections?.section_name,
          academicYear: offering.academic_years?.year_name,
          semester: offering.semester
        })),
        courseManagementStructure: courseManagementData.map(course => ({
          courseId: course.id,
          courseCode: course.code,
          courseName: course.name,
          offerings: course.courseOfferings.map(offering => ({
            offeringId: offering.id,
            teacherId: offering.teacherId,
            teacherName: offering.teacher?.user?.name,
            sectionName: offering.sections?.section_name,
            semester: offering.semester
          }))
        }))
      }
    });
  } catch (error) {
    console.error('Error in UI teacher issue debug:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Debug endpoint to check user year distribution
router.get('/debug/user-year-distribution', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    
    // Get all users - using basic query since schema may not have role/currentYear
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    // Get students with more detailed information
    const students = await prisma.student.findMany({
      include: {
        departments: {
          select: {
            code: true,
            name: true
          }
        }
      }
    });
    
    // Get teachers for comparison
    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });
    
    // Group students by year and semester
    const studentsByYear = students.reduce((acc: any, student: any) => {
      const year = student.batchYear || 'Unknown';
      const semester = student.semester || 'Unknown';
      const key = `Year${year}_Sem${semester}`;
      if (!acc[key]) acc[key] = 0;
      acc[key]++;
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        totalUsers: users.length,
        totalStudents: students.length,
        totalTeachers: teachers.length,
        studentsByYear,
        sampleStudents: students.slice(0, 5).map(s => ({
          usn: s.usn,
          studentBatchYear: s.batchYear,
          studentSemester: s.semester,
          department: s.departments?.code
        }))
      }
    });
  } catch (error) {
    console.error('Error in user year distribution debug:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Debug endpoint to analyze the year mismatch problem
router.get('/debug/year-mismatch-analysis', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    
    // Get course offerings grouped by semester
    const courseOfferings = await prisma.courseOffering.findMany({
      include: {
        course: {
          select: {
            code: true,
            name: true
          }
        },
        sections: {
          select: {
            section_name: true
          }
        },
        academic_years: {
          select: {
            year_name: true
          }
        }
      }
    });
    
    // Parse section names to understand year structure
    const sectionAnalysis = courseOfferings.reduce((acc: any, offering: any) => {
      const sectionName = offering.sections?.section_name || 'No Section';
      const semester = offering.semester;
      const academicYear = offering.academic_years?.year_name;
      
      // Extract year from section name (e.g., NM_CSE_A2 -> 2, NM_CSE_A4 -> 4)
      const yearMatch = sectionName.match(/[A-Z](\d+)$/);
      const yearFromSection = yearMatch ? parseInt(yearMatch[1]) : null;
      
      const key = `Sem${semester}_SecYear${yearFromSection}_AcadYear${academicYear}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      
      acc[key].push({
        courseCode: offering.course?.code,
        sectionName,
        semester,
        academicYear,
        extractedYear: yearFromSection
      });
      
      return acc;
    }, {});
    
    // Get students and their year distribution
    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            currentYear: true
          }
        }
      }
    });
    
    const studentYearDistribution = students.reduce((acc: any, student: any) => {
      const userYear = student.user?.currentYear;
      const batchYear = student.batchYear;
      const semester = student.semester;
      
      const key = `UserYear${userYear}_BatchYear${batchYear}_Sem${semester}`;
      if (!acc[key]) acc[key] = 0;
      acc[key]++;
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        sectionAnalysis,
        studentYearDistribution,
        totalCourseOfferings: courseOfferings.length,
        totalStudents: students.length,
        recommendedFix: {
          description: "Students appear to be in different years than course offerings",
          suggestion: "Either update student years to match course years, or create course offerings for student years"
        }
      }
    });
  } catch (error) {
    console.error('Error in year mismatch analysis:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Endpoint to fix year mismatch by updating student years
router.post('/fix/update-student-years', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    
    // Get all students
    const students = await prisma.student.findMany({
      include: {
        user: true
      }
    });
    
    const updates = [];
    
    for (const student of students) {
      let newYear = null;
      
      // Map semester to year based on course offering pattern
      // Semester 3 -> 2nd year, Semester 7 -> 4th year
      if (student.semester === 3) {
        newYear = 2;
      } else if (student.semester === 7) {
        newYear = 4;
      } else if (student.semester === 1) {
        newYear = 1;
      } else if (student.semester === 5) {
        newYear = 3;
      }
      
      if (newYear && student.user.currentYear !== newYear) {
        await prisma.user.update({
          where: { id: student.user.id },
          data: { currentYear: newYear }
        });
        
        updates.push({
          userId: student.user.id,
          usn: student.usn,
          previousYear: student.user.currentYear,
          newYear: newYear,
          semester: student.semester
        });
      }
    }
    
    res.json({
      success: true,
      message: `Updated ${updates.length} student years`,
      data: {
        updates,
        totalStudentsProcessed: students.length
      }
    });
  } catch (error) {
    console.error('Error updating student years:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Endpoint to fix year mismatch by creating course offerings for student years
router.post('/fix/create-matching-course-offerings', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    
    // Get current student distribution
    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            currentYear: true
          }
        },
        departments: {
          select: {
            id: true,
            code: true
          }
        }
      }
    });
    
    // Get existing courses
    const courses = await prisma.course.findMany({
      include: {
        department: true
      }
    });
    
    // Get or create academic year
    let academicYear = await prisma.academic_years.findFirst({
      where: { year_name: '2024-25' }
    });
    
    if (!academicYear) {
      academicYear = await prisma.academic_years.create({
        data: {
          year_name: '2024-25',
          start_date: new Date('2024-08-01'),
          end_date: new Date('2025-07-31')
        }
      });
    }
    
    const newOfferings = [];
    
    // Group students by department and year
    const studentGroups = students.reduce((acc: any, student: any) => {
      const year = student.user?.currentYear;
      const deptId = student.departments?.id;
      const semester = student.semester;
      
      if (year && deptId) {
        const key = `dept${deptId}_year${year}_sem${semester}`;
        if (!acc[key]) acc[key] = {
          departmentId: deptId,
          year,
          semester,
          count: 0
        };
        acc[key].count++;
      }
      return acc;
    }, {});
    
    // Create course offerings for each student group
    for (const [groupKey, group] of Object.entries(studentGroups) as [string, any][]) {
      // Find courses for this department
      const deptCourses = courses.filter(c => c.department?.id === group.departmentId);
      
      for (const course of deptCourses) {
        // Check if offering already exists
        const existingOffering = await prisma.courseOffering.findFirst({
          where: {
            courseId: course.id,
            semester: group.semester,
            year_id: academicYear.year_id
          }
        });
        
        if (!existingOffering) {
          // Create section for this group
          const sectionName = `NM_${course.department?.code}_A${group.year}`;
          
          let section = await prisma.sections.findFirst({
            where: { section_name: sectionName }
          });
          
          if (!section) {
            section = await prisma.sections.create({
              data: {
                section_name: sectionName,
                departmentId: group.departmentId
              }
            });
          }
          
          // Create course offering
          const offering = await prisma.courseOffering.create({
            data: {
              courseId: course.id,
              semester: group.semester,
              year_id: academicYear.year_id,
              sectionId: section.id
            }
          });
          
          newOfferings.push({
            courseCode: course.code,
            courseName: course.name,
            semester: group.semester,
            sectionName: sectionName,
            studentCount: group.count,
            offeringId: offering.id
          });
        }
      }
    }
    
    res.json({
      success: true,
      message: `Created ${newOfferings.length} new course offerings`,
      data: {
        newOfferings,
        studentGroups: Object.values(studentGroups)
      }
    });
  } catch (error) {
    console.error('Error creating matching course offerings:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Simple endpoint to update student batch years to match available courses
router.post('/fix/align-student-years', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    
    // Get all students
    const students = await prisma.student.findMany();
    
    const updates = [];
    
    // Strategy: Map semester to expected year based on course offerings
    // Semester 3 -> 2nd year, Semester 7 -> 4th year
    for (const student of students) {
      let newBatchYear = null;
      
      if (student.semester === 3) {
        newBatchYear = 2; // 2nd year students take 3rd semester
      } else if (student.semester === 7) {
        newBatchYear = 4; // 4th year students take 7th semester
      } else if (student.semester === 1) {
        newBatchYear = 1;
      } else if (student.semester === 5) {
        newBatchYear = 3;
      }
      
      if (newBatchYear && student.batchYear !== newBatchYear) {
        await prisma.student.update({
          where: { id: student.id },
          data: { batchYear: newBatchYear }
        });
        
        updates.push({
          studentId: student.id,
          usn: student.usn,
          previousBatchYear: student.batchYear,
          newBatchYear: newBatchYear,
          semester: student.semester
        });
      }
    }
    
    res.json({
      success: true,
      message: `Updated ${updates.length} student batch years to align with course offerings`,
      data: {
        updates,
        totalStudentsProcessed: students.length,
        explanation: "Students in semester 3 are now year 2, students in semester 7 are now year 4"
      }
    });
  } catch (error) {
    console.error('Error updating student batch years:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
