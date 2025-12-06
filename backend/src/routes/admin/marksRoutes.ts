// src/routes/admin/marksRoutes.ts
/**
 * Marks management routes for admins and teachers
 * Handles CRUD operations for theory and lab marks
 */
import { Router } from 'express';
import DatabaseService from '../../lib/database';
import { GetMarksParams, UpdateMarksRequest } from '../../types/marks.types';
import { ApiResponse } from '../../types/common.types';
import {
  hasTheoryMarksUpdate,
  hasLabMarksUpdate,
  buildTheoryMarksData,
  buildLabMarksData,
  transformToMarksData,
  buildMarksWhereClause
} from '../../utils/marks.helpers';

const router = Router();

console.log('=== ADMIN MARKS ROUTES LOADED ===');

/**
 * TODO: MARKS SYSTEM MIGRATION REQUIRED
 * 
 * The database schema has been updated from separate theoryMarks and labMarks tables
 * to a unified StudentMark/TestComponent system for flexible assessment tracking.
 * 
 * Old System: theoryMarks table (mse1Marks, mse2Marks, etc.) + labMarks table
 * New System: StudentMark + TestComponent (flexible test names, types, weightage)
 * 
 * All marks-related endpoints below need to be rewritten to use:
 * - prisma.studentMark for individual marks
 * - prisma.testComponent for test definitions
 * 
 * Until migration is complete, these endpoints return 501 Not Implemented.
 */

