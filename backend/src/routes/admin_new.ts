// src/routes/admin.ts
import { Router } from 'express';
import adminRoutes from './admin/index';

const router = Router();

console.log('=== ADMIN ROUTES LOADED (MODULAR VERSION) ===');

// Mount all admin routes
router.use('/', adminRoutes);

export default router;
