// src/routes/analytics.ts
import { Router } from 'express';
import DatabaseService from '../lib/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

console.log('=== ANALYTICS ROUTES LOADED ===');

// Get overview statistics
router.get('/overview/:studyYear?', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const studyYear = parseInt(req.params.studyYear || '3'); // Default to 3rd year
    const collegeId = req.query.collegeId as string | undefined;
    const prisma = DatabaseService.getInstance();

    // Calculate semester range for the study year
    // Year 1: Sem 1-2, Year 2: Sem 3-4, Year 3: Sem 5-6, Year 4: Sem 7-8
    const semesterStart = (studyYear - 1) * 2 + 1;
    const semesterEnd = studyYear * 2;

    // Build student filter
    const studentFilter: any = {
      semester: {
        gte: semesterStart,
        lte: semesterEnd
      }
    };

    // Add college filter if provided
    if (collegeId) {
      studentFilter.college_id = collegeId;
    }

    // Get students in this year of study
    const studentsInYear = await prisma.student.findMany({
      where: studentFilter,
      select: {
        id: true
      }
    });

    const studentIds = studentsInYear.map(s => s.id);
    const totalStudents = studentIds.length;

    // Build filters for college-specific counts
    const departmentFilter: any = {};
    if (collegeId) {
      departmentFilter.college_id = collegeId;
    }

    // Get departments in this college (if filtered)
    const departments = await prisma.department.findMany({
      where: departmentFilter,
      select: { id: true }
    });
    const departmentIds = departments.map(d => d.id);

    // Build course filter based on departments
    const courseFilter: any = {};
    if (collegeId && departmentIds.length > 0) {
      courseFilter.departmentId = { in: departmentIds };
    }

    // Get counts - courses filtered by college, others global or filtered
    const [
      totalTeachers,
      totalCourses,
      totalSections,
      totalDepartments,
      totalAttendanceSessions
    ] = await Promise.all([
      prisma.teacher.count(),
      prisma.course.count({ where: courseFilter }),
      prisma.sections.count(),
      collegeId ? Promise.resolve(departmentIds.length) : prisma.department.count(),
      prisma.attendance.count()
    ]);

    // Calculate attendance percentage from attendance records
    const attendanceRecords = await prisma.attendanceRecord.findMany();
    const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
    const totalRecords = attendanceRecords.length;
    const averageAttendance = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

    // Get theory and lab marks for average calculation
    const theoryMarks = await prisma.theoryMarks.findMany();
    const labMarks = await prisma.labMarks.findMany();

    let totalScore = 0;
    let markCount = 0;
    let passedStudents = 0;

    // Process theory marks
    theoryMarks.forEach(marks => {
      const totalMarks = (marks.mse1Marks || 0) + (marks.mse2Marks || 0) + (marks.mse3Marks || 0) +
        (marks.task1Marks || 0) + (marks.task2Marks || 0) + (marks.task3Marks || 0);
      totalScore += totalMarks;
      markCount++;
      if (totalMarks >= 30) passedStudents++; // Adjusted pass threshold based on actual data scale
    });

    // Process lab marks
    labMarks.forEach(marks => {
      const totalMarks = (marks.recordMarks || 0) + (marks.continuousEvaluationMarks || 0) + (marks.labMseMarks || 0);
      totalScore += totalMarks;
      markCount++;
      if (totalMarks >= 30) passedStudents++; // Adjusted pass threshold
    });

    // Calculate real low attendance students
    let lowAttendanceStudents = 0;
    const studentAttendanceMap = new Map();

    // Calculate attendance per student
    attendanceRecords.forEach(record => {
      if (record.studentId) {
        if (!studentAttendanceMap.has(record.studentId)) {
          studentAttendanceMap.set(record.studentId, { total: 0, present: 0 });
        }
        const studentData = studentAttendanceMap.get(record.studentId);
        studentData.total++;
        if (record.status === 'present') {
          studentData.present++;
        }
      }
    });

    // Count students with less than 75% attendance
    studentAttendanceMap.forEach((data, studentId) => {
      const studentAttendance = (data.present / data.total) * 100;
      if (studentAttendance < 75) {
        lowAttendanceStudents++;
      }
    });

    const averageMarks = markCount > 0 ? (totalScore / markCount) : 0;
    const passRate = markCount > 0 ? (passedStudents / markCount) * 100 : 0;

    res.json({
      status: 'success',
      data: {
        studyYear,
        totalStudents,
        totalCourses,
        totalSections,
        averageAttendance: parseFloat(averageAttendance.toFixed(1)),
        averageMarks: parseFloat(averageMarks.toFixed(1)),
        passRate: parseFloat(passRate.toFixed(1)),
        lowAttendanceStudents,
        totalAttendanceSessions,
        totalTeachers,
        totalDepartments
      }
    });

  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch overview statistics'
    });
  }
});

