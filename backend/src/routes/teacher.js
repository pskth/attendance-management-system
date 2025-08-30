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
        // Get total sessions count for statistics (all sessions ever taken by this teacher)
        const totalSessionsCount = yield prisma.attendance.count({
            where: {
                teacherId: teacher.id,
                status: 'held' // Only count sessions that were actually held
            }
        });
        // Get recent attendance sessions for display (separate from total count)
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
            take: 5 // Only get 5 recent sessions for display
        });
        // Calculate average attendance across all sessions
        const allAttendanceSessions = yield prisma.attendance.findMany({
            where: {
                teacherId: teacher.id,
                status: 'held'
            },
            include: {
                attendanceRecords: true
            }
        });
        let averageAttendance = 0;
        if (allAttendanceSessions.length > 0) {
            const totalAttendanceRecords = allAttendanceSessions.reduce((sum, session) => sum + session.attendanceRecords.length, 0);
            const totalPresentRecords = allAttendanceSessions.reduce((sum, session) => sum + session.attendanceRecords.filter(record => record.status === 'present').length, 0);
            averageAttendance = totalAttendanceRecords > 0 ? (totalPresentRecords / totalAttendanceRecords) * 100 : 0;
        }
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
                totalSessions: totalSessionsCount, // Use correct total count instead of recentAttendanceSessions.length
                averageAttendance: Math.round(averageAttendance * 10) / 10 // Use calculated average attendance with 1 decimal place
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
// TEST ROUTE - to verify routing is working
router.get('/courses/:offeringId/test', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🔥🔥🔥 TEST ROUTE HIT!!! 🔥🔥🔥');
    res.json({ message: 'Test route works!', offeringId: req.params.offeringId });
}));
// Get course statistics for dashboard
router.get('/courses/:offeringId/statistics', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    console.log('🚨🚨🚨 STATISTICS ROUTE HIT!!! 🚨🚨🚨');
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { offeringId } = req.params;
        console.log('=== COURSE STATISTICS REQUEST ===');
        console.log('User ID:', userId);
        console.log('Offering ID:', offeringId);
        if (!userId) {
            console.log('ERROR: User not authenticated');
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
        console.log('Teacher found:', teacher ? 'Yes' : 'No');
        console.log('Course offerings for teacher:', ((_b = teacher === null || teacher === void 0 ? void 0 : teacher.courseOfferings) === null || _b === void 0 ? void 0 : _b.length) || 0);
        if (!teacher || teacher.courseOfferings.length === 0) {
            console.log('ERROR: Access denied to course offering', offeringId);
            console.log('Teacher courseOfferings:', teacher === null || teacher === void 0 ? void 0 : teacher.courseOfferings);
            return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
        }
        console.log('Access granted, fetching statistics...');
        // Get statistics for this course offering
        const attendanceSessions = yield prisma.attendance.findMany({
            where: {
                offeringId,
                teacherId: teacher.id,
                status: 'held'
            },
            include: {
                attendanceRecords: true
            }
        });
        console.log('Attendance sessions found:', attendanceSessions.length);
        const totalClasses = attendanceSessions.length;
        const totalAttendanceRecords = attendanceSessions.reduce((sum, session) => sum + session.attendanceRecords.length, 0);
        const totalPresentRecords = attendanceSessions.reduce((sum, session) => sum + session.attendanceRecords.filter(record => record.status === 'present').length, 0);
        const overallAttendancePercentage = totalAttendanceRecords > 0
            ? (totalPresentRecords / totalAttendanceRecords) * 100
            : 0;
        const statistics = {
            classesCompleted: totalClasses,
            totalClasses: totalClasses, // For now, assume all held sessions are completed
            overallAttendancePercentage: Math.round(overallAttendancePercentage * 10) / 10
        };
        console.log('Statistics calculated:', statistics);
        console.log('=== END COURSE STATISTICS REQUEST ===');
        res.json({
            status: 'success',
            data: statistics
        });
    }
    catch (error) {
        console.error('Course statistics error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to load course statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Update student marks (teachers can only update marks for their assigned courses)
router.put('/marks/:enrollmentId', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { enrollmentId } = req.params;
    const markData = req.body;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated' });
        }
        const prisma = database_1.default.getInstance();
        // Get teacher info
        const teacher = yield prisma.teacher.findUnique({
            where: { userId }
        });
        if (!teacher) {
            return res.status(403).json({ status: 'error', message: 'Teacher not found' });
        }
        // Check if enrollment exists and verify teacher has access to this course
        const enrollment = yield prisma.studentEnrollment.findUnique({
            where: { id: enrollmentId },
            include: {
                offering: {
                    include: {
                        teacher: true
                    }
                }
            }
        });
        if (!enrollment) {
            return res.status(404).json({
                status: 'error',
                error: 'Enrollment not found'
            });
        }
        // Verify teacher has access to this course
        if (!enrollment.offering || enrollment.offering.teacherId !== teacher.id) {
            return res.status(403).json({
                status: 'error',
                error: 'Access denied - you can only update marks for your assigned courses'
            });
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
        res.status(500).json({
            status: 'error',
            message: 'Failed to update marks',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Get marks for students in teacher's courses
router.get('/marks', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { courseId, studentUsn } = req.query;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated' });
        }
        const prisma = database_1.default.getInstance();
        // Get teacher info
        const teacher = yield prisma.teacher.findUnique({
            where: { userId },
            include: {
                courseOfferings: {
                    include: {
                        course: true
                    }
                }
            }
        });
        if (!teacher) {
            return res.status(403).json({ status: 'error', message: 'Teacher not found' });
        }
        // Build where clause for student enrollments
        let whereClause = {
            offering: {
                teacherId: teacher.id
            }
        };
        // Filter by course if specified
        if (courseId) {
            whereClause.offering.courseId = courseId;
        }
        // Filter by student USN if specified
        if (studentUsn) {
            whereClause.student = {
                usn: studentUsn
            };
        }
        const enrollments = yield prisma.studentEnrollment.findMany({
            where: whereClause,
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
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
        // Transform data to match admin API format
        const transformedData = enrollments.map(enrollment => {
            var _a;
            return ({
                id: enrollment.id,
                enrollmentId: enrollment.id,
                student: enrollment.student ? {
                    id: enrollment.student.id,
                    usn: enrollment.student.usn,
                    user: enrollment.student.user
                } : null,
                course: ((_a = enrollment.offering) === null || _a === void 0 ? void 0 : _a.course) || null,
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
                updatedAt: new Date() // Use current date as fallback
            });
        });
        res.json({
            status: 'success',
            data: transformedData
        });
    }
    catch (error) {
        console.error('Error fetching teacher marks:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch marks',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Get student attendance for a specific date and course (simplified - no sessions needed)
router.get('/attendance/students', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const prisma = database_1.default.getInstance();
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { date, courseId } = req.query;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User authentication required' });
        }
        if (!date || !courseId) {
            return res.status(400).json({ status: 'error', message: 'Date and courseId parameters are required' });
        }
        // Get teacher's information
        const teacher = yield prisma.teacher.findFirst({
            where: { userId: userId }
        });
        if (!teacher) {
            return res.status(403).json({ status: 'error', message: 'Teacher access required' });
        }
        // Find the course offering (handle both offering ID and course ID)
        let courseOffering = yield prisma.courseOffering.findFirst({
            where: {
                id: courseId,
                teacherId: teacher.id
            }
        });
        if (!courseOffering) {
            courseOffering = yield prisma.courseOffering.findFirst({
                where: {
                    courseId: courseId,
                    teacherId: teacher.id
                }
            });
        }
        if (!courseOffering) {
            return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
        }
        const classDate = new Date(date);
        // Get all enrolled students for this course
        const enrollments = yield prisma.studentEnrollment.findMany({
            where: {
                offeringId: courseOffering.id
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });
        // Get existing attendance records for this date and course
        const validStudentIds = enrollments
            .map(e => e.studentId)
            .filter((id) => id !== null);
        const existingAttendance = yield prisma.attendanceRecord.findMany({
            where: {
                studentId: { in: validStudentIds },
                attendance: {
                    classDate: classDate,
                    offeringId: courseOffering.id
                }
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });
        // Create a map of existing attendance records
        const attendanceMap = new Map();
        existingAttendance.forEach(record => {
            attendanceMap.set(record.studentId, record);
        });
        // Build the response with all students and their attendance status
        const studentsWithAttendance = enrollments
            .filter(enrollment => enrollment.student && enrollment.studentId)
            .map(enrollment => {
            var _a, _b;
            const existingRecord = attendanceMap.get(enrollment.studentId);
            return {
                studentId: enrollment.studentId,
                usn: enrollment.student.usn || ((_a = enrollment.student.user) === null || _a === void 0 ? void 0 : _a.email) || 'N/A',
                student_name: ((_b = enrollment.student.user) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown',
                status: existingRecord ? existingRecord.status : 'unmarked', // Default to unmarked
                attendanceRecordId: existingRecord ? existingRecord.id : null,
                courseId: courseOffering.courseId,
                courseName: 'Course Name' // Will be populated later if needed
            };
        });
        // Get course details
        const course = yield prisma.course.findUnique({
            where: { id: courseOffering.courseId },
            select: { name: true, code: true }
        });
        // Update course name in response
        studentsWithAttendance.forEach(student => {
            student.courseName = course ? `${course.code} - ${course.name}` : 'Unknown Course';
        });
        res.json({
            status: 'success',
            data: studentsWithAttendance
        });
    }
    catch (error) {
        console.error('Error fetching student attendance:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch student attendance',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Get attendance by date for teacher's courses
router.get('/attendance', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const prisma = database_1.default.getInstance();
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { date, courseId } = req.query;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User authentication required' });
        }
        if (!date) {
            return res.status(400).json({ status: 'error', message: 'Date parameter is required' });
        }
        // Get teacher's information
        const teacher = yield prisma.teacher.findFirst({
            where: { userId: userId }
        });
        if (!teacher) {
            return res.status(403).json({ status: 'error', message: 'Teacher access required' });
        }
        // Build the query conditions
        let whereClause = {
            teacherId: teacher.id,
            classDate: new Date(date),
            status: 'confirmed'
        };
        // If courseId is specified, verify teacher teaches this course
        if (courseId) {
            // First check if the courseId is actually an offering ID
            let courseOffering = yield prisma.courseOffering.findFirst({
                where: {
                    id: courseId,
                    teacherId: teacher.id
                }
            });
            // If not found as offering ID, try as course ID
            if (!courseOffering) {
                courseOffering = yield prisma.courseOffering.findFirst({
                    where: {
                        courseId: courseId,
                        teacherId: teacher.id
                    }
                });
            }
            if (!courseOffering) {
                return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
            }
            whereClause.offeringId = courseOffering.id;
        }
        // Get attendance sessions for the specified date
        const attendanceSessions = yield prisma.attendance.findMany({
            where: whereClause,
            include: {
                attendanceRecords: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                },
                offering: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        },
                        sections: {
                            select: {
                                section_name: true
                            }
                        }
                    }
                }
            }
        });
        const formattedData = attendanceSessions.map((session) => {
            var _a;
            return ({
                attendanceId: session.id,
                date: session.classDate,
                period: session.periodNumber,
                course: {
                    id: session.offering.course.id,
                    name: session.offering.course.name,
                    code: session.offering.course.code
                },
                section: (_a = session.offering.sections) === null || _a === void 0 ? void 0 : _a.section_name,
                syllabusCovered: session.syllabusCovered,
                records: session.attendanceRecords.map((record) => ({
                    recordId: record.id,
                    studentId: record.studentId,
                    student: {
                        id: record.student.id,
                        name: record.student.user.name,
                        email: record.student.user.email,
                        usn: record.student.usn
                    },
                    status: record.status
                }))
            });
        });
        res.json({
            status: 'success',
            data: formattedData
        });
    }
    catch (error) {
        console.error('Error fetching attendance data:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch attendance data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Update individual student attendance (creates records automatically if they don't exist)
router.put('/attendance/student', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const prisma = database_1.default.getInstance();
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { studentId, courseId, date, status } = req.body;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User authentication required' });
        }
        if (!studentId || !courseId || !date || !status) {
            return res.status(400).json({
                status: 'error',
                message: 'studentId, courseId, date, and status are required'
            });
        }
        // Validate status
        if (!['present', 'absent', 'unmarked'].includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Status must be present, absent, or unmarked'
            });
        }
        // Get teacher's information
        const teacher = yield prisma.teacher.findFirst({
            where: { userId: userId }
        });
        if (!teacher) {
            return res.status(403).json({ status: 'error', message: 'Teacher access required' });
        }
        // Find the course offering (handle both offering ID and course ID)
        let courseOffering = yield prisma.courseOffering.findFirst({
            where: {
                id: courseId,
                teacherId: teacher.id
            }
        });
        if (!courseOffering) {
            courseOffering = yield prisma.courseOffering.findFirst({
                where: {
                    courseId: courseId,
                    teacherId: teacher.id
                }
            });
        }
        if (!courseOffering) {
            return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
        }
        // Verify student is enrolled in this course
        const enrollment = yield prisma.studentEnrollment.findFirst({
            where: {
                studentId: studentId,
                offeringId: courseOffering.id
            }
        });
        if (!enrollment) {
            return res.status(400).json({
                status: 'error',
                message: 'Student is not enrolled in this course'
            });
        }
        const classDate = new Date(date);
        // Find or create attendance session for this date and course
        let attendanceSession = yield prisma.attendance.findFirst({
            where: {
                offeringId: courseOffering.id,
                classDate: classDate,
                teacherId: teacher.id
            }
        });
        if (!attendanceSession) {
            // Create attendance session automatically
            attendanceSession = yield prisma.attendance.create({
                data: {
                    offeringId: courseOffering.id,
                    teacherId: teacher.id,
                    classDate: classDate,
                    periodNumber: 1,
                    syllabusCovered: '',
                    status: 'confirmed'
                }
            });
        }
        // Find or create attendance record for this student
        let attendanceRecord = yield prisma.attendanceRecord.findFirst({
            where: {
                attendanceId: attendanceSession.id,
                studentId: studentId
            }
        });
        if (!attendanceRecord) {
            // Create record if student is not yet in the session
            if (status !== 'unmarked') {
                attendanceRecord = yield prisma.attendanceRecord.create({
                    data: {
                        attendanceId: attendanceSession.id,
                        studentId: studentId,
                        status: status
                    }
                });
            }
            // If status is unmarked and no record exists, do nothing (already unmarked)
        }
        else {
            // Update existing record
            if (status === 'unmarked') {
                // Delete the record to mark as unmarked
                yield prisma.attendanceRecord.delete({
                    where: { id: attendanceRecord.id }
                });
                attendanceRecord = null;
            }
            else {
                // Update the status
                attendanceRecord = yield prisma.attendanceRecord.update({
                    where: { id: attendanceRecord.id },
                    data: { status: status }
                });
            }
        }
        res.json({
            status: 'success',
            message: `Student attendance updated to ${status}`,
            data: {
                studentId: studentId,
                status: attendanceRecord ? attendanceRecord.status : 'unmarked',
                date: date,
                sessionId: attendanceSession.id,
                recordId: attendanceRecord ? attendanceRecord.id : null
            }
        });
    }
    catch (error) {
        console.error('Error updating student attendance:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update student attendance',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Create attendance record for teacher's courses
router.post('/attendance', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const prisma = database_1.default.getInstance();
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { studentId, date, status, courseId } = req.body;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User authentication required' });
        }
        if (!studentId || !date || !status) {
            return res.status(400).json({
                status: 'error',
                message: 'studentId, date, and status are required'
            });
        }
        // Get teacher's information
        const teacher = yield prisma.teacher.findFirst({
            where: { userId: userId }
        });
        if (!teacher) {
            return res.status(403).json({ status: 'error', message: 'Teacher access required' });
        }
        // Find the student enrollment in teacher's course
        let offeringId = null;
        if (courseId) {
            // First check if the courseId is actually an offering ID
            let courseOffering = yield prisma.courseOffering.findFirst({
                where: {
                    id: courseId,
                    teacherId: teacher.id
                }
            });
            // If not found as offering ID, try as course ID
            if (!courseOffering) {
                courseOffering = yield prisma.courseOffering.findFirst({
                    where: {
                        courseId: courseId,
                        teacherId: teacher.id
                    }
                });
            }
            if (!courseOffering) {
                return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
            }
            offeringId = courseOffering.id;
        }
        // Verify the student is enrolled in one of teacher's courses
        const enrollment = yield prisma.studentEnrollment.findFirst({
            where: {
                studentId: studentId,
                offering: Object.assign({ teacherId: teacher.id }, (offeringId && { id: offeringId }))
            },
            include: {
                offering: true
            }
        });
        if (!enrollment) {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied: Student not enrolled in your courses'
            });
        }
        // Find or create attendance session for this date and offering
        const attendanceDate = new Date(date);
        let attendanceSession = yield prisma.attendance.findFirst({
            where: {
                offeringId: enrollment.offeringId,
                teacherId: teacher.id,
                classDate: attendanceDate,
                status: 'confirmed'
            }
        });
        if (!attendanceSession) {
            // Create new attendance session
            attendanceSession = yield prisma.attendance.create({
                data: {
                    offeringId: enrollment.offeringId,
                    teacherId: teacher.id,
                    classDate: attendanceDate,
                    periodNumber: 1, // Default period
                    status: 'confirmed',
                    syllabusCovered: ''
                }
            });
        }
        // Create or update attendance record
        const existingRecord = yield prisma.attendanceRecord.findFirst({
            where: {
                attendanceId: attendanceSession.id,
                studentId: studentId
            }
        });
        let attendanceRecord;
        if (existingRecord) {
            // Update existing record
            attendanceRecord = yield prisma.attendanceRecord.update({
                where: {
                    id: existingRecord.id
                },
                data: {
                    status: status
                }
            });
        }
        else {
            // Create new record
            attendanceRecord = yield prisma.attendanceRecord.create({
                data: {
                    attendanceId: attendanceSession.id,
                    studentId: studentId,
                    status: status
                }
            });
        }
        res.json({
            status: 'success',
            data: {
                recordId: attendanceRecord.id,
                attendanceId: attendanceSession.id,
                studentId: studentId,
                status: status,
                date: attendanceDate
            }
        });
    }
    catch (error) {
        console.error('Error creating attendance record:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create attendance record',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Update attendance record for teacher's courses
router.put('/attendance/:attendanceRecordId', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const prisma = database_1.default.getInstance();
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { attendanceRecordId } = req.params;
        const { status } = req.body;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User authentication required' });
        }
        if (!status) {
            return res.status(400).json({ status: 'error', message: 'Status is required' });
        }
        // Get teacher's information
        const teacher = yield prisma.teacher.findFirst({
            where: { userId: userId }
        });
        if (!teacher) {
            return res.status(403).json({ status: 'error', message: 'Teacher access required' });
        }
        // Find the attendance record and verify it belongs to teacher's course
        const attendanceRecord = yield prisma.attendanceRecord.findFirst({
            where: {
                id: attendanceRecordId
            },
            include: {
                attendance: {
                    include: {
                        offering: true
                    }
                }
            }
        });
        if (!attendanceRecord) {
            return res.status(404).json({ status: 'error', message: 'Attendance record not found' });
        }
        // Verify the attendance session belongs to this teacher
        if (!attendanceRecord.attendance || attendanceRecord.attendance.teacherId !== teacher.id) {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied: This attendance record does not belong to your courses'
            });
        }
        // Update the attendance record
        const updatedRecord = yield prisma.attendanceRecord.update({
            where: {
                id: attendanceRecordId
            },
            data: {
                status: status
            }
        });
        res.json({
            status: 'success',
            data: {
                recordId: updatedRecord.id,
                studentId: updatedRecord.studentId,
                status: updatedRecord.status
            }
        });
    }
    catch (error) {
        console.error('Error updating attendance record:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update attendance record',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Create attendance session for teacher's course
router.post('/attendance/session', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const prisma = database_1.default.getInstance();
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { courseId, date, periodNumber, syllabusCovered } = req.body;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User authentication required' });
        }
        if (!courseId || !date) {
            return res.status(400).json({
                status: 'error',
                message: 'courseId and date are required'
            });
        }
        // Get teacher's information
        const teacher = yield prisma.teacher.findFirst({
            where: { userId: userId }
        });
        if (!teacher) {
            return res.status(403).json({ status: 'error', message: 'Teacher access required' });
        }
        // Find the course offering (handle both offering ID and course ID)
        let courseOffering = yield prisma.courseOffering.findFirst({
            where: {
                id: courseId,
                teacherId: teacher.id
            }
        });
        if (!courseOffering) {
            courseOffering = yield prisma.courseOffering.findFirst({
                where: {
                    courseId: courseId,
                    teacherId: teacher.id
                }
            });
        }
        if (!courseOffering) {
            return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
        }
        const classDate = new Date(date);
        // Check if attendance session already exists for this date and course
        const existingSession = yield prisma.attendance.findFirst({
            where: {
                offeringId: courseOffering.id,
                classDate: classDate,
                teacherId: teacher.id,
                periodNumber: periodNumber || 1
            }
        });
        if (existingSession) {
            return res.status(400).json({
                status: 'error',
                message: 'Attendance session already exists for this date and period'
            });
        }
        // Create attendance session
        const attendanceSession = yield prisma.attendance.create({
            data: {
                offeringId: courseOffering.id,
                teacherId: teacher.id,
                classDate: classDate,
                periodNumber: periodNumber || 1,
                syllabusCovered: syllabusCovered || '',
                status: 'confirmed'
            }
        });
        // Get all students enrolled in this course
        const enrollments = yield prisma.studentEnrollment.findMany({
            where: {
                offeringId: courseOffering.id
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });
        // Create attendance records for all enrolled students
        const attendanceRecords = yield Promise.all(enrollments.map(enrollment => prisma.attendanceRecord.create({
            data: {
                attendanceId: attendanceSession.id,
                studentId: enrollment.studentId,
                status: 'absent' // Default to absent, teacher can mark present
            }
        })));
        // Return the created session with student records
        const sessionWithRecords = yield prisma.attendance.findUnique({
            where: { id: attendanceSession.id },
            include: {
                attendanceRecords: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                },
                offering: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        }
                    }
                }
            }
        });
        res.json({
            status: 'success',
            message: `Attendance session created with ${attendanceRecords.length} students`,
            data: {
                sessionId: attendanceSession.id,
                date: attendanceSession.classDate,
                period: attendanceSession.periodNumber,
                course: (sessionWithRecords === null || sessionWithRecords === void 0 ? void 0 : sessionWithRecords.offering) ? {
                    id: sessionWithRecords.offering.course.id,
                    name: sessionWithRecords.offering.course.name,
                    code: sessionWithRecords.offering.course.code
                } : null,
                studentsCount: attendanceRecords.length,
                records: (sessionWithRecords === null || sessionWithRecords === void 0 ? void 0 : sessionWithRecords.attendanceRecords.map(record => {
                    var _a, _b, _c, _d, _e;
                    return ({
                        id: record.id,
                        studentId: record.studentId,
                        usn: ((_a = record.student) === null || _a === void 0 ? void 0 : _a.usn) || ((_c = (_b = record.student) === null || _b === void 0 ? void 0 : _b.user) === null || _c === void 0 ? void 0 : _c.email) || 'N/A',
                        student_name: ((_e = (_d = record.student) === null || _d === void 0 ? void 0 : _d.user) === null || _e === void 0 ? void 0 : _e.name) || 'Unknown',
                        status: record.status
                    });
                })) || []
            }
        });
    }
    catch (error) {
        console.error('Error creating attendance session:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create attendance session',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Get student attendance for a specific course and date
router.get('/attendance/students', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const prisma = database_1.default.getInstance();
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { courseId, date } = req.query;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User authentication required' });
        }
        if (!courseId || !date) {
            return res.status(400).json({
                status: 'error',
                message: 'courseId and date are required'
            });
        }
        // Get teacher's information
        const teacher = yield prisma.teacher.findFirst({
            where: { userId: userId }
        });
        if (!teacher) {
            return res.status(403).json({ status: 'error', message: 'Teacher access required' });
        }
        // Find the course offering
        let courseOffering = yield prisma.courseOffering.findFirst({
            where: {
                id: courseId,
                teacherId: teacher.id
            },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        });
        if (!courseOffering) {
            courseOffering = yield prisma.courseOffering.findFirst({
                where: {
                    courseId: courseId,
                    teacherId: teacher.id
                },
                include: {
                    course: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    }
                }
            });
        }
        if (!courseOffering) {
            return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
        }
        const classDate = new Date(date);
        // Get all students enrolled in this course
        const enrollments = yield prisma.studentEnrollment.findMany({
            where: { offeringId: courseOffering.id },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
        // Find attendance session for this date
        const attendanceSession = yield prisma.attendance.findFirst({
            where: {
                offeringId: courseOffering.id,
                classDate: classDate,
                teacherId: teacher.id
            },
            include: {
                attendanceRecords: true
            }
        });
        // Build student attendance data
        const studentAttendanceData = enrollments.map(enrollment => {
            var _a, _b, _c;
            const attendanceRecord = attendanceSession === null || attendanceSession === void 0 ? void 0 : attendanceSession.attendanceRecords.find(record => record.studentId === enrollment.studentId);
            return {
                studentId: enrollment.studentId,
                usn: ((_a = enrollment.student) === null || _a === void 0 ? void 0 : _a.usn) || '',
                student_name: ((_c = (_b = enrollment.student) === null || _b === void 0 ? void 0 : _b.user) === null || _c === void 0 ? void 0 : _c.name) || 'Unknown',
                status: attendanceRecord ? attendanceRecord.status : 'unmarked',
                attendanceRecordId: attendanceRecord === null || attendanceRecord === void 0 ? void 0 : attendanceRecord.id,
                courseId: courseOffering.course.id,
                courseName: `${courseOffering.course.code} - ${courseOffering.course.name}`
            };
        });
        res.json({
            status: 'success',
            data: studentAttendanceData
        });
    }
    catch (error) {
        console.error('Error getting student attendance:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get student attendance',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Update individual student attendance
router.put('/attendance/student', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const prisma = database_1.default.getInstance();
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { studentId, courseId, date, status } = req.body;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User authentication required' });
        }
        if (!studentId || !courseId || !date || !status) {
            return res.status(400).json({
                status: 'error',
                message: 'studentId, courseId, date, and status are required'
            });
        }
        if (!['present', 'absent', 'unmarked'].includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Status must be present, absent, or unmarked'
            });
        }
        // Get teacher's information
        const teacher = yield prisma.teacher.findFirst({
            where: { userId: userId }
        });
        if (!teacher) {
            return res.status(403).json({ status: 'error', message: 'Teacher access required' });
        }
        // Find the course offering
        let courseOffering = yield prisma.courseOffering.findFirst({
            where: {
                id: courseId,
                teacherId: teacher.id
            }
        });
        if (!courseOffering) {
            courseOffering = yield prisma.courseOffering.findFirst({
                where: {
                    courseId: courseId,
                    teacherId: teacher.id
                }
            });
        }
        if (!courseOffering) {
            return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
        }
        const classDate = new Date(date);
        // Find or create attendance session for this date
        let attendanceSession = yield prisma.attendance.findFirst({
            where: {
                offeringId: courseOffering.id,
                classDate: classDate,
                teacherId: teacher.id
            }
        });
        if (!attendanceSession) {
            // Create attendance session if it doesn't exist
            attendanceSession = yield prisma.attendance.create({
                data: {
                    offeringId: courseOffering.id,
                    teacherId: teacher.id,
                    classDate: classDate,
                    periodNumber: 1,
                    syllabusCovered: `Attendance session for ${classDate.toISOString().split('T')[0]}`,
                    status: 'confirmed'
                }
            });
            // Create attendance records for all students in the course
            const enrollments = yield prisma.studentEnrollment.findMany({
                where: { offeringId: courseOffering.id }
            });
            yield Promise.all(enrollments.map(enrollment => prisma.attendanceRecord.create({
                data: {
                    attendanceId: attendanceSession.id,
                    studentId: enrollment.studentId,
                    status: 'absent' // Default to absent
                }
            })));
        }
        // Find or create the specific student's attendance record
        let attendanceRecord = yield prisma.attendanceRecord.findFirst({
            where: {
                attendanceId: attendanceSession.id,
                studentId: studentId
            }
        });
        if (!attendanceRecord) {
            // Create record if student is not yet in the session
            attendanceRecord = yield prisma.attendanceRecord.create({
                data: {
                    attendanceId: attendanceSession.id,
                    studentId: studentId,
                    status: status === 'unmarked' ? 'absent' : status
                }
            });
        }
        else {
            // Update existing record
            if (status === 'unmarked') {
                // Delete the record to mark as unmarked
                yield prisma.attendanceRecord.delete({
                    where: { id: attendanceRecord.id }
                });
                attendanceRecord = null;
            }
            else {
                // Update the status
                attendanceRecord = yield prisma.attendanceRecord.update({
                    where: { id: attendanceRecord.id },
                    data: { status: status }
                });
            }
        }
        // Get updated student info
        const student = yield prisma.student.findUnique({
            where: { id: studentId },
            include: {
                user: {
                    select: { name: true }
                }
            }
        });
        res.json({
            status: 'success',
            message: `Student attendance updated to ${status}`,
            data: {
                studentId: studentId,
                student_name: ((_b = student === null || student === void 0 ? void 0 : student.user) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown',
                usn: (student === null || student === void 0 ? void 0 : student.usn) || '',
                status: attendanceRecord ? attendanceRecord.status : 'unmarked',
                date: date,
                sessionId: attendanceSession.id
            }
        });
    }
    catch (error) {
        console.error('Error updating student attendance:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update student attendance',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
exports.default = router;
