// Admin enrollment management routes
import { Router } from 'express';
import Database from '../../lib/database';
import { 
  autoEnrollStudentForSemester, 
  autoEnrollFirstYearStudent, 
  getAvailableCoursesForSemester,
  getCoursesBySemester,
  promoteStudentToNextSemester
} from '../../services/autoEnrollmentService';

const router = Router();

// Get courses available for a specific semester in a department
router.get('/courses/semester', async (req, res) => {
  try {
    const { collegeId, departmentId, semester, academicYearId } = req.query;

    if (!collegeId || !departmentId || !semester) {
      return res.status(400).json({
        status: 'error',
        error: 'College ID, Department ID, and Semester are required',
        timestamp: new Date().toISOString()
      });
    }

    const courses = await getAvailableCoursesForSemester(
      collegeId as string,
      departmentId as string,
      parseInt(semester as string),
      academicYearId as string
    );

    res.json({
      status: 'success',
      data: {
        semester: parseInt(semester as string),
        courses: courses,
        totalCourses: courses.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting courses for semester:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get all courses grouped by semester for a department
router.get('/courses/by-semester', async (req, res) => {
  try {
    const { collegeId, departmentId, academicYearId } = req.query;

    if (!collegeId || !departmentId) {
      return res.status(400).json({
        status: 'error',
        error: 'College ID and Department ID are required',
        timestamp: new Date().toISOString()
      });
    }

    const coursesBySemester = await getCoursesBySemester(
      collegeId as string,
      departmentId as string,
      academicYearId as string
    );

    // Calculate summary statistics
    const semesterSummary = Object.keys(coursesBySemester).map(semester => ({
      semester: parseInt(semester),
      courseCount: coursesBySemester[parseInt(semester)].length,
      courses: coursesBySemester[parseInt(semester)].map((offering: any) => ({
        code: offering.course.code,
        name: offering.course.name,
        hasTheory: offering.course.hasTheoryComponent,
        hasLab: offering.course.hasLabComponent,
        teacher: offering.teacher?.user?.name || 'Not assigned',
        section: offering.sections?.section_name || 'Not assigned'
      }))
    })).sort((a, b) => a.semester - b.semester);

    res.json({
      status: 'success',
      data: {
        coursesBySemester,
        summary: semesterSummary,
        totalSemesters: Object.keys(coursesBySemester).length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting courses by semester:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Enroll a student in courses for a specific semester
router.post('/students/:studentId/enroll/semester/:semester', async (req, res) => {
  try {
    const { studentId, semester } = req.params;

    if (!studentId || !semester) {
      return res.status(400).json({
        status: 'error',
        error: 'Student ID and Semester are required',
        timestamp: new Date().toISOString()
      });
    }

    const enrollmentResult = await autoEnrollStudentForSemester(studentId, parseInt(semester));

    const statusCode = enrollmentResult.success ? 200 : 400;

    res.status(statusCode).json({
      status: enrollmentResult.success ? 'success' : 'error',
      data: enrollmentResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error enrolling student:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Enroll a first-year student in semester 1 courses
router.post('/students/:studentId/enroll/first-year', async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({
        status: 'error',
        error: 'Student ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const enrollmentResult = await autoEnrollFirstYearStudent(studentId);

    const statusCode = enrollmentResult.success ? 200 : 400;

    res.status(statusCode).json({
      status: enrollmentResult.success ? 'success' : 'error',
      data: enrollmentResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error enrolling first-year student:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Promote a student to the next semester
router.post('/students/:studentId/promote', async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({
        status: 'error',
        error: 'Student ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const promotionResult = await promoteStudentToNextSemester(studentId);

    const statusCode = promotionResult.success ? 200 : 400;

    res.status(statusCode).json({
      status: promotionResult.success ? 'success' : 'error',
      data: promotionResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error promoting student:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Bulk enroll students in a specific semester
router.post('/students/bulk-enroll/semester/:semester', async (req, res) => {
  try {
    const { semester } = req.params;
    const { studentIds, departmentId, collegeId } = req.body;

    if (!semester || (!studentIds && !departmentId)) {
      return res.status(400).json({
        status: 'error',
        error: 'Semester and either Student IDs or Department ID are required',
        timestamp: new Date().toISOString()
      });
    }

    const prisma = Database.getInstance();
    let targetStudentIds = studentIds;

    // If department ID is provided, get all students from that department
    if (departmentId && !studentIds) {
      const students = await prisma.student.findMany({
        where: {
          department_id: departmentId,
          ...(collegeId ? { college_id: collegeId } : {}),
          semester: parseInt(semester) // Only students in the target semester
        }
      });
      targetStudentIds = students.map((student: any) => student.id);
    }

    if (!targetStudentIds || targetStudentIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        error: 'No students found to enroll',
        timestamp: new Date().toISOString()
      });
    }

    // Enroll each student
    const enrollmentResults = await Promise.all(
      targetStudentIds.map((studentId: string) => 
        autoEnrollStudentForSemester(studentId, parseInt(semester))
      )
    );

    const successfulEnrollments = enrollmentResults.filter(result => result.success);
    const failedEnrollments = enrollmentResults.filter(result => !result.success);

    res.json({
      status: 'success',
      data: {
        totalStudents: targetStudentIds.length,
        successfulEnrollments: successfulEnrollments.length,
        failedEnrollments: failedEnrollments.length,
        totalEnrollmentsCreated: successfulEnrollments.reduce((sum, result) => sum + result.enrollmentsCreated, 0),
        results: enrollmentResults
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error bulk enrolling students:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
