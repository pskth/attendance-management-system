// src/routes/analytics.ts
import { Router } from 'express';
import DatabaseService from '../lib/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

console.log('=== ANALYTICS ROUTES LOADED ===');

// Get overview statistics
router.get('/overview/:academicYear?', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const academicYear = req.params.academicYear || '2024-25';
    const prisma = DatabaseService.getInstance();

    // Get basic counts
    const [
      totalStudents,
      totalTeachers,
      totalCourses,
      totalSections,
      totalDepartments,
      totalAttendanceSessions
    ] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.course.count(),
      prisma.sections.count(),
      prisma.department.count(),
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
        academicYear,
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
router.get('/attendance/:academicYear?', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const academicYear = req.params.academicYear || '2024-25';
    const prisma = DatabaseService.getInstance();

    // Get departments with their sections, students, and actual course offerings
    const departments = await prisma.department.findMany({
      include: {
        sections: {
          include: {
            students: {
              include: {
                user: true
              }
            },
            course_offerings: {
              include: {
                course: true,
                enrollments: {
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

      const sectionAnalytics = await Promise.all(dept.sections.map(async section => {
        let sectionTotalRecords = 0;
        let sectionPresentRecords = 0;

        // Get actual courses for this section with real attendance data
        const actualCourses = await Promise.all(section.course_offerings.map(async offering => {
          // Get real attendance records for this course offering
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

          // Add to section totals
          sectionTotalRecords += courseTotalRecords;
          sectionPresentRecords += coursePresentRecords;

          return {
            name: offering.course.name,
            code: offering.course.code,
            attendance: parseFloat(courseAttendance.toFixed(1)),
            enrollments: offering.enrollments.length,
            students: await Promise.all(offering.enrollments.map(async enrollment => {
              if (!enrollment.student) return null;

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
            })).then(results => results.filter(student => student !== null))
          };
        }));

        // Calculate section attendance
        const sectionAttendance = sectionTotalRecords > 0 ? (sectionPresentRecords / sectionTotalRecords) * 100 : 0;

        // Add to department totals
        deptTotalRecords += sectionTotalRecords;
        deptPresentRecords += sectionPresentRecords;

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
          attendance: parseFloat(sectionAttendance.toFixed(1)),
          students: sectionEnrolledStudents, // Use actual unique students instead of total enrollments
          courses: actualCourses.length,
          courseStats: actualCourses.length > 0 ? actualCourses : [
            { name: 'No Courses Available', code: 'N/A', attendance: 0, enrollments: 0, students: [] }
          ]
        };
      }));

      // Calculate department attendance
      const deptAttendance = deptTotalRecords > 0 ? (deptPresentRecords / deptTotalRecords) * 100 : 0;

      return {
        name: dept.name,
        code: dept.code || 'XXX',
        attendance: parseFloat(deptAttendance.toFixed(1)),
        students: departmentUniqueStudentIds.size,
        sections: sectionAnalytics
      };
    }));

    res.json({
      status: 'success',
      data: {
        academicYear,
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
router.get('/marks/:academicYear?', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const academicYear = req.params.academicYear || '2024-25';
    const prisma = DatabaseService.getInstance();

    // Get departments with their sections, students, and actual course offerings
    const departments = await prisma.department.findMany({
      include: {
        sections: {
          include: {
            students: {
              include: {
                user: true
              }
            },
            course_offerings: {
              include: {
                course: true,
                enrollments: {
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
        academicYear,
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

    const academicYears = await prisma.academic_years.findMany({
      orderBy: { year_name: 'desc' }
    });

    // If no years in DB, return default years
    const years = academicYears.length > 0
      ? academicYears.map(year => year.year_name)
      : ['2024-25', '2023-24', '2022-23', '2021-22'];

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

module.exports = router;
export default router;
