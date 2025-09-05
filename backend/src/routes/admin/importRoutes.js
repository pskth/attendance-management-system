"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/admin/importRoutes.ts
const express_1 = require("express");
const multer = __importStar(require("multer"));
const database_1 = __importDefault(require("../../lib/database"));
const importService_1 = require("../../services/importService");
const router = (0, express_1.Router)();
const upload = multer.default({ storage: multer.default.memoryStorage() });
console.log('=== ADMIN IMPORT ROUTES LOADED ===');
// CSV Import endpoint
router.post('/import/:table', upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const prisma = database_1.default.getInstance();
        const result = yield importService_1.ImportService.importCSVData(table, file.buffer, prisma);
        res.json(result);
    }
    catch (error) {
        console.error('=== IMPORT ENDPOINT ERROR ===', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
// Clear all data endpoint
router.post('/clear-database', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        console.log('=== CLEARING DATABASE ===');
        // Clear in reverse dependency order
        yield prisma.attendanceRecord.deleteMany({});
        yield prisma.attendance.deleteMany({});
        yield prisma.theoryMarks.deleteMany({});
        yield prisma.labMarks.deleteMany({});
        yield prisma.studentEnrollment.deleteMany({});
        yield prisma.courseOffering.deleteMany({});
        yield prisma.academic_years.deleteMany({});
        yield prisma.userRoleAssignment.deleteMany({});
        yield prisma.student.deleteMany({});
        yield prisma.teacher.deleteMany({});
        yield prisma.course.deleteMany({});
        yield prisma.sections.deleteMany({});
        yield prisma.department.deleteMany({});
        yield prisma.user.deleteMany({});
        yield prisma.college.deleteMany({});
        res.json({
            success: true,
            message: 'Database cleared successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
// Get import status endpoint
router.get('/import-status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        const counts = {
            colleges: yield prisma.college.count(),
            users: yield prisma.user.count(),
            departments: yield prisma.department.count(),
            sections: yield prisma.sections.count(),
            students: yield prisma.student.count(),
            teachers: yield prisma.teacher.count(),
            courses: yield prisma.course.count(),
            userRoles: yield prisma.userRoleAssignment.count(),
            academicYears: yield prisma.academic_years.count(),
            courseOfferings: yield prisma.courseOffering.count(),
            attendance: yield prisma.attendance.count(),
            attendanceRecords: yield prisma.attendanceRecord.count(),
            enrollments: yield prisma.studentEnrollment.count(),
            theoryMarks: yield prisma.theoryMarks.count(),
            labMarks: yield prisma.labMarks.count()
        };
        res.json({
            success: true,
            data: counts,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
// Fix course components endpoint
router.post('/fix-course-components', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        console.log('=== FIXING COURSE COMPONENTS ===');
        // Get all courses
        const courses = yield prisma.course.findMany();
        console.log(`Found ${courses.length} courses to update`);
        let updatedCount = 0;
        for (const course of courses) {
            let hasTheory = false;
            let hasLab = false;
            // Check for theory marks
            const theoryMarksCount = yield prisma.theoryMarks.count({
                where: {
                    enrollment: {
                        offering: {
                            courseId: course.id
                        }
                    }
                }
            });
            // Check for lab marks
            const labMarksCount = yield prisma.labMarks.count({
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
                yield prisma.course.update({
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
    }
    catch (error) {
        console.error('Error fixing course components:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
exports.default = router;
