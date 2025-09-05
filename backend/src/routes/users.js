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
// src/routes/users.ts
const express_1 = require("express");
const database_1 = __importDefault(require("../lib/database"));
const autoEnrollmentService_1 = require("../services/autoEnrollmentService");
const router = (0, express_1.Router)();
// Get all users with roles
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        const users = yield prisma.user.findMany({
            include: {
                userRoles: true,
                student: {
                    include: {
                        colleges: true,
                        departments: true,
                        sections: true,
                        enrollments: {
                            include: {
                                offering: {
                                    include: {
                                        course: true
                                    }
                                }
                            }
                        }
                    }
                },
                teacher: {
                    include: {
                        colleges: true,
                        department: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json({
            status: 'success',
            data: users,
            count: users.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            status: 'error',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
// Get users by role
router.get('/role/:role', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { role } = req.params;
        const prisma = database_1.default.getInstance();
        const users = yield prisma.user.findMany({
            where: {
                userRoles: {
                    some: {
                        role: role
                    }
                }
            },
            include: {
                userRoles: true,
                student: {
                    include: {
                        colleges: true,
                        departments: true,
                        sections: true,
                        enrollments: {
                            include: {
                                offering: {
                                    include: {
                                        course: true
                                    }
                                }
                            }
                        }
                    }
                },
                teacher: {
                    include: {
                        colleges: true,
                        department: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json({
            status: 'success',
            data: users,
            count: users.length,
            role: role,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            status: 'error',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
// Get user by ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const prisma = database_1.default.getInstance();
        const user = yield prisma.user.findUnique({
            where: { id },
            include: {
                userRoles: true,
                student: {
                    include: {
                        colleges: true,
                        departments: true,
                        sections: true,
                        enrollments: {
                            include: {
                                offering: {
                                    include: {
                                        course: true,
                                        teacher: {
                                            include: {
                                                user: {
                                                    select: {
                                                        name: true,
                                                        username: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                teacher: {
                    include: {
                        colleges: true,
                        department: true,
                        courseOfferings: {
                            include: {
                                course: true,
                                sections: true
                            }
                        }
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({
                status: 'error',
                error: 'User not found',
                timestamp: new Date().toISOString()
            });
        }
        res.json({
            status: 'success',
            data: user,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            status: 'error',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
// Create new user
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, username, phone, role, password, departmentId, year, section, email, usn, collegeId } = req.body;
        console.log(`🔍 Received request body:`, req.body);
        console.log(`🔍 Extracted parameters:`, { name, username, phone, role, password, departmentId, year, section, email, usn, collegeId });
        if (!name || !username || !role) {
            return res.status(400).json({
                status: 'error',
                error: 'Missing required fields: name, username, role',
                timestamp: new Date().toISOString()
            });
        }
        // Validate role
        const validRoles = ['student', 'teacher', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                status: 'error',
                error: 'Invalid role. Must be one of: student, teacher, admin',
                timestamp: new Date().toISOString()
            });
        }
        const prisma = database_1.default.getInstance();
        // Check if user already exists
        const existingUser = yield prisma.user.findFirst({
            where: { username: username }
        });
        if (existingUser) {
            return res.status(409).json({
                status: 'error',
                error: 'User with this username already exists',
                timestamp: new Date().toISOString()
            });
        }
        // Create user
        const user = yield prisma.user.create({
            data: {
                name: name.trim(),
                username: username.trim(),
                email: (email === null || email === void 0 ? void 0 : email.trim()) || null,
                phone: (phone === null || phone === void 0 ? void 0 : phone.trim()) || null,
                passwordHash: password || 'default123' // Default password if not provided
            },
            include: {
                userRoles: true,
                student: {
                    include: {
                        colleges: true,
                        departments: true,
                        sections: true
                    }
                },
                teacher: {
                    include: {
                        colleges: true,
                        department: true
                    }
                }
            }
        });
        // Create user role assignment
        yield prisma.userRoleAssignment.create({
            data: {
                userId: user.id,
                role: role
            }
        });
        // Create role-specific records
        if (role === 'student') {
            // Use provided collegeId if present, otherwise fallback to department or first college
            let collegeIdToUse = collegeId || null;
            let departmentIdToUse = null;
            if (departmentId) {
                console.log(`🔍 Looking up department with ID: ${departmentId}`);
                // Get the department and its college
                const department = yield prisma.department.findUnique({
                    where: { id: departmentId },
                    include: { colleges: true }
                });
                console.log(`🔍 Department lookup result:`, department);
                if (department) {
                    if (!collegeIdToUse)
                        collegeIdToUse = department.college_id;
                    departmentIdToUse = departmentId;
                    console.log(`✅ Department found. Using collegeId: ${collegeIdToUse}, departmentId: ${departmentIdToUse}`);
                }
                else {
                    console.log(`❌ Department not found for ID: ${departmentId}`);
                }
            }
            // Fallback to first college if not provided
            if (!collegeIdToUse) {
                const firstCollege = yield prisma.college.findFirst();
                if (!firstCollege) {
                    return res.status(500).json({
                        status: 'error',
                        error: 'No college found in the system',
                        timestamp: new Date().toISOString()
                    });
                }
                collegeIdToUse = firstCollege.id;
            }
            // Calculate semester from year (1st year = semesters 1-2, 2nd year = semesters 3-4, etc.)
            const semester = year ? (year * 2 - 1) : 1; // Default to semester 1 if no year provided
            console.log(`🔍 Final student creation parameters:`, {
                collegeIdToUse,
                departmentIdToUse,
                calculatedSemester: semester,
                providedYear: year
            });
            // Create section if provided
            let sectionId = null;
            if (section && section.trim()) {
                // Try to find existing section or create new one
                const existingSection = yield prisma.sections.findFirst({
                    where: { section_name: section.trim() }
                });
                if (existingSection) {
                    sectionId = existingSection.section_id;
                }
                else if (departmentIdToUse) {
                    // Create new section only if we have a department
                    const newSection = yield prisma.sections.create({
                        data: {
                            section_name: section.trim(),
                            department_id: departmentIdToUse
                        }
                    });
                    sectionId = newSection.section_id;
                }
            }
            const createdStudent = yield prisma.student.create({
                data: {
                    userId: user.id,
                    college_id: collegeIdToUse,
                    department_id: departmentIdToUse,
                    section_id: sectionId,
                    usn: usn || `USN${Date.now()}`,
                    semester: semester,
                    batchYear: new Date().getFullYear()
                }
            });
            // Auto-enroll student in core courses for their department and semester
            if (departmentIdToUse && semester) {
                try {
                    // Use the specific semester enrollment function for better course separation
                    const enrollmentResult = yield (0, autoEnrollmentService_1.autoEnrollStudentForSemester)(createdStudent.id, semester);
                    console.log(`Auto-enrollment for student ${createdStudent.id} (semester ${semester}):`, enrollmentResult);
                }
                catch (enrollmentError) {
                    console.warn(`Failed to auto-enroll student ${createdStudent.id}:`, enrollmentError);
                    // Don't fail the user creation if auto-enrollment fails
                }
            }
        }
        else if (role === 'teacher') {
            // Use provided collegeId if present, otherwise fallback to department or first college
            let collegeIdToUse = collegeId || null;
            if (!collegeIdToUse && departmentId) {
                const department = yield prisma.department.findUnique({
                    where: { id: departmentId },
                    include: { colleges: true }
                });
                if (department) {
                    collegeIdToUse = department.college_id;
                }
            }
            if (!collegeIdToUse) {
                const firstCollege = yield prisma.college.findFirst();
                if (!firstCollege) {
                    return res.status(500).json({
                        status: 'error',
                        error: 'No college found in the system',
                        timestamp: new Date().toISOString()
                    });
                }
                collegeIdToUse = firstCollege.id;
            }
            yield prisma.teacher.create({
                data: {
                    userId: user.id,
                    college_id: collegeIdToUse
                }
            });
        }
        else if (role === 'admin') {
            yield prisma.admin.create({
                data: {
                    userId: user.id
                }
            });
        }
        // Fetch the complete user with all relations
        const completeUser = yield prisma.user.findUnique({
            where: { id: user.id },
            include: {
                userRoles: true,
                student: {
                    include: {
                        colleges: true,
                        departments: true,
                        sections: true,
                        enrollments: {
                            include: {
                                offering: {
                                    include: {
                                        course: true
                                    }
                                }
                            }
                        }
                    }
                },
                teacher: {
                    include: {
                        colleges: true,
                        department: true
                    }
                }
            }
        });
        res.status(201).json({
            status: 'success',
            data: completeUser,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error creating user:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            status: 'error',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
// Update user
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const { name, username, phone, role, departmentId, year, section, usn, email } = req.body;
        const { collegeId } = req.body;
        if (!name || !username || !role) {
            return res.status(400).json({
                status: 'error',
                error: 'Missing required fields: name, username, role',
                timestamp: new Date().toISOString()
            });
        }
        // Validate role
        const validRoles = ['student', 'teacher', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                status: 'error',
                error: 'Invalid role. Must be one of: student, teacher, admin',
                timestamp: new Date().toISOString()
            });
        }
        const prisma = database_1.default.getInstance();
        // Check if user exists
        const existingUser = yield prisma.user.findUnique({
            where: { id },
            include: {
                userRoles: true,
                student: true,
                teacher: true,
                admin: true
            }
        });
        if (!existingUser) {
            return res.status(404).json({
                status: 'error',
                error: 'User not found',
                timestamp: new Date().toISOString()
            });
        }
        // Check if username conflicts with other users
        const conflictUser = yield prisma.user.findFirst({
            where: {
                AND: [
                    { id: { not: id } },
                    { username: username }
                ]
            }
        });
        if (conflictUser) {
            return res.status(409).json({
                status: 'error',
                error: 'Username already exists for another user',
                timestamp: new Date().toISOString()
            });
        }
        // Update user basic info
        const updatedUser = yield prisma.user.update({
            where: { id },
            data: {
                name: name.trim(),
                username: username.trim(),
                email: (email === null || email === void 0 ? void 0 : email.trim()) || null,
                phone: (phone === null || phone === void 0 ? void 0 : phone.trim()) || null
            }
        });
        // Handle role changes
        const currentRole = (_b = (_a = existingUser.userRoles) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.role;
        if (currentRole !== role) {
            // Delete existing role assignments
            yield prisma.userRoleAssignment.deleteMany({
                where: { userId: id }
            });
            // Create new role assignment
            yield prisma.userRoleAssignment.create({
                data: {
                    userId: id,
                    role: role
                }
            });
            // Get the first college for role-specific records (temporary approach)
            const firstCollege = yield prisma.college.findFirst();
            if (!firstCollege) {
                return res.status(500).json({
                    status: 'error',
                    error: 'No college found in the system',
                    timestamp: new Date().toISOString()
                });
            }
            // Handle role-specific record changes
            if (currentRole === 'student' && existingUser.student) {
                yield prisma.student.delete({
                    where: { id: existingUser.student.id }
                });
            }
            else if (currentRole === 'teacher' && existingUser.teacher) {
                yield prisma.teacher.delete({
                    where: { id: existingUser.teacher.id }
                });
            }
            else if (currentRole === 'admin' && existingUser.admin) {
                yield prisma.admin.delete({
                    where: { userId: id }
                });
            }
            // Create new role-specific records
            if (role === 'student') {
                yield prisma.student.create({
                    data: {
                        userId: id,
                        college_id: firstCollege.id,
                        usn: `USN${Date.now()}`,
                        semester: 1,
                        batchYear: new Date().getFullYear()
                    }
                });
            }
            else if (role === 'teacher') {
                yield prisma.teacher.create({
                    data: {
                        userId: id,
                        college_id: firstCollege.id
                    }
                });
            }
            else if (role === 'admin') {
                yield prisma.admin.create({
                    data: {
                        userId: id
                    }
                });
            }
        }
        // Update student-specific fields if user is a student
        if (role === 'student' && existingUser.student) {
            let collegeId = existingUser.student.college_id;
            let departmentIdToUse = existingUser.student.department_id;
            // Update department if provided
            if (departmentId) {
                const department = yield prisma.department.findUnique({
                    where: { id: departmentId },
                    include: { colleges: true }
                });
                if (department) {
                    collegeId = department.college_id;
                    departmentIdToUse = departmentId;
                }
            }
            // Calculate semester from year if provided
            let semester = existingUser.student.semester;
            if (year) {
                semester = year * 2 - 1; // 1st year = semester 1, 2nd year = semester 3, etc.
            }
            // Handle section update
            let sectionId = existingUser.student.section_id;
            if (section !== undefined) {
                if (section && section.trim()) {
                    // Try to find existing section or create new one
                    const existingSection = yield prisma.sections.findFirst({
                        where: { section_name: section.trim() }
                    });
                    if (existingSection) {
                        sectionId = existingSection.section_id;
                    }
                    else if (departmentIdToUse) {
                        // Create new section only if we have a department
                        const newSection = yield prisma.sections.create({
                            data: {
                                section_name: section.trim(),
                                department_id: departmentIdToUse
                            }
                        });
                        sectionId = newSection.section_id;
                    }
                }
                else {
                    sectionId = null; // Clear section if empty string provided
                }
            }
            // Update student record
            yield prisma.student.update({
                where: { id: existingUser.student.id },
                data: {
                    college_id: collegeId,
                    department_id: departmentIdToUse,
                    section_id: sectionId,
                    usn: usn || existingUser.student.usn,
                    semester: semester,
                    batchYear: existingUser.student.batchYear // Keep existing batch year
                }
            });
        }
        // Update teacher-specific fields if user is a teacher
        if (role === 'teacher' && existingUser.teacher) {
            let collegeId = existingUser.teacher.college_id;
            let departmentIdToUse = existingUser.teacher.departmentId;
            // Update department if provided
            if (departmentId) {
                const department = yield prisma.department.findUnique({
                    where: { id: departmentId },
                    include: { colleges: true }
                });
                if (department) {
                    collegeId = department.college_id;
                    departmentIdToUse = departmentId;
                }
            }
            // Update teacher record
            yield prisma.teacher.update({
                where: { id: existingUser.teacher.id },
                data: {
                    college_id: collegeId,
                    departmentId: departmentIdToUse
                }
            });
        }
        // Fetch the complete updated user
        const completeUser = yield prisma.user.findUnique({
            where: { id },
            include: {
                userRoles: true,
                student: {
                    include: {
                        colleges: true,
                        departments: true,
                        sections: true,
                        enrollments: {
                            include: {
                                offering: {
                                    include: {
                                        course: true
                                    }
                                }
                            }
                        }
                    }
                },
                teacher: {
                    include: {
                        colleges: true,
                        department: true
                    }
                }
            }
        });
        res.json({
            status: 'success',
            data: completeUser,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error updating user:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            status: 'error',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
// Delete user
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        const userId = req.params.id;
        // Check if user exists and get dependencies
        const existingUser = yield prisma.user.findUnique({
            where: { id: userId },
            include: {
                student: {
                    include: {
                        _count: {
                            select: {
                                enrollments: true,
                                attendanceRecords: true
                            }
                        }
                    }
                },
                teacher: {
                    include: {
                        _count: {
                            select: {
                                courseOfferings: true,
                                attendances: true
                            }
                        }
                    }
                }
            }
        });
        if (!existingUser) {
            return res.status(404).json({
                status: 'error',
                error: 'User not found',
                timestamp: new Date().toISOString()
            });
        }
        // Check for dependencies
        let hasDependencies = false;
        const dependencies = {};
        if (existingUser.student) {
            dependencies.enrollments = existingUser.student._count.enrollments;
            dependencies.attendanceRecords = existingUser.student._count.attendanceRecords;
            if (dependencies.enrollments > 0 || dependencies.attendanceRecords > 0) {
                hasDependencies = true;
            }
        }
        if (existingUser.teacher) {
            dependencies.courseOfferings = existingUser.teacher._count.courseOfferings;
            dependencies.attendances = existingUser.teacher._count.attendances;
            if (dependencies.courseOfferings > 0 || dependencies.attendances > 0) {
                hasDependencies = true;
            }
        }
        if (hasDependencies) {
            const depList = Object.entries(dependencies)
                .filter(([, count]) => count > 0)
                .map(([type, count]) => `${count} ${type}`)
                .join(', ');
            return res.status(409).json({
                status: 'error',
                error: `Cannot delete user. User has ${depList}. Please remove these dependencies first.`,
                dependencies,
                timestamp: new Date().toISOString()
            });
        }
        // Delete user (this will cascade to related records)
        yield prisma.user.delete({
            where: { id: userId }
        });
        res.json({
            status: 'success',
            message: 'User deleted successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            status: 'error',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
// Force delete user (cascading delete)
router.delete('/:id/force', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        const userId = req.params.id;
        // Check if user exists
        const existingUser = yield prisma.user.findUnique({
            where: { id: userId },
            include: {
                student: {
                    include: {
                        attendanceRecords: true,
                        enrollments: true
                    }
                },
                teacher: {
                    include: {
                        attendances: true,
                        courseOfferings: true
                    }
                },
                admin: true,
                reportViewer: true,
                userRoles: true
            }
        });
        if (!existingUser) {
            return res.status(404).json({
                status: 'error',
                error: 'User not found',
                timestamp: new Date().toISOString()
            });
        }
        // Force delete user with explicit cascading deletes
        // Delete all related records manually to ensure complete removal
        // Delete student-related records
        if (existingUser.student) {
            // Delete attendance records
            yield prisma.attendanceRecord.deleteMany({
                where: { studentId: existingUser.student.id }
            });
            // Delete enrollments
            yield prisma.studentEnrollment.deleteMany({
                where: { studentId: existingUser.student.id }
            });
            // Delete student record
            yield prisma.student.delete({
                where: { id: existingUser.student.id }
            });
        }
        // Delete teacher-related records
        if (existingUser.teacher) {
            // Delete attendance records created by teacher
            yield prisma.attendance.deleteMany({
                where: { teacherId: existingUser.teacher.id }
            });
            // Delete course offerings
            yield prisma.courseOffering.deleteMany({
                where: { teacherId: existingUser.teacher.id }
            });
            // Delete teacher record
            yield prisma.teacher.delete({
                where: { id: existingUser.teacher.id }
            });
        }
        // Delete admin record
        if (existingUser.admin) {
            yield prisma.admin.delete({
                where: { userId: userId }
            });
        }
        // Delete report viewer record
        if (existingUser.reportViewer) {
            yield prisma.reportViewer.delete({
                where: { userId: userId }
            });
        }
        // Delete user roles
        yield prisma.userRoleAssignment.deleteMany({
            where: { userId: userId }
        });
        // Finally delete the user
        yield prisma.user.delete({
            where: { id: userId }
        });
        res.json({
            status: 'success',
            message: 'User and all related data deleted successfully (forced)',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            status: 'error',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
exports.default = router;
