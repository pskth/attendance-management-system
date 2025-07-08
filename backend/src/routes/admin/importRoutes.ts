// src/routes/admin/importRoutes.ts
import { Router } from 'express';
import * as multer from 'multer';
import DatabaseService from '../../lib/database';
import { ImportService } from '../../services/importService';

const router = Router();
const upload = multer.default({ storage: multer.default.memoryStorage() });

console.log('=== ADMIN IMPORT ROUTES LOADED ===');

// CSV Import endpoint
router.post('/import/:table', upload.single('file'), async (req, res) => {
  try {
    console.log('=== IMPORT ENDPOINT HIT VERSION 2.0 ===');
    const { table } = req.params;
    const file = req.file;

    console.log('Table:', table);
    console.log('File:', file ? 'Present' : 'Missing');

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const prisma = DatabaseService.getInstance();
    const result = await ImportService.importCSVData(table, file.buffer, prisma);

    res.json(result);
  } catch (error) {
    console.error('=== IMPORT ENDPOINT ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Clear all data endpoint
router.post('/clear-database', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    
    console.log('=== CLEARING DATABASE ===');
    
    // Clear in reverse dependency order
    await prisma.attendanceRecord.deleteMany({});
    await prisma.attendance.deleteMany({});
    await prisma.theoryMarks.deleteMany({});
    await prisma.labMarks.deleteMany({});
    await prisma.studentEnrollment.deleteMany({});
    await prisma.courseOffering.deleteMany({});
    await prisma.academic_years.deleteMany({});
    await prisma.userRoleAssignment.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.teacher.deleteMany({});
    await prisma.course.deleteMany({});
    await prisma.sections.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.college.deleteMany({});

    res.json({ 
      success: true, 
      message: 'Database cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Get import status endpoint
router.get('/import-status', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    
    const counts = {
      colleges: await prisma.college.count(),
      users: await prisma.user.count(),
      departments: await prisma.department.count(),
      sections: await prisma.sections.count(),
      students: await prisma.student.count(),
      teachers: await prisma.teacher.count(),
      courses: await prisma.course.count(),
      userRoles: await prisma.userRoleAssignment.count(),
      academicYears: await prisma.academic_years.count(),
      courseOfferings: await prisma.courseOffering.count(),
      attendance: await prisma.attendance.count(),
      attendanceRecords: await prisma.attendanceRecord.count(),
      enrollments: await prisma.studentEnrollment.count(),
      theoryMarks: await prisma.theoryMarks.count(),
      labMarks: await prisma.labMarks.count()
    };

    res.json({
      success: true,
      data: counts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Fix course components endpoint
router.post('/fix-course-components', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    
    console.log('=== FIXING COURSE COMPONENTS ===');
    
    // Get all courses
    const courses = await prisma.course.findMany();
    console.log(`Found ${courses.length} courses to update`);
    
    let updatedCount = 0;
    
    for (const course of courses) {
      let hasTheory = false;
      let hasLab = false;
      
      // Check for theory marks
      const theoryMarksCount = await prisma.theoryMarks.count({
        where: {
          enrollment: {
            offering: {
              courseId: course.id
            }
          }
        }
      });
      
      // Check for lab marks
      const labMarksCount = await prisma.labMarks.count({
        where: {
          enrollment: {
            offering: {
              courseId: course.id
            }
          }
        }
      });
      
      hasTheory = theoryMarksCount > 0;
      hasLab = labMarksCount > 0;
      
      // Update course if flags are different
      if (course.hasTheoryComponent !== hasTheory || course.hasLabComponent !== hasLab) {
        await prisma.course.update({
          where: { id: course.id },
          data: {
            hasTheoryComponent: hasTheory,
            hasLabComponent: hasLab
          }
        });
        updatedCount++;
        
        console.log(`Updated course ${course.code}: theory=${hasTheory}, lab=${hasLab}`);
      }
    }
    
    res.json({
      success: true,
      message: `Fixed ${updatedCount} courses`,
      updated: updatedCount,
      total: courses.length
    });
  } catch (error) {
    console.error('Error fixing course components:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
