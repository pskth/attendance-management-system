"use strict";
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
// src/routes/admin/marksRoutes.ts
const express_1 = require("express");
const database_1 = __importDefault(require("../../lib/database"));
const router = (0, express_1.Router)();
console.log('=== ADMIN MARKS ROUTES LOADED ===');
// Get all marks (theory and lab) for students
router.get('/marks', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        const { courseId, departmentId, year, studentId, studentUsn } = req.query;
        let whereClause = {};
        // Handle student filtering by either UUID or USN
        if (studentId || studentUsn) {
            if (studentUsn) {
                // Filter by USN
                whereClause.student = {
                    usn: studentUsn
                };
            }
            else if (studentId) {
                // Filter by UUID
                whereClause.studentId = studentId;
            }
        }
        if (courseId) {
            whereClause.offering = {
                courseId: courseId
            };
        }
        if (departmentId || year) {
            if (!whereClause.student) {
                whereClause.student = {};
            }
            if (departmentId) {
                whereClause.student.department_id = departmentId;
            }
            if (year) {
                whereClause.student.batchYear = parseInt(year);
            }
        }
        const enrollments = yield prisma.studentEnrollment.findMany({
            where: whereClause,
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                offering: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                code: true,
                                name: true
                            }
                        }
                    }
                },
                theoryMarks: true,
                labMarks: true
            }
        });
        const marksData = enrollments.map(enrollment => {
            var _a, _b, _c;
            return ({
                id: enrollment.id,
                enrollmentId: enrollment.id,
                student: enrollment.student ? {
                    id: enrollment.student.id,
                    usn: enrollment.student.usn,
                    user: {
                        name: enrollment.student.user.name
                    }
                } : null,
                course: ((_a = enrollment.offering) === null || _a === void 0 ? void 0 : _a.course) ? {
                    id: enrollment.offering.course.id,
                    code: enrollment.offering.course.code,
                    name: enrollment.offering.course.name
                } : null,
                theoryMarks: enrollment.theoryMarks ? {
                    id: enrollment.theoryMarks.id,
                    mse1_marks: enrollment.theoryMarks.mse1Marks,
                    mse2_marks: enrollment.theoryMarks.mse2Marks,
                    mse3_marks: enrollment.theoryMarks.mse3Marks,
                    task1_marks: enrollment.theoryMarks.task1Marks,
                    task2_marks: enrollment.theoryMarks.task2Marks,
                    task3_marks: enrollment.theoryMarks.task3Marks,
                    last_updated_at: enrollment.theoryMarks.lastUpdatedAt
                } : null,
                labMarks: enrollment.labMarks ? {
                    id: enrollment.labMarks.id,
                    record_marks: enrollment.labMarks.recordMarks,
                    continuous_evaluation_marks: enrollment.labMarks.continuousEvaluationMarks,
                    lab_mse_marks: enrollment.labMarks.labMseMarks,
                    last_updated_at: enrollment.labMarks.lastUpdatedAt
                } : null,
                updatedAt: ((_b = enrollment.theoryMarks) === null || _b === void 0 ? void 0 : _b.lastUpdatedAt) || ((_c = enrollment.labMarks) === null || _c === void 0 ? void 0 : _c.lastUpdatedAt) || new Date()
            });
        });
        res.json({
            status: 'success',
            data: marksData
        });
    }
    catch (error) {
        console.error('Error fetching marks:', error);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Get marks for a specific enrollment
router.get('/marks/:enrollmentId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const prisma = database_1.default.getInstance();
        const { enrollmentId } = req.params;
        const enrollment = yield prisma.studentEnrollment.findUnique({
            where: { id: enrollmentId },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                offering: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                code: true,
                                name: true
                            }
                        }
                    }
                },
                theoryMarks: true,
                labMarks: true
            }
        });
        if (!enrollment) {
            res.status(404).json({
                status: 'error',
                error: 'Enrollment not found'
            });
            return;
        }
        const marksData = {
            id: enrollment.id,
            enrollmentId: enrollment.id,
            student: enrollment.student ? {
                id: enrollment.student.id,
                usn: enrollment.student.usn,
                user: {
                    name: enrollment.student.user.name
                }
            } : null,
            course: ((_a = enrollment.offering) === null || _a === void 0 ? void 0 : _a.course) ? {
                id: enrollment.offering.course.id,
                code: enrollment.offering.course.code,
                name: enrollment.offering.course.name
            } : null,
            theoryMarks: enrollment.theoryMarks ? {
                id: enrollment.theoryMarks.id,
                mse1_marks: enrollment.theoryMarks.mse1Marks,
                mse2_marks: enrollment.theoryMarks.mse2Marks,
                mse3_marks: enrollment.theoryMarks.mse3Marks,
                task1_marks: enrollment.theoryMarks.task1Marks,
                task2_marks: enrollment.theoryMarks.task2Marks,
                task3_marks: enrollment.theoryMarks.task3Marks,
                last_updated_at: enrollment.theoryMarks.lastUpdatedAt
            } : null,
            labMarks: enrollment.labMarks ? {
                id: enrollment.labMarks.id,
                record_marks: enrollment.labMarks.recordMarks,
                continuous_evaluation_marks: enrollment.labMarks.continuousEvaluationMarks,
                lab_mse_marks: enrollment.labMarks.labMseMarks,
                last_updated_at: enrollment.labMarks.lastUpdatedAt
            } : null,
            updatedAt: ((_b = enrollment.theoryMarks) === null || _b === void 0 ? void 0 : _b.lastUpdatedAt) || ((_c = enrollment.labMarks) === null || _c === void 0 ? void 0 : _c.lastUpdatedAt) || new Date()
        };
        res.json({
            status: 'success',
            data: marksData
        });
    }
    catch (error) {
        console.error('Error fetching enrollment marks:', error);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Update marks for a specific enrollment
router.put('/marks/:enrollmentId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { enrollmentId } = req.params;
    const markData = req.body;
    try {
        const prisma = database_1.default.getInstance();
        // Check if enrollment exists
        const enrollment = yield prisma.studentEnrollment.findUnique({
            where: { id: enrollmentId }
        });
        if (!enrollment) {
            res.status(404).json({
                status: 'error',
                error: 'Enrollment not found'
            });
            return;
        }
        // Determine if this is theory or lab marks update
        const isTheoryUpdate = ['mse1_marks', 'mse2_marks', 'mse3_marks', 'task1_marks', 'task2_marks', 'task3_marks'].some(field => field in markData);
        const isLabUpdate = ['record_marks', 'continuous_evaluation_marks', 'lab_mse_marks'].some(field => field in markData);
        if (isTheoryUpdate) {
            // Update theory marks
            const theoryMarkData = {};
            if ('mse1_marks' in markData)
                theoryMarkData.mse1Marks = markData.mse1_marks;
            if ('mse2_marks' in markData)
                theoryMarkData.mse2Marks = markData.mse2_marks;
            if ('mse3_marks' in markData)
                theoryMarkData.mse3Marks = markData.mse3_marks;
            if ('task1_marks' in markData)
                theoryMarkData.task1Marks = markData.task1_marks;
            if ('task2_marks' in markData)
                theoryMarkData.task2Marks = markData.task2_marks;
            if ('task3_marks' in markData)
                theoryMarkData.task3Marks = markData.task3_marks;
            // Get current marks to check MSE3 eligibility
            const currentMarks = yield prisma.theoryMarks.findUnique({
                where: { enrollmentId }
            });
            // Calculate MSE1 + MSE2 total (use new values if being updated, otherwise use current values)
            const mse1 = theoryMarkData.mse1Marks !== undefined ? theoryMarkData.mse1Marks : ((currentMarks === null || currentMarks === void 0 ? void 0 : currentMarks.mse1Marks) || 0);
            const mse2 = theoryMarkData.mse2Marks !== undefined ? theoryMarkData.mse2Marks : ((currentMarks === null || currentMarks === void 0 ? void 0 : currentMarks.mse2Marks) || 0);
            // Check MSE3 eligibility constraint: MSE3 can only exist if MSE1 + MSE2 < 20
            if ((mse1 + mse2) >= 20) {
                // If MSE1 + MSE2 >= 20, MSE3 must be null
                theoryMarkData.mse3Marks = null;
            }
            theoryMarkData.lastUpdatedAt = new Date();
            yield prisma.theoryMarks.upsert({
                where: { enrollmentId },
                update: theoryMarkData,
                create: Object.assign({ enrollmentId }, theoryMarkData)
            });
        }
        if (isLabUpdate) {
            // Update lab marks
            const labMarkData = {};
            if ('record_marks' in markData)
                labMarkData.recordMarks = markData.record_marks;
            if ('continuous_evaluation_marks' in markData)
                labMarkData.continuousEvaluationMarks = markData.continuous_evaluation_marks;
            if ('lab_mse_marks' in markData)
                labMarkData.labMseMarks = markData.lab_mse_marks;
            labMarkData.lastUpdatedAt = new Date();
            yield prisma.labMarks.upsert({
                where: { enrollmentId },
                update: labMarkData,
                create: Object.assign({ enrollmentId }, labMarkData)
            });
        }
        res.json({
            status: 'success',
            message: 'Marks updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating marks:', error);
        console.error('EnrollmentId:', enrollmentId);
        console.error('Mark data:', markData);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            debug: {
                enrollmentId,
                markData,
                errorDetails: error instanceof Error ? error.stack : 'Unknown error'
            }
        });
    }
}));
exports.default = router;
