// src/routes/admin/index.ts
import { Router } from 'express';
import importRoutes from './importRoutes';
import marksRoutes from './marksRoutes';
import courseRoutes from './courseRoutes';
import attendanceRoutes from './attendanceRoutes';
import debugRoutes from './debugRoutes';

const router = Router();

console.log('=== ADMIN ROUTES MODULE LOADED ===');

// Mount all admin route modules
router.use('/', importRoutes);
router.use('/', marksRoutes);
router.use('/', courseRoutes);
router.use('/', attendanceRoutes);
router.use('/', debugRoutes);

export default router;
