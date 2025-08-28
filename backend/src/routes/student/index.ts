import { Router } from 'express';
import { authenticateToken, requireStudent } from '../../middleware/auth';
import studentInfoRoutes from './studentInfoRoutes'
import studentMarksRoutes from './studentMarksRoutes'
import studentAttendanceRoutes from './studentAttendanceRoutes'
import   studentStatsRoutes from './studentStatsRoutes'
const router = Router();

console.log('=== STUDENT ROUTES MODULE LOADED ===');

// Apply authentication middleware to all student routes
router.use(authenticateToken);
router.use(requireStudent);

// Mount all student route modules
router.use('/', studentInfoRoutes);
router.use('/', studentAttendanceRoutes);
router.use('/',studentMarksRoutes);
router.use('/', studentStatsRoutes);
export default router;