// Get all marks for students with flexible test components
router.get('/marks', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    const { courseId, departmentId, year, studentId, studentUsn } = req.query;

    let whereClause: any = {};

    // Handle student filtering by either UUID or USN
    if (studentId || studentUsn) {
      if (studentUsn) {
        whereClause.student = {
          usn: studentUsn as string
        };
      } else if (studentId) {
        whereClause.studentId = studentId as string;
      }
    }

    if (courseId) {
      whereClause.offering = {
        courseId: courseId as string
      };
    }

    if (departmentId || year) {
      if (!whereClause.student) {
        whereClause.student = {};
      }
      if (departmentId) {
        whereClause.student.department_id = departmentId as string;
      }
      if (year) {
        whereClause.student.batchYear = parseInt(year as string);
      }
    }

    const enrollments = await prisma.studentEnrollment.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: { select: { name: true } }
          }
        },
        offering: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true
              }
            },
            testComponents: true
          }
        },
        studentMarks: {
          include: {
            testComponent: true
          }
        }
      }
    });

    const marksData = enrollments.map(enrollment => {
      // Group marks by test type
      const theoryMarks: any[] = [];
      const labMarks: any[] = [];
      let theoryTotal = 0;
      let labTotal = 0;

      enrollment.studentMarks.forEach(mark => {
        const markData = {
          id: mark.id,
          testComponentId: mark.testComponentId,
          testName: mark.testComponent.name,
          maxMarks: mark.testComponent.maxMarks,
          marksObtained: mark.marksObtained,
          weightage: mark.testComponent.weightage
        };

        if (mark.testComponent.type === 'theory') {
          theoryMarks.push(markData);
          theoryTotal += mark.marksObtained || 0;
        } else if (mark.testComponent.type === 'lab') {
          labMarks.push(markData);
          labTotal += mark.marksObtained || 0;
        }
      });

      return {
        id: enrollment.id,
        enrollmentId: enrollment.id,
        student: enrollment.student ? {
          id: enrollment.student.id,
          usn: enrollment.student.usn,
          user: {
            name: enrollment.student.user.name
          }
        } : null,
        course: enrollment.offering?.course || null,
        testComponents: enrollment.offering?.testComponents || [],
        theoryMarks,
        labMarks,
        theoryTotal,
        labTotal,
        grandTotal: theoryTotal + labTotal
      };
    });

    res.json({
      status: 'success',
      data: marksData
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching marks:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

/**
 * GET /marks/:enrollmentId
 * Retrieves marks for a specific enrollment
 */
router.get('/marks/:enrollmentId', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    const { enrollmentId } = req.params;

    const enrollment = await prisma.studentEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: {
          include: {
            user: { select: { name: true } }
          }
        },
        offering: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true
              }
            },
            testComponents: true
          }
        },
        studentMarks: {
          include: {
            testComponent: true
          }
        }
      }
    });

    if (!enrollment) {
      return res.status(404).json({
        status: 'error',
        error: 'Enrollment not found'
      });
      return;
    }

    // Group marks by test type
    const theoryMarks: any[] = [];
    const labMarks: any[] = [];
    let theoryTotal = 0;
    let labTotal = 0;

    enrollment.studentMarks.forEach(mark => {
      const markData = {
        id: mark.id,
        testComponentId: mark.testComponentId,
        testName: mark.testComponent.name,
        maxMarks: mark.testComponent.maxMarks,
        marksObtained: mark.marksObtained,
        weightage: mark.testComponent.weightage
      };

      if (mark.testComponent.type === 'theory') {
        theoryMarks.push(markData);
        theoryTotal += mark.marksObtained || 0;
      } else if (mark.testComponent.type === 'lab') {
        labMarks.push(markData);
        labTotal += mark.marksObtained || 0;
      }
    });

    const marksData = {
      id: enrollment.id,
      enrollmentId: enrollment.id,
      student: enrollment.student ? {
        id: enrollment.student.id,
        usn: enrollment.student.usn,
        user: {
          name: enrollment.student.user.name
        }
      } : null,
      course: enrollment.offering?.course || null,
      testComponents: enrollment.offering?.testComponents || [],
      theoryMarks,
      labMarks,
      theoryTotal,
      labTotal,
      grandTotal: theoryTotal + labTotal
    };

    res.json({
      status: 'success',
      data: marksData
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching enrollment marks:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

// Update marks for a specific enrollment
// Body should contain: { marks: [{ testComponentId: string, marksObtained: number }] }
router.put('/marks/:enrollmentId', async (req, res) => {
  const { enrollmentId } = req.params;
  const { marks } = req.body;

  try {
    const prisma = DatabaseService.getInstance();

    // Check if enrollment exists
    const enrollment = await prisma.studentEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        offering: {
          include: {
            testComponents: true
          }
        }
      }
    });

    if (!enrollment) {
      return res.status(404).json({
        status: 'error',
        error: 'Enrollment not found'
      } as ApiResponse);
    }

    if (!marks || !Array.isArray(marks)) {
      res.status(400).json({
        status: 'error',
        error: 'Invalid marks data. Expected array of { testComponentId, marksObtained }'
      });
      return;
    }

    // Validate all test components belong to this offering
    const validComponentIds = enrollment.offering?.testComponents.map(tc => tc.id) || [];
    const invalidComponents = marks.filter(m => !validComponentIds.includes(m.testComponentId));

    if (invalidComponents.length > 0) {
      res.status(400).json({
        status: 'error',
        error: 'Invalid test component IDs',
        invalidComponents: invalidComponents.map(m => m.testComponentId)
      });
      return;
    }

    // Update or create marks
    const updatePromises = marks.map(async (mark) => {
      const testComponent = enrollment.offering?.testComponents.find(tc => tc.id === mark.testComponentId);

      // Validate marks don't exceed max
      if (mark.marksObtained > (testComponent?.maxMarks || 0)) {
        throw new Error(`Marks obtained (${mark.marksObtained}) exceed max marks (${testComponent?.maxMarks}) for ${testComponent?.name}`);
      }

      return prisma.studentMark.upsert({
        where: {
          enrollmentId_testComponentId: {
            enrollmentId,
            testComponentId: mark.testComponentId
          }
        },
        update: {
          marksObtained: mark.marksObtained
        },
        create: {
          enrollmentId,
          testComponentId: mark.testComponentId,
          marksObtained: mark.marksObtained
        }
      });
    });

    await Promise.all(updatePromises);

    res.json({
      status: 'success',
      message: 'Marks updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error updating marks:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get test components for a course offering (teacher + course)
router.get('/course/:courseId/teacher/:teacherId/components', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    const { courseId, teacherId } = req.params;

    // Find course offering for this teacher & course
    const offering = await prisma.courseOffering.findFirst({
      where: {
        courseId,
        teacherId
      },
      include: {
        testComponents: true
      }
    });

    if (!offering) {
      return res.status(404).json({
        status: 'error',
        error: 'Course offering not found for this teacher/course'
      });
    }

    // Map test components into table-usable structure
    const components = offering.testComponents.map(tc => ({
      id: tc.id,
      name: tc.name,
      maxMarks: tc.maxMarks,
      weightage: tc.weightage,
      type: tc.type
    }));

    res.json({
      status: 'success',
      offeringId: offering.id,
      courseId: offering.courseId,
      teacherId: offering.teacherId,
      components
    });
  } catch (error) {
    console.error('Error fetching test components:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get test components for a specific course offering by ID
router.get('/offerings/:offeringId/components', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    const { offeringId } = req.params;

    const offering = await prisma.courseOffering.findUnique({
      where: { id: offeringId },
      include: {
        testComponents: true,
        course: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      }
    });

    if (!offering) {
      return res.status(404).json({
        status: 'error',
        error: 'Course offering not found'
      });
    }

    res.json({
      status: 'success',
      offering: {
        id: offering.id,
        courseId: offering.courseId,
        course: offering.course,
        teacherId: offering.teacherId
      },
      components: offering.testComponents.map(tc => ({
        id: tc.id,
        name: tc.name,
        maxMarks: tc.maxMarks,
        weightage: tc.weightage,
        type: tc.type
      }))
    });
  } catch (error) {
    console.error('Error fetching test components:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create test components for a course offering
// Body: { components: [{ name: string, maxMarks: number, weightage: number, type: 'theory' | 'lab' }] }
router.post('/offerings/:offeringId/components', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    const { offeringId } = req.params;
    const { components } = req.body;

    if (!components || !Array.isArray(components)) {
      return res.status(400).json({
        status: 'error',
        error: 'Invalid request. Expected { components: [...] }'
      });
    }

    // Verify offering exists
    const offering = await prisma.courseOffering.findUnique({
      where: { id: offeringId }
    });

    if (!offering) {
      return res.status(404).json({
        status: 'error',
        error: 'Course offering not found'
      });
    }

    // Create test components
    const createdComponents = await Promise.all(
      components.map(comp =>
        prisma.testComponent.create({
          data: {
            courseOfferingId: offeringId,
            name: comp.name,
            maxMarks: comp.maxMarks,
            weightage: comp.weightage || 100,
            type: comp.type || 'theory'
          }
        })
      )
    );

    res.json({
      status: 'success',
      message: 'Test components created successfully',
      components: createdComponents
    });
  } catch (error) {
    console.error('Error creating test components:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update a test component
router.put('/components/:componentId', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    const { componentId } = req.params;
    const { name, maxMarks, weightage, type } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (maxMarks !== undefined) updateData.maxMarks = maxMarks;
    if (weightage !== undefined) updateData.weightage = weightage;
    if (type !== undefined) updateData.type = type;

    const updatedComponent = await prisma.testComponent.update({
      where: { id: componentId },
      data: updateData
    });

    res.json({
      status: 'success',
      message: 'Test component updated successfully',
      component: updatedComponent
    });
  } catch (error) {
    console.error('Error updating test component:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a test component
router.delete('/components/:componentId', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    const { componentId } = req.params;

    // Delete associated marks first (cascade should handle this, but being explicit)
    await prisma.studentMark.deleteMany({
      where: { testComponentId: componentId }
    });

    // Delete the component
    await prisma.testComponent.delete({
      where: { id: componentId }
    });

    res.json({
      status: 'success',
      message: 'Test component deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting test component:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
