import { Router } from 'express';
import DatabaseService from '../../lib/database';

const router = Router();
console.log('=== Table Structure Routes Loaded ===');

router.use((req, res, next) => {
  console.log('Request hit tableStrucRoutes:', req.path);
  next();
});

// Save or update test components for a course offering
router.post('/course/:courseId/teacher/:teacherId/components', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    const { courseId, teacherId } = req.params;
    const { components } = req.body;

    if (!Array.isArray(components)) {
      return res.status(400).json({ status: 'error', error: 'Invalid components array' });
    }

    // Find the course offering
    const offering = await prisma.courseOffering.findFirst({
      where: { courseId, teacherId },
      include: { testComponents: true }
    });
    if (!offering) {
      return res.status(404).json({ status: 'error', error: 'Course offering not found for this teacher/course' });
    }

    // Delete removed components
    const existingIds = offering.testComponents.map(tc => tc.id);
    const incomingIds = components.filter(c => c.id).map(c => c.id);
    const toDelete = existingIds.filter(id => !incomingIds.includes(id));
    await prisma.testComponent.deleteMany({ where: { id: { in: toDelete } } });

    // Upsert (update or create) components
    const upserted = [];
    for (const comp of components) {
      if (comp.id) {
        // Update existing
        const updated = await prisma.testComponent.update({
          where: { id: comp.id },
          data: {
            name: comp.name,
            maxMarks: comp.maxMarks,
            weightage: comp.weightage,
            type: comp.type
          }
        });
        upserted.push(updated);
      } else {
        // Create new
        const created = await prisma.testComponent.create({
          data: {
            name: comp.name,
            maxMarks: comp.maxMarks,
            weightage: comp.weightage,
            type: comp.type,
            courseOfferingId: offering.id
          }
        });
        upserted.push(created);
      }
    }

    // Return updated list
    const refreshed = await prisma.testComponent.findMany({ where: { courseOfferingId: offering.id } });
    res.json({ status: 'success', components: refreshed });
  } catch (error) {
    console.error('Error saving test components:', error);
    res.status(500).json({ status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});


///this pae doesnt work heheheheh


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

//to get marks of all students in that course by taught that teacher
router.get('/course/:courseId/teacher/:teacherId/marks', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    const { courseId, teacherId } = req.params;

    // 1. Find the offering
    const offering = await prisma.courseOffering.findFirst({
      where: {
        courseId,
        teacherId
      },
      include: {
        enrollments: {
          include: {
            student: {
              include: {
                user: true // to get student name/email
              }
            },
            studentMarks: {
              include: {
                testComponent: true
              }
            }
          }
        }
      }
    });

    if (!offering) {
      return res.status(404).json({
        status: 'error',
        error: 'Course offering not found for this teacher/course'
      });
    }

    // 2. Restructure marks by student
    const students = offering.enrollments.map(enrollment => ({
      studentId: enrollment.student?.id,
      usn: enrollment.student?.usn,
      studentName: enrollment.student?.user?.name,
      studentEmail: enrollment.student?.user?.email,
      marks: enrollment.studentMarks.map(sm => ({
        componentId: sm.testComponentId,
        componentName: sm.testComponent.name,
        type: sm.testComponent.type,
        obtainedMarks: sm.marksObtained,
        maxMarks: sm.testComponent.maxMarks,
        weightage: sm.testComponent.weightage
      }))
    }));

    res.json({
      status: 'success',
      offeringId: offering.id,
      courseId: offering.courseId,
      teacherId: offering.teacherId,
      students
    });
  } catch (error) {
    console.error('Error fetching student marks:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});



export default router;


