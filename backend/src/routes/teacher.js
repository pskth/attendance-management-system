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
// src/routes/teacher.ts
const express_1 = require("express");
const database_1 = __importDefault(require("../lib/database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
console.log('=== TEACHER ROUTES LOADED ===');
// Get teacher profile and dashboard data
router.get('/dashboard', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated' });
        }
        const prisma = database_1.default.getInstance();
        // Get teacher profile with related data
        const teacher = yield prisma.teacher.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                        photoUrl: true
                    }
                },
                colleges: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                courseOfferings: {
                    include: {
                        course: {
                            include: {
                                department: true
                            }
                        },
                        sections: true,
                        academic_years: true,
                        enrollments: {
                            include: {
                                student: {
                                    include: {
                                        user: {
                                            select: {
                                                name: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!teacher) {
            return res.status(404).json({ status: 'error', message: 'Teacher profile not found' });
        }
        // Calculate statistics
        const totalCourses = teacher.courseOfferings.length;
        const totalStudents = new Set(teacher.courseOfferings.flatMap(offering => offering.enrollments.map(enrollment => { var _a; return (_a = enrollment.student) === null || _a === void 0 ? void 0 : _a.id; })).filter(Boolean)).size;
        // Get recent attendance sessions
        const recentAttendanceSessions = yield prisma.attendance.findMany({
            where: {
                teacherId: teacher.id
            },
            include: {
                offering: {
                    include: {
                        course: true,
                        sections: true
                    }
                },
                attendanceRecords: true
            },
            orderBy: {
                classDate: 'desc'
            },
            take: 5
        });
        // Calculate today's schedule (mock for now)
        const todaySchedule = teacher.courseOfferings.map(offering => {
            var _a;
            return ({
                courseId: offering.course.id,
                courseName: offering.course.name,
                courseCode: offering.course.code,
                section: ((_a = offering.sections) === null || _a === void 0 ? void 0 : _a.section_name) || 'Unknown',
                time: '10:00 AM', // Mock time - should come from timetable
                duration: '1 hour',
                studentsEnrolled: offering.enrollments.length
            });
        });
        const dashboardData = {
            teacher: {
                id: teacher.id,
                name: teacher.user.name,
                email: teacher.user.email,
                phone: teacher.user.phone,
                photoUrl: teacher.user.photoUrl,
                department: ((_b = teacher.department) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown',
                departmentCode: ((_c = teacher.department) === null || _c === void 0 ? void 0 : _c.code) || 'N/A',
                college: ((_d = teacher.colleges) === null || _d === void 0 ? void 0 : _d.name) || 'Unknown',
                collegeCode: ((_e = teacher.colleges) === null || _e === void 0 ? void 0 : _e.code) || 'N/A'
            },
            statistics: {
                totalCourses,
                totalStudents,
                totalSessions: recentAttendanceSessions.length,
                averageAttendance: 85.5 // Mock - calculate from actual data
            },
            recentSessions: recentAttendanceSessions.map(session => {
                var _a, _b, _c, _d;
                return ({
                    id: session.id,
                    date: session.classDate,
                    courseName: ((_a = session.offering) === null || _a === void 0 ? void 0 : _a.course.name) || 'Unknown',
                    courseCode: ((_b = session.offering) === null || _b === void 0 ? void 0 : _b.course.code) || 'N/A',
                    section: ((_d = (_c = session.offering) === null || _c === void 0 ? void 0 : _c.sections) === null || _d === void 0 ? void 0 : _d.section_name) || 'Unknown',
                    topic: session.syllabusCovered || 'No topic recorded',
                    attendanceCount: session.attendanceRecords.length,
                    presentCount: session.attendanceRecords.filter(r => r.status === 'present').length
                });
            }),
            todaySchedule
        };
        res.json({
            status: 'success',
            data: dashboardData
        });
    }
    catch (error) {
        console.error('Teacher dashboard error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to load teacher dashboard',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Get courses assigned to teacher
router.get('/courses', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated' });
        }
        const prisma = database_1.default.getInstance();
        const teacher = yield prisma.teacher.findUnique({
            where: { userId },
            include: {
                courseOfferings: {
                    include: {
                        course: {
                            include: {
                                department: true
                            }
                        },
                        sections: true,
                        academic_years: true,
                        enrollments: {
                            include: {
                                student: {
                                    include: {
                                        user: {
                                            select: {
                                                name: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!teacher) {
            return res.status(404).json({ status: 'error', message: 'Teacher not found' });
        }
        const coursesData = teacher.courseOfferings.map(offering => {
            var _a, _b;
            return ({
                offeringId: offering.id,
                course: {
                    id: offering.course.id,
                    name: offering.course.name,
                    code: offering.course.code,
                    type: offering.course.type,
                    hasTheoryComponent: offering.course.hasTheoryComponent,
                    hasLabComponent: offering.course.hasLabComponent,
                    department: ((_a = offering.course.department) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown'
                },
                section: offering.sections ? {
                    id: offering.sections.section_id,
                    name: offering.sections.section_name
                } : null,
                academicYear: ((_b = offering.academic_years) === null || _b === void 0 ? void 0 : _b.year_name) || 'Unknown',
                enrolledStudents: offering.enrollments.length,
                students: offering.enrollments.map(enrollment => {
                    var _a, _b, _c, _d;
                    return ({
                        id: ((_a = enrollment.student) === null || _a === void 0 ? void 0 : _a.id) || '',
                        name: ((_c = (_b = enrollment.student) === null || _b === void 0 ? void 0 : _b.user) === null || _c === void 0 ? void 0 : _c.name) || 'Unknown',
                        usn: ((_d = enrollment.student) === null || _d === void 0 ? void 0 : _d.usn) || 'N/A'
                    });
                })
            });
        });
        res.json({
            status: 'success',
            data: coursesData
        });
    }
    catch (error) {
        console.error('Teacher courses error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to load teacher courses',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Get students for a specific course offering
router.get('/courses/:offeringId/students', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { offeringId } = req.params;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated' });
        }
        const prisma = database_1.default.getInstance();
        // Verify teacher has access to this course offering
        const teacher = yield prisma.teacher.findUnique({
            where: { userId },
            include: {
                courseOfferings: {
                    where: { id: offeringId }
                }
            }
        });
        if (!teacher || teacher.courseOfferings.length === 0) {
            return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
        }
        // Get students enrolled in the course offering
        const enrollments = yield prisma.studentEnrollment.findMany({
            where: { offeringId },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                                phone: true
                            }
                        },
                        departments: true,
                        sections: true
                    }
                },
                offering: {
                    include: {
                        course: true
                    }
                }
            }
        });
        const studentsData = enrollments.map(enrollment => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
            return ({
                enrollmentId: enrollment.id,
                student: {
                    id: ((_a = enrollment.student) === null || _a === void 0 ? void 0 : _a.id) || '',
                    usn: ((_b = enrollment.student) === null || _b === void 0 ? void 0 : _b.usn) || 'N/A',
                    name: ((_d = (_c = enrollment.student) === null || _c === void 0 ? void 0 : _c.user) === null || _d === void 0 ? void 0 : _d.name) || 'Unknown',
                    email: ((_f = (_e = enrollment.student) === null || _e === void 0 ? void 0 : _e.user) === null || _f === void 0 ? void 0 : _f.email) || 'N/A',
                    phone: ((_h = (_g = enrollment.student) === null || _g === void 0 ? void 0 : _g.user) === null || _h === void 0 ? void 0 : _h.phone) || 'N/A',
                    semester: ((_j = enrollment.student) === null || _j === void 0 ? void 0 : _j.semester) || 0,
                    department: ((_l = (_k = enrollment.student) === null || _k === void 0 ? void 0 : _k.departments) === null || _l === void 0 ? void 0 : _l.name) || 'Unknown',
                    section: ((_o = (_m = enrollment.student) === null || _m === void 0 ? void 0 : _m.sections) === null || _o === void 0 ? void 0 : _o.section_name) || 'Unknown'
                },
                course: {
                    id: ((_p = enrollment.offering) === null || _p === void 0 ? void 0 : _p.course.id) || '',
                    name: ((_q = enrollment.offering) === null || _q === void 0 ? void 0 : _q.course.name) || 'Unknown',
                    code: ((_r = enrollment.offering) === null || _r === void 0 ? void 0 : _r.course.code) || 'N/A'
                }
            });
        });
        res.json({
            status: 'success',
            data: studentsData
        });
    }
    catch (error) {
        console.error('Teacher course students error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to load course students',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Take attendance for a course
router.post('/attendance', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { offeringId, classDate, periodNumber, syllabusCovered, hoursTaken, attendanceData } = req.body;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated' });
        }
        const prisma = database_1.default.getInstance();
        // Verify teacher has access to this course offering
        const teacher = yield prisma.teacher.findUnique({
            where: { userId },
            include: {
                courseOfferings: {
                    where: { id: offeringId }
                }
            }
        });
        if (!teacher || teacher.courseOfferings.length === 0) {
            return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
        }
        // Create attendance session
        const attendanceSession = yield prisma.attendance.create({
            data: {
                offeringId,
                teacherId: teacher.id,
                classDate: new Date(classDate),
                periodNumber: periodNumber || 1,
                syllabusCovered: syllabusCovered || '',
                status: 'held'
            }
        });
        // Create attendance records for each student
        const attendanceRecords = [];
        for (const record of attendanceData) {
            const attendanceRecord = yield prisma.attendanceRecord.create({
                data: {
                    attendanceId: attendanceSession.id,
                    studentId: record.studentId,
                    status: record.status
                }
            });
            attendanceRecords.push(attendanceRecord);
        }
        res.json({
            status: 'success',
            message: 'Attendance saved successfully',
            data: {
                sessionId: attendanceSession.id,
                recordsCount: attendanceRecords.length,
                presentCount: attendanceRecords.filter(r => r.status === 'present').length,
                absentCount: attendanceRecords.filter(r => r.status === 'absent').length
            }
        });
    }
    catch (error) {
        console.error('Take attendance error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to save attendance',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Get attendance history for a course
router.get('/courses/:offeringId/attendance-history', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { offeringId } = req.params;
        const { limit = '10' } = req.query;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated' });
        }
        const prisma = database_1.default.getInstance();
        // Verify teacher has access to this course offering
        const teacher = yield prisma.teacher.findUnique({
            where: { userId },
            include: {
                courseOfferings: {
                    where: { id: offeringId }
                }
            }
        });
        if (!teacher || teacher.courseOfferings.length === 0) {
            return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
        }
        const attendanceSessions = yield prisma.attendance.findMany({
            where: {
                offeringId,
                teacherId: teacher.id
            },
            include: {
                attendanceRecords: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                classDate: 'desc'
            },
            take: parseInt(limit)
        });
        const historyData = attendanceSessions.map(session => ({
            id: session.id,
            date: session.classDate,
            periodNumber: session.periodNumber,
            topic: session.syllabusCovered,
            totalStudents: session.attendanceRecords.length,
            presentCount: session.attendanceRecords.filter(r => r.status === 'present').length,
            absentCount: session.attendanceRecords.filter(r => r.status === 'absent').length,
            attendancePercentage: session.attendanceRecords.length > 0
                ? (session.attendanceRecords.filter(r => r.status === 'present').length / session.attendanceRecords.length) * 100
                : 0
        }));
        res.json({
            status: 'success',
            data: historyData
        });
    }
    catch (error) {
        console.error('Attendance history error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to load attendance history',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Get student attendance analytics for a course
router.get('/courses/:offeringId/attendance-analytics', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { offeringId } = req.params;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated' });
        }
        const prisma = database_1.default.getInstance();
        // Verify teacher has access to this course offering
        const teacher = yield prisma.teacher.findUnique({
            where: { userId },
            include: {
                courseOfferings: {
                    where: { id: offeringId }
                }
            }
        });
        if (!teacher || teacher.courseOfferings.length === 0) {
            return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
        }
        // Get all students and their attendance records for this course
        const enrollments = yield prisma.studentEnrollment.findMany({
            where: { offeringId },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                                phone: true
                            }
                        },
                        attendanceRecords: {
                            include: {
                                attendance: {
                                    where: {
                                        offeringId
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        const analyticsData = enrollments.map(enrollment => {
            var _a, _b, _c;
            const student = enrollment.student;
            if (!student)
                return null;
            const attendanceRecords = student.attendanceRecords.filter(record => { var _a; return ((_a = record.attendance) === null || _a === void 0 ? void 0 : _a.offeringId) === offeringId; });
            const totalClasses = attendanceRecords.length;
            const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
            const attendancePercentage = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;
            return {
                student: {
                    id: student.id,
                    usn: student.usn,
                    name: ((_a = student.user) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown',
                    email: ((_b = student.user) === null || _b === void 0 ? void 0 : _b.email) || 'N/A',
                    phone: ((_c = student.user) === null || _c === void 0 ? void 0 : _c.phone) || 'N/A'
                },
                attendance: {
                    totalClasses,
                    presentCount,
                    absentCount: totalClasses - presentCount,
                    attendancePercentage: Math.round(attendancePercentage * 10) / 10
                }
            };
        }).filter(Boolean);
        // Sort by attendance percentage (lowest first to identify at-risk students)
        analyticsData.sort((a, b) => ((a === null || a === void 0 ? void 0 : a.attendance.attendancePercentage) || 0) - ((b === null || b === void 0 ? void 0 : b.attendance.attendancePercentage) || 0));
        res.json({
            status: 'success',
            data: analyticsData
        });
    }
    catch (error) {
        console.error('Attendance analytics error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to load attendance analytics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
exports.default = router;
