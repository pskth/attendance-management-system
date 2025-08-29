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
// src/routes/admin/attendanceRoutes.ts
const express_1 = require("express");
const database_1 = __importDefault(require("../../lib/database"));
const router = (0, express_1.Router)();
console.log('=== ADMIN ATTENDANCE ROUTES LOADED ===');
// Get courses assigned to the current user (for filtering attendance management)
router.get('/assigned-courses', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const prisma = database_1.default.getInstance();
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                status: 'error',
                error: 'User authentication required'
            });
        }
        // Check user roles
        const userRoles = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.roles) || [];
        // If user is admin, return all courses
        if (userRoles.includes('admin')) {
            const allCourses = yield prisma.course.findMany({
                include: {
                    department: true,
                    courseOfferings: {
                        include: {
                            sections: true,
                            academic_years: true
                        }
                    }
                },
                orderBy: {
                    name: 'asc'
                }
            });
            const formattedCourses = allCourses.map(course => {
                var _a;
                return ({
                    id: course.id,
                    code: course.code,
                    name: course.name,
                    type: course.type,
                    department: (_a = course.department) === null || _a === void 0 ? void 0 : _a.name,
                    hasTheoryComponent: course.hasTheoryComponent,
                    hasLabComponent: course.hasLabComponent
                });
            });
            return res.json({
                status: 'success',
                data: formattedCourses
            });
        }
        // If user is teacher, return only courses they're assigned to
        if (userRoles.includes('teacher')) {
            const teacher = yield prisma.teacher.findUnique({
                where: { userId: userId },
                include: {
                    courseOfferings: {
                        include: {
                            course: {
                                include: {
                                    department: true
                                }
                            },
                            sections: true,
                            academic_years: true
                        }
                    }
                }
            });
            if (!teacher) {
                return res.json({
                    status: 'success',
                    data: []
                });
            }
            // Get unique courses from course offerings
            const assignedCourses = teacher.courseOfferings.reduce((acc, offering) => {
                var _a;
                const course = offering.course;
                if (!acc.find(c => c.id === course.id)) {
                    acc.push({
                        id: course.id,
                        code: course.code,
                        name: course.name,
                        type: course.type,
                        department: (_a = course.department) === null || _a === void 0 ? void 0 : _a.name,
                        hasTheoryComponent: course.hasTheoryComponent,
                        hasLabComponent: course.hasLabComponent
                    });
                }
                return acc;
            }, []);
            return res.json({
                status: 'success',
                data: assignedCourses
            });
        }
        // For other roles, return empty list
        return res.json({
            status: 'success',
            data: []
        });
    }
    catch (error) {
        console.error('Error fetching assigned courses:', error);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Get attendance for a specific date
router.get('/attendance', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        console.log('=== ATTENDANCE ENDPOINT HIT ===');
        const { date, courseId, departmentId } = req.query;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const userRoles = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.roles) || [];
        if (!date || typeof date !== 'string') {
            res.status(400).json({
                status: 'error',
                error: 'Date parameter is required'
            });
            return;
        }
        if (!userId) {
            return res.status(401).json({
                status: 'error',
                error: 'User authentication required'
            });
        }
        const prisma = database_1.default.getInstance();
        const targetDate = new Date(date);
        console.log('Query date:', date);
        console.log('User roles:', userRoles);
        // Get courses that the user is allowed to view
        let allowedCourseIds = [];
        if (userRoles.includes('admin')) {
            // Admin can see all courses
            const allCourses = yield prisma.course.findMany({
                select: { id: true }
            });
            allowedCourseIds = allCourses.map(c => c.id);
        }
        else if (userRoles.includes('teacher')) {
            // Teacher can only see courses they're assigned to
            const teacher = yield prisma.teacher.findUnique({
                where: { userId: userId },
                include: {
                    courseOfferings: {
                        include: {
                            course: true
                        }
                    }
                }
            });
            if (teacher) {
                allowedCourseIds = [...new Set(teacher.courseOfferings.map(offering => offering.course.id))];
            }
        }
        console.log('Allowed course IDs:', allowedCourseIds);
        // Apply course filter if specified and user is allowed to view it
        let courseFilter = {};
        if (courseId && typeof courseId === 'string') {
            if (allowedCourseIds.includes(courseId)) {
                courseFilter = { id: courseId };
            }
            else {
                // User is not allowed to view this course
                return res.json({
                    status: 'success',
                    data: [],
                    count: 0,
                    message: 'Access denied to this course'
                });
            }
        }
        else {
            // Filter to only allowed courses
            if (allowedCourseIds.length > 0) {
                courseFilter = { id: { in: allowedCourseIds } };
            }
            else {
                // User has no course access
                return res.json({
                    status: 'success',
                    data: [],
                    count: 0
                });
            }
        }
        // First, get all students who should have attendance for this date
        // We'll get all students from active courses/offerings that the user can access
        const students = yield prisma.student.findMany({
            include: {
                user: true,
                sections: true,
                departments: true,
                enrollments: {
                    include: {
                        offering: {
                            include: {
                                course: true
                            }
                        }
                    },
                    where: {
                        offering: {
                            course: courseFilter
                        }
                    }
                }
            },
            where: {
                enrollments: {
                    some: {
                        offering: {
                            course: courseFilter
                        }
                    }
                }
            },
            orderBy: {
                usn: 'asc'
            }
        });
        console.log(`Found ${students.length} total students`);
        // Get existing attendance records for this date (filtered by allowed courses)
        const existingAttendance = yield prisma.attendanceRecord.findMany({
            where: {
                attendance: {
                    classDate: targetDate,
                    offering: {
                        course: courseFilter
                    }
                }
            },
            include: {
                student: true,
                attendance: {
                    include: {
                        offering: {
                            include: {
                                course: true
                            }
                        }
                    }
                }
            }
        });
        console.log(`Found ${existingAttendance.length} existing attendance records for date ${date}`);
        // Create a map of existing attendance by student ID
        const attendanceMap = new Map();
        existingAttendance.forEach(record => {
            attendanceMap.set(record.studentId, record);
        });
        // Transform the data for frontend - show all students with their attendance status
        const transformedData = students.map(student => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
            const attendanceRecord = attendanceMap.get(student.id);
            // If student has attendance record, use it; otherwise show as "not marked"
            if (attendanceRecord) {
                return {
                    id: attendanceRecord.id,
                    date: ((_b = (_a = attendanceRecord.attendance) === null || _a === void 0 ? void 0 : _a.classDate) === null || _b === void 0 ? void 0 : _b.toISOString().split('T')[0]) || date,
                    studentId: student.id,
                    usn: student.usn,
                    student_name: ((_c = student.user) === null || _c === void 0 ? void 0 : _c.name) || '',
                    status: attendanceRecord.status,
                    courseId: (_f = (_e = (_d = attendanceRecord.attendance) === null || _d === void 0 ? void 0 : _d.offering) === null || _e === void 0 ? void 0 : _e.course) === null || _f === void 0 ? void 0 : _f.id,
                    courseName: (_j = (_h = (_g = attendanceRecord.attendance) === null || _g === void 0 ? void 0 : _g.offering) === null || _h === void 0 ? void 0 : _h.course) === null || _j === void 0 ? void 0 : _j.name,
                    courseCode: (_m = (_l = (_k = attendanceRecord.attendance) === null || _k === void 0 ? void 0 : _k.offering) === null || _l === void 0 ? void 0 : _l.course) === null || _m === void 0 ? void 0 : _m.code,
                    periodNumber: (_o = attendanceRecord.attendance) === null || _o === void 0 ? void 0 : _o.periodNumber,
                    sectionName: ((_p = student.sections) === null || _p === void 0 ? void 0 : _p.section_name) || 'Section A'
                };
            }
            else {
                // Student doesn't have attendance record yet - show as "not marked"
                const primaryEnrollment = student.enrollments[0]; // Use first enrollment as default
                return {
                    id: `pending-${student.id}`,
                    date: date,
                    studentId: student.id,
                    usn: student.usn,
                    student_name: ((_q = student.user) === null || _q === void 0 ? void 0 : _q.name) || '',
                    status: 'not_marked',
                    courseId: ((_s = (_r = primaryEnrollment === null || primaryEnrollment === void 0 ? void 0 : primaryEnrollment.offering) === null || _r === void 0 ? void 0 : _r.course) === null || _s === void 0 ? void 0 : _s.id) || null,
                    courseName: ((_u = (_t = primaryEnrollment === null || primaryEnrollment === void 0 ? void 0 : primaryEnrollment.offering) === null || _t === void 0 ? void 0 : _t.course) === null || _u === void 0 ? void 0 : _u.name) || 'No Course',
                    courseCode: ((_w = (_v = primaryEnrollment === null || primaryEnrollment === void 0 ? void 0 : primaryEnrollment.offering) === null || _v === void 0 ? void 0 : _v.course) === null || _w === void 0 ? void 0 : _w.code) || 'N/A',
                    periodNumber: 1,
                    sectionName: ((_x = student.sections) === null || _x === void 0 ? void 0 : _x.section_name) || 'Section A'
                };
            }
        });
        res.json({
            status: 'success',
            data: transformedData,
            count: transformedData.length
        });
    }
    catch (error) {
        console.error('Error fetching attendance data:', error);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Update attendance status for a specific record
router.put('/attendance/:attendanceId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { attendanceId } = req.params;
        const { status } = req.body;
        if (!status || !['present', 'absent'].includes(status)) {
            res.status(400).json({
                status: 'error',
                error: 'Valid status (present/absent) is required'
            });
            return;
        }
        const prisma = database_1.default.getInstance();
        const updatedRecord = yield prisma.attendanceRecord.update({
            where: { id: attendanceId },
            data: { status },
            include: {
                student: {
                    include: {
                        user: true
                    }
                },
                attendance: true
            }
        });
        res.json({
            status: 'success',
            data: {
                id: updatedRecord.id,
                date: ((_b = (_a = updatedRecord.attendance) === null || _a === void 0 ? void 0 : _a.classDate) === null || _b === void 0 ? void 0 : _b.toISOString().split('T')[0]) || '',
                studentId: updatedRecord.studentId,
                usn: ((_c = updatedRecord.student) === null || _c === void 0 ? void 0 : _c.usn) || '',
                student_name: ((_e = (_d = updatedRecord.student) === null || _d === void 0 ? void 0 : _d.user) === null || _e === void 0 ? void 0 : _e.name) || '',
                status: updatedRecord.status
            }
        });
    }
    catch (error) {
        console.error('Error updating attendance:', error);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Create attendance record for a specific student
router.post('/attendance', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
    try {
        const { studentId, date, status, courseId } = req.body;
        if (!studentId || !date || !status) {
            res.status(400).json({
                status: 'error',
                error: 'studentId, date, and status are required'
            });
            return;
        }
        if (!['present', 'absent'].includes(status)) {
            res.status(400).json({
                status: 'error',
                error: 'Status must be either present or absent'
            });
            return;
        }
        const prisma = database_1.default.getInstance();
        const targetDate = new Date(date);
        // Find a suitable course offering for this student and date
        let courseOfferingId = null;
        if (courseId) {
            // Try to find a specific course offering for the given course
            const courseOffering = yield prisma.courseOffering.findFirst({
                where: {
                    courseId: courseId
                }
            });
            courseOfferingId = courseOffering === null || courseOffering === void 0 ? void 0 : courseOffering.id;
        }
        if (!courseOfferingId) {
            // Fall back to any course offering the student is enrolled in
            const student = yield prisma.student.findUnique({
                where: { id: studentId },
                include: {
                    enrollments: {
                        include: {
                            offering: true
                        },
                        take: 1
                    }
                }
            });
            if ((_b = (_a = student === null || student === void 0 ? void 0 : student.enrollments) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.offering) {
                courseOfferingId = student.enrollments[0].offering.id;
            }
        }
        if (!courseOfferingId) {
            res.status(400).json({
                status: 'error',
                error: 'No suitable course offering found for this student'
            });
            return;
        }
        // Check if attendance record already exists for this date and offering
        const existingAttendance = yield prisma.attendance.findFirst({
            where: {
                classDate: targetDate,
                offeringId: courseOfferingId
            }
        });
        let attendanceId;
        if (existingAttendance) {
            attendanceId = existingAttendance.id;
        }
        else {
            // Create new attendance session
            const newAttendance = yield prisma.attendance.create({
                data: {
                    classDate: targetDate,
                    offeringId: courseOfferingId,
                    periodNumber: 1
                }
            });
            attendanceId = newAttendance.id;
        }
        // Check if student already has an attendance record for this session
        const existingRecord = yield prisma.attendanceRecord.findFirst({
            where: {
                studentId: studentId,
                attendanceId: attendanceId
            }
        });
        if (existingRecord) {
            // Update existing record
            const updatedRecord = yield prisma.attendanceRecord.update({
                where: { id: existingRecord.id },
                data: { status },
                include: {
                    student: {
                        include: {
                            user: true
                        }
                    },
                    attendance: {
                        include: {
                            offering: {
                                include: {
                                    course: true
                                }
                            }
                        }
                    }
                }
            });
            res.json({
                status: 'success',
                data: {
                    id: updatedRecord.id,
                    date: ((_d = (_c = updatedRecord.attendance) === null || _c === void 0 ? void 0 : _c.classDate) === null || _d === void 0 ? void 0 : _d.toISOString().split('T')[0]) || date,
                    studentId: updatedRecord.studentId,
                    usn: ((_e = updatedRecord.student) === null || _e === void 0 ? void 0 : _e.usn) || '',
                    student_name: ((_g = (_f = updatedRecord.student) === null || _f === void 0 ? void 0 : _f.user) === null || _g === void 0 ? void 0 : _g.name) || '',
                    status: updatedRecord.status,
                    courseId: (_k = (_j = (_h = updatedRecord.attendance) === null || _h === void 0 ? void 0 : _h.offering) === null || _j === void 0 ? void 0 : _j.course) === null || _k === void 0 ? void 0 : _k.id,
                    courseName: (_o = (_m = (_l = updatedRecord.attendance) === null || _l === void 0 ? void 0 : _l.offering) === null || _m === void 0 ? void 0 : _m.course) === null || _o === void 0 ? void 0 : _o.name
                }
            });
        }
        else {
            // Create new record
            const newRecord = yield prisma.attendanceRecord.create({
                data: {
                    studentId: studentId,
                    attendanceId: attendanceId,
                    status: status
                },
                include: {
                    student: {
                        include: {
                            user: true
                        }
                    },
                    attendance: {
                        include: {
                            offering: {
                                include: {
                                    course: true
                                }
                            }
                        }
                    }
                }
            });
            res.json({
                status: 'success',
                data: {
                    id: newRecord.id,
                    date: ((_q = (_p = newRecord.attendance) === null || _p === void 0 ? void 0 : _p.classDate) === null || _q === void 0 ? void 0 : _q.toISOString().split('T')[0]) || date,
                    studentId: newRecord.studentId,
                    usn: ((_r = newRecord.student) === null || _r === void 0 ? void 0 : _r.usn) || '',
                    student_name: ((_t = (_s = newRecord.student) === null || _s === void 0 ? void 0 : _s.user) === null || _t === void 0 ? void 0 : _t.name) || '',
                    status: newRecord.status,
                    courseId: (_w = (_v = (_u = newRecord.attendance) === null || _u === void 0 ? void 0 : _u.offering) === null || _v === void 0 ? void 0 : _v.course) === null || _w === void 0 ? void 0 : _w.id,
                    courseName: (_z = (_y = (_x = newRecord.attendance) === null || _x === void 0 ? void 0 : _x.offering) === null || _y === void 0 ? void 0 : _y.course) === null || _z === void 0 ? void 0 : _z.name
                }
            });
        }
    }
    catch (error) {
        console.error('Error creating/updating attendance record:', error);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
exports.default = router;
