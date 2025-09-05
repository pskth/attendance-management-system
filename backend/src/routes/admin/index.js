"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/admin/index.ts
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const importRoutes_1 = __importDefault(require("./importRoutes"));
const marksRoutes_1 = __importDefault(require("./marksRoutes"));
const courseRoutes_1 = __importDefault(require("./courseRoutes"));
const attendanceRoutes_1 = __importDefault(require("./attendanceRoutes"));
const debugRoutes_1 = __importDefault(require("./debugRoutes"));
const enrollmentRoutes_1 = __importDefault(require("./enrollmentRoutes"));
const router = (0, express_1.Router)();
console.log('=== ADMIN ROUTES MODULE LOADED ===');
// Apply authentication middleware to all admin routes
router.use(auth_1.authenticateToken);
// Routes that teachers can access (role-based filtering applied within the route)
router.use('/assigned-courses', auth_1.requireTeacherOrAdmin);
router.use('/attendance', auth_1.requireTeacherOrAdmin);
router.use('/marks', auth_1.requireTeacherOrAdmin);
// Apply admin-only middleware to remaining routes
router.use(auth_1.requireAdmin);
// Mount all admin route modules
router.use('/', importRoutes_1.default);
router.use('/', marksRoutes_1.default);
router.use('/', courseRoutes_1.default);
router.use('/', attendanceRoutes_1.default);
router.use('/', debugRoutes_1.default);
router.use('/', enrollmentRoutes_1.default);
exports.default = router;
