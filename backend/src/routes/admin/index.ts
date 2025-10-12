// src/routes/admin/index.ts
import { Router } from 'express';
import { authenticateToken, requireAdmin, requireTeacherOrAdmin } from '../../middleware/auth';
import importRoutes from './importRoutes';
import marksRoutes from './marksRoutes';
import courseRoutes from './courseRoutes';
import attendanceRoutes from './attendanceRoutes';
import debugRoutes from './debugRoutes';
import enrollmentRoutes from './enrollmentRoutes';
import excelImportRoutes from './excelImportRoutes';
import exportRoutes from './exportRoutes';
import dumpRoutes from './dumpRoutes';

const router = Router();

console.log('=== ADMIN ROUTES MODULE LOADED ===');

// Apply authentication middleware to all admin routes
router.use(authenticateToken);

// Routes that teachers can access (role-based filtering applied within the route)
router.use('/assigned-courses', requireTeacherOrAdmin);
router.use('/attendance', requireTeacherOrAdmin);
router.use('/marks', requireTeacherOrAdmin);

// Apply admin-only middleware to remaining routes
router.use(requireAdmin);

// Mount all admin route modules
router.use('/', importRoutes);
router.use('/', excelImportRoutes);
router.use('/', exportRoutes);
router.use('/', dumpRoutes);
router.use('/', marksRoutes);
router.use('/', courseRoutes);
router.use('/', attendanceRoutes);
router.use('/', debugRoutes);
router.use('/', enrollmentRoutes);

export default router;