// Get department-wise attendance analytics
router.get('/attendance/:studyYear?', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const studyYear = parseInt(req.params.studyYear || '3'); // Default to 3rd year
    const collegeId = req.query.collegeId as string | undefined;
    const prisma = DatabaseService.getInstance();

    // Calculate semester range for the study year
    const semesterStart = (studyYear - 1) * 2 + 1;
    const semesterEnd = studyYear * 2;

    // Build department filter
    const departmentFilter: any = {};
    if (collegeId) {
      departmentFilter.college_id = collegeId;
    }

    // Get departments with their sections, students, and actual course offerings
    // Filter students by semester range
    const departments = await prisma.department.findMany({
      where: departmentFilter,
      include: {
        sections: {
          include: {
            students: {
              where: {
                semester: {
                  gte: semesterStart,
                  lte: semesterEnd
                }
              },
              include: {
                user: true
              }
            },
            course_offerings: {
              include: {
                course: true,
                sections: true,
                enrollments: {
                  where: {
                    student: {
                      semester: {
                        gte: semesterStart,
                        lte: semesterEnd
                      }
                    }
                  },
                  include: {
                    student: {
                      include: {
                        user: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const departmentAnalytics = await Promise.all(departments.map(async dept => {
      // Calculate unique students across all sections in this department
      const departmentUniqueStudentIds = new Set();

      // Calculate real department attendance
      let deptTotalRecords = 0;
      let deptPresentRecords = 0;

      // Collect all offerings from all sections
      const allOfferings = dept.sections.flatMap(section => section.course_offerings);

      // Group offerings by course code
      const courseMap = new Map();

      for (const offering of allOfferings) {
        const courseKey = offering.course.code;

        if (!courseMap.has(courseKey)) {
          courseMap.set(courseKey, {
            code: offering.course.code,
            name: offering.course.name,
            sections: []
          });
        }

        // Get attendance records for this offering
        const attendanceRecords = await prisma.attendanceRecord.findMany({
          where: {
            attendance: {
              offeringId: offering.id
            }
          }
        });

        const coursePresentRecords = attendanceRecords.filter(record => record.status === 'present').length;
        const courseTotalRecords = attendanceRecords.length;
        const courseAttendance = courseTotalRecords > 0 ? (coursePresentRecords / courseTotalRecords) * 100 : 0;

        // Add to department totals
        deptTotalRecords += courseTotalRecords;
        deptPresentRecords += coursePresentRecords;

        // Get students for this section offering
        const students = await Promise.all(offering.enrollments.map(async enrollment => {
          if (!enrollment.student) return null;

          departmentUniqueStudentIds.add(enrollment.student.id);

          // Calculate individual student attendance for this course
          const studentAttendanceRecords = await prisma.attendanceRecord.findMany({
            where: {
              studentId: enrollment.student.id,
              attendance: {
                offeringId: offering.id
              }
            }
          });

          const studentPresentCount = studentAttendanceRecords.filter(record => record.status === 'present').length;
          const studentTotalCount = studentAttendanceRecords.length;
          const studentAttendancePercent = studentTotalCount > 0 ? (studentPresentCount / studentTotalCount) * 100 : 0;

          return {
            id: enrollment.student.id,
            name: enrollment.student.user?.name,
            usn: enrollment.student.usn,
            semester: enrollment.student.semester,
            attendancePercent: parseFloat(studentAttendancePercent.toFixed(1))
          };
        })).then(results => results.filter(student => student !== null));

        // Add section data to the course
        courseMap.get(courseKey).sections.push({
          section: offering.sections?.section_name || 'N/A',
          attendance: parseFloat(courseAttendance.toFixed(1)),
          students: students.length,
          enrolledStudents: students
        });
      }

      // Convert courseMap to array
      const courseAnalytics = Array.from(courseMap.values()).map(course => {
        // Calculate overall course attendance across all sections
        const totalAttendance = course.sections.reduce((sum: number, sec: any) => sum + (sec.attendance || 0), 0);
        const avgAttendance = course.sections.length > 0 ? totalAttendance / course.sections.length : 0;
        const totalStudents = course.sections.reduce((sum: number, sec: any) => sum + sec.students, 0);

        // Sort sections alphabetically
        const sortedSections = course.sections.sort((a: any, b: any) => {
          return a.section.localeCompare(b.section);
        });

        return {
          code: course.code,
          name: course.name,
          attendance: parseFloat(avgAttendance.toFixed(1)),
          students: totalStudents,
          sections: sortedSections
        };
      });

      // Calculate department attendance
      const deptAttendance = deptTotalRecords > 0 ? (deptPresentRecords / deptTotalRecords) * 100 : 0;

      return {
        name: dept.name,
        code: dept.code || 'XXX',
        attendance: parseFloat(deptAttendance.toFixed(1)),
        students: departmentUniqueStudentIds.size,
        courses: courseAnalytics
      };
    }));

    res.json({
      status: 'success',
      data: {
        studyYear,
        departments: departmentAnalytics
      }
    });

  } catch (error) {
    console.error('Department attendance analytics error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch attendance analytics'
    });
  }
});

// Get department-wise marks analytics
router.get('/marks/:studyYear?', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const studyYear = parseInt(req.params.studyYear || '3'); // Default to 3rd year
    const collegeId = req.query.collegeId as string | undefined;
    const prisma = DatabaseService.getInstance();

    // Calculate semester range for the study year
    const semesterStart = (studyYear - 1) * 2 + 1;
    const semesterEnd = studyYear * 2;

    // Build department filter
    const departmentFilter: any = {};
    if (collegeId) {
      departmentFilter.college_id = collegeId;
    }

    // Get departments with their sections, students, and actual course offerings
    // Filter students by semester range
    const departments = await prisma.department.findMany({
      where: departmentFilter,
      include: {
        sections: {
          include: {
            students: {
              where: {
                semester: {
                  gte: semesterStart,
                  lte: semesterEnd
                }
              },
              include: {
                user: true
              }
            },
            course_offerings: {
              include: {
                course: true,
                enrollments: {
                  where: {
                    student: {
                      semester: {
                        gte: semesterStart,
                        lte: semesterEnd
                      }
                    }
                  },
                  include: {
                    student: {
                      include: {
                        user: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const departmentAnalytics = await Promise.all(departments.map(async dept => {
      // Calculate unique students across all sections in this department
      const departmentUniqueStudentIds = new Set();

      // Calculate real department marks
      let deptTotalMarks = 0;
      let deptMarkCount = 0;
      let deptPassedStudents = 0;

      const sectionAnalytics = await Promise.all(dept.sections.map(async section => {
        let sectionTotalMarks = 0;
        let sectionMarkCount = 0;
        let sectionPassedStudents = 0;

        // Get actual courses for this section with real marks data
        const actualCourses = await Promise.all(section.course_offerings.map(async offering => {
          // Get real theory marks for this course offering
          const theoryMarks = await prisma.theoryMarks.findMany({
            where: {
              enrollment: {
                offeringId: offering.id
              }
            }
          });

          // Get real lab marks for this course offering
          const labMarks = await prisma.labMarks.findMany({
            where: {
              enrollment: {
                offeringId: offering.id
              }
            }
          });

          // Calculate course averages
          let courseTotalMarks = 0;
          let courseMarkCount = 0;
          let coursePassed = 0;

          // Process theory marks
          theoryMarks.forEach(mark => {
            const theoryTotal = (mark.mse1Marks || 0) + (mark.mse2Marks || 0) + (mark.mse3Marks || 0) +
              (mark.task1Marks || 0) + (mark.task2Marks || 0) + (mark.task3Marks || 0);
            courseTotalMarks += theoryTotal;
            courseMarkCount++;
            if (theoryTotal >= 30) coursePassed++; // Adjusted pass threshold
          });

          // Process lab marks
          labMarks.forEach(mark => {
            const labTotal = (mark.recordMarks || 0) + (mark.continuousEvaluationMarks || 0) + (mark.labMseMarks || 0);
            courseTotalMarks += labTotal;
            courseMarkCount++;
            if (labTotal >= 30) coursePassed++; // Adjusted pass threshold
          });

          const courseAvgMarks = courseMarkCount > 0 ? courseTotalMarks / courseMarkCount : 0;
          const coursePassRate = courseMarkCount > 0 ? (coursePassed / courseMarkCount) * 100 : 0;
          const courseFailRate = 100 - coursePassRate;

          // Add to section totals
          sectionTotalMarks += courseTotalMarks;
          sectionMarkCount += courseMarkCount;
          sectionPassedStudents += coursePassed;

          return {
            name: offering.course.name,
            code: offering.course.code,
            avgMarks: parseFloat(courseAvgMarks.toFixed(1)),
            passRate: parseFloat(coursePassRate.toFixed(1)),
            failRate: parseFloat(courseFailRate.toFixed(1)),
            enrollments: offering.enrollments.length,
            students: await Promise.all(offering.enrollments.map(async enrollment => {
              if (!enrollment.student) return null;

              // Get student's marks for this course
              const theoryMark = theoryMarks.find(mark => mark.enrollmentId === enrollment.id);
              const labMark = labMarks.find(mark => mark.enrollmentId === enrollment.id);

              // Calculate total marks
              let theoryTotal = 0;
              if (theoryMark) {
                theoryTotal = (theoryMark.mse1Marks || 0) + (theoryMark.mse2Marks || 0) + (theoryMark.mse3Marks || 0) +
                  (theoryMark.task1Marks || 0) + (theoryMark.task2Marks || 0) + (theoryMark.task3Marks || 0);
              }

              let labTotal = 0;
              if (labMark) {
                labTotal = (labMark.recordMarks || 0) + (labMark.continuousEvaluationMarks || 0) + (labMark.labMseMarks || 0);
              }

              const totalMarks = theoryTotal + labTotal;

              return {
                id: enrollment.student.id,
                name: enrollment.student.user?.name,
                usn: enrollment.student.usn,
                semester: enrollment.student.semester,
                theoryMarks: theoryTotal,
                labMarks: labTotal,
                totalMarks: totalMarks
              };
            })).then(results => results.filter(student => student !== null))
          };
        }));

        // Calculate section averages
        const sectionAvgMarks = sectionMarkCount > 0 ? sectionTotalMarks / sectionMarkCount : 0;
        const sectionPassRate = sectionMarkCount > 0 ? (sectionPassedStudents / sectionMarkCount) * 100 : 0;

        // Add to department totals
        deptTotalMarks += sectionTotalMarks;
        deptMarkCount += sectionMarkCount;
        deptPassedStudents += sectionPassedStudents;

        // Calculate unique students enrolled in this section's courses
        const uniqueStudentIds = new Set();
        section.course_offerings.forEach(offering => {
          offering.enrollments.forEach(enrollment => {
            if (enrollment.student?.id) {
              uniqueStudentIds.add(enrollment.student.id);
              departmentUniqueStudentIds.add(enrollment.student.id); // Add to department set
            }
          });
        });
        const sectionEnrolledStudents = uniqueStudentIds.size;

        return {
          section: section.section_name,
          avgMarks: parseFloat(sectionAvgMarks.toFixed(1)),
          passRate: parseFloat(sectionPassRate.toFixed(1)),
          students: sectionEnrolledStudents, // Use actual unique students instead of total enrollments
          courses: actualCourses.length,
          courseStats: actualCourses.length > 0 ? actualCourses : [
            {
              name: 'No Courses Available',
              code: 'N/A',
              avgMarks: 0,
              passRate: 0,
              failRate: 0,
              enrollments: 0,
              students: []
            }
          ]
        };
      }));

      // Calculate department averages
      const deptAvgMarks = deptMarkCount > 0 ? deptTotalMarks / deptMarkCount : 0;
      const deptPassRate = deptMarkCount > 0 ? (deptPassedStudents / deptMarkCount) * 100 : 0;

      return {
        name: dept.name,
        code: dept.code || 'XXX',
        avgMarks: parseFloat(deptAvgMarks.toFixed(1)),
        passRate: parseFloat(deptPassRate.toFixed(1)),
        students: departmentUniqueStudentIds.size,
        sections: sectionAnalytics
      };
    }));

    res.json({
      status: 'success',
      data: {
        studyYear,
        departments: departmentAnalytics
      }
    });

  } catch (error) {
    console.error('Department marks analytics error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch marks analytics'
    });
  }
});

// Get available academic years
router.get('/academic-years', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const prisma = DatabaseService.getInstance();

    // Get only active academic years
    const academicYears = await prisma.academic_years.findMany({
      where: {
        is_active: true
      },
      orderBy: { year_name: 'desc' }
    });

    // Remove duplicates (same year from different colleges) and get unique year names
    const uniqueYears = [...new Set(academicYears.map(year => year.year_name))];

    // If no years in DB, return default years
    const years = uniqueYears.length > 0
      ? uniqueYears
      : ['2025-26', '2024-25', '2023-24', '2022-23'];

    res.json({
      status: 'success',
      data: years
    });

  } catch (error) {
    console.error('Academic years error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch academic years'
    });
  }
});

// Get available colleges
router.get('/colleges', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const prisma = DatabaseService.getInstance();

    const colleges = await prisma.college.findMany({
      select: {
        id: true,
        name: true,
        code: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      status: 'success',
      data: colleges
    });

  } catch (error) {
    console.error('Colleges error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch colleges'
    });
  }
});

module.exports = router;
export default router;
