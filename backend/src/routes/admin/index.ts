// src/routes/admin/index.ts
import { Router } from 'express';
import { authenticateToken, requireAdmin, requireTeacherOrAdmin } from '../../middleware/auth';
import importRoutes from './importRoutes';
import marksRoutes from './marksRoutes';
import courseRoutes from './courseRoutes';
import attendanceRoutes from './attendanceRoutes';
import debugRoutes from './debugRoutes';
import enrollmentRoutes from './enrollmentRoutes';

const router = Router();

console.log('=== ADMIN ROUTES MODULE LOADED ===');
router.use('/', importRoutes);
// Apply authentication middleware to all admin routes
router.use(authenticateToken);

// Routes that teachers can access (role-based filtering applied within the route)
router.use('/assigned-courses', requireTeacherOrAdmin);
router.use('/attendance', requireTeacherOrAdmin);
router.use('/marks', requireTeacherOrAdmin);

// Apply admin-only middleware to remaining routes
router.use(requireAdmin);

// Mount all admin route modules

router.use('/', marksRoutes);
router.use('/', courseRoutes);
router.use('/', attendanceRoutes);
router.use('/', debugRoutes);
router.use('/', enrollmentRoutes);

export default router;
