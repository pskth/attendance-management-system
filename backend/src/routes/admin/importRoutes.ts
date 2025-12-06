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
    console.log('⚠️  WARNING: Using deprecated importRoutes clear-database endpoint');
    console.log('⚠️  This endpoint does NOT preserve admin users!');
    console.log('⚠️  Please use dumpRoutes /api/admin/clear-database instead');

    // Get all admin user IDs before clearing (PRESERVE ADMINS)
    const adminUsers = await prisma.admin.findMany({
      select: { userId: true }
    });
    const adminUserIds = adminUsers.map(a => a.userId);

    if (adminUserIds.length === 0) {
      console.error('❌ No admin users found! Aborting clear operation.');
      return res.status(400).json({
        error: 'Cannot clear database: No admin users found. Create an admin first.',
        suggestion: 'Run: node create-admin.js'
      });
    }

    console.log(`Preserving ${adminUserIds.length} admin user(s)...`);

    // Clear in reverse dependency order (PRESERVING ADMINS)
    await prisma.attendanceRecord.deleteMany({});
    await prisma.attendance.deleteMany({});
    await prisma.studentMark.deleteMany({});
    await prisma.testComponent.deleteMany({});
    await prisma.studentEnrollment.deleteMany({});
    await prisma.courseOffering.deleteMany({});
    await prisma.academic_years.deleteMany({});

    // Delete non-admin users only
    await prisma.student.deleteMany({
      where: adminUserIds.length > 0 ? { userId: { notIn: adminUserIds } } : {}
    });
    await prisma.teacher.deleteMany({
      where: adminUserIds.length > 0 ? { userId: { notIn: adminUserIds } } : {}
    });

    await prisma.course.deleteMany({});
    await prisma.sections.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.college.deleteMany({});

    // Delete non-admin role assignments and users
    await prisma.userRoleAssignment.deleteMany({
      where: { userId: { notIn: adminUserIds } }
    });
    await prisma.user.deleteMany({
      where: { id: { notIn: adminUserIds } }
    });

    console.log(`✅ Database cleared. Admin users preserved: ${adminUserIds.length}`);

    res.json({
      success: true,
      message: 'Database cleared successfully. Admin users preserved.',
      preserved: adminUserIds.length,
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
      testComponents: await prisma.testComponent.count(),
      studentMarks: await prisma.studentMark.count(),
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


    // Components flags are deprecated; nothing to fix


    res.json({
      success: true,
      message: 'Course component flags deprecated; no changes applied',
      updated: 0,
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
