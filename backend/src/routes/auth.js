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
// src/routes/auth.ts
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../lib/database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
console.log('=== AUTH ROUTES LOADED ===');
// Login endpoint
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password, role } = req.body;
        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                status: 'error',
                error: 'Username and password are required',
                code: 'MISSING_CREDENTIALS'
            });
        }
        const prisma = database_1.default.getInstance();
        // Find user by username or email
        const user = yield prisma.user.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: username }
                ]
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
                },
                admin: true
            }
        });
        if (!user) {
            return res.status(401).json({
                status: 'error',
                error: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }
        // Check password (handle both bcrypt hashed and plain text legacy passwords)
        let passwordValid = false;
        try {
            // Try bcrypt first
            passwordValid = yield bcryptjs_1.default.compare(password, user.passwordHash);
        }
        catch (error) {
            // If bcrypt fails, try plain text comparison (for legacy data)
            passwordValid = password === user.passwordHash;
            // If plain text matches, hash the password for future use
            if (passwordValid) {
                const hashedPassword = yield bcryptjs_1.default.hash(password, 12);
                yield prisma.user.update({
                    where: { id: user.id },
                    data: { passwordHash: hashedPassword }
                });
            }
        }
        if (!passwordValid) {
            return res.status(401).json({
                status: 'error',
                error: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }
        // Check if user has the requested role (if specified)
        const userRoles = user.userRoles.map(r => r.role);
        if (role && !userRoles.includes(role)) {
            // Allow admin users to access analytics
            // Allow teacher users to access analytics
            if (role === 'analytics' && (userRoles.includes('admin') || userRoles.includes('teacher'))) {
                // Admin or teacher can access analytics, continue
            }
            else {
                return res.status(403).json({
                    status: 'error',
                    error: `Access denied. You don't have ${role} privileges`,
                    code: 'ROLE_ACCESS_DENIED',
                    userRoles,
                    requestedRole: role
                });
            }
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            username: user.username,
            roles: userRoles
        }, auth_1.JWT_SECRET, { expiresIn: '24h' });
        // Prepare user response data
        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            phone: user.phone,
            roles: userRoles,
            primaryRole: role || userRoles[0], // Use requested role or first role as primary
            profile: null
        };
        // Add role-specific profile data
        if (user.student && userRoles.includes('student')) {
            userData.profile = {
                type: 'student',
                usn: user.student.usn,
                semester: user.student.semester,
                batchYear: user.student.batchYear,
                college: user.student.colleges ? {
                    id: user.student.colleges.id,
                    name: user.student.colleges.name,
                    code: user.student.colleges.code
                } : null,
                department: user.student.departments ? {
                    id: user.student.departments.id,
                    name: user.student.departments.name,
                    code: user.student.departments.code
                } : null,
                section: user.student.sections ? {
                    id: user.student.sections.section_id,
                    name: user.student.sections.section_name
                } : null
            };
        }
        else if (user.teacher && userRoles.includes('teacher')) {
            userData.profile = {
                type: 'teacher',
                college: user.teacher.colleges ? {
                    id: user.teacher.colleges.id,
                    name: user.teacher.colleges.name,
                    code: user.teacher.colleges.code
                } : null,
                department: user.teacher.department ? {
                    id: user.teacher.department.id,
                    name: user.teacher.department.name,
                    code: user.teacher.department.code
                } : null
            };
        }
        else if (user.admin && userRoles.includes('admin')) {
            userData.profile = {
                type: 'admin'
            };
        }
        res.json({
            status: 'success',
            message: 'Login successful',
            data: {
                user: userData,
                token,
                expiresIn: '24h'
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            status: 'error',
            error: 'Login failed',
            code: 'LOGIN_ERROR',
            timestamp: new Date().toISOString()
        });
    }
}));
// Get current user profile
router.get('/me', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        const user = yield prisma.user.findUnique({
            where: { id: req.user.id },
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
                                        academic_years: true
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
                                sections: true,
                                academic_years: true
                            }
                        }
                    }
                },
                admin: true
            }
        });
        if (!user) {
            return res.status(404).json({
                status: 'error',
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }
        const userRoles = user.userRoles.map(r => r.role);
        res.json({
            status: 'success',
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                phone: user.phone,
                roles: userRoles,
                student: user.student,
                teacher: user.teacher,
                admin: user.admin,
                createdAt: user.createdAt
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            status: 'error',
            error: 'Failed to get user profile',
            code: 'PROFILE_ERROR'
        });
    }
}));
// Refresh token endpoint
router.post('/refresh', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Generate new token with same user data
        const token = jsonwebtoken_1.default.sign({
            userId: req.user.id,
            username: req.user.username,
            roles: req.user.roles
        }, auth_1.JWT_SECRET, { expiresIn: '24h' });
        res.json({
            status: 'success',
            data: {
                token,
                expiresIn: '24h'
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            status: 'error',
            error: 'Failed to refresh token',
            code: 'REFRESH_ERROR'
        });
    }
}));
// Logout endpoint (client-side token deletion, could implement token blacklist)
router.post('/logout', auth_1.authenticateToken, (req, res) => {
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just send a success response and let the client delete the token
    res.json({
        status: 'success',
        message: 'Logged out successfully',
        timestamp: new Date().toISOString()
    });
});
// Change password endpoint
router.post('/change-password', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                status: 'error',
                error: 'Current password and new password are required',
                code: 'MISSING_PASSWORDS'
            });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({
                status: 'error',
                error: 'New password must be at least 6 characters long',
                code: 'PASSWORD_TOO_SHORT'
            });
        }
        const prisma = database_1.default.getInstance();
        const user = yield prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user) {
            return res.status(404).json({
                status: 'error',
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }
        // Verify current password
        let currentPasswordValid = false;
        try {
            currentPasswordValid = yield bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        }
        catch (error) {
            // Try plain text for legacy passwords
            currentPasswordValid = currentPassword === user.passwordHash;
        }
        if (!currentPasswordValid) {
            return res.status(401).json({
                status: 'error',
                error: 'Current password is incorrect',
                code: 'INVALID_CURRENT_PASSWORD'
            });
        }
        // Hash new password
        const hashedNewPassword = yield bcryptjs_1.default.hash(newPassword, 12);
        // Update password
        yield prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedNewPassword }
        });
        res.json({
            status: 'success',
            message: 'Password changed successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            status: 'error',
            error: 'Failed to change password',
            code: 'PASSWORD_CHANGE_ERROR'
        });
    }
}));
// Verify token endpoint (for client-side token validation)
router.post('/verify', auth_1.authenticateToken, (req, res) => {
    res.json({
        status: 'success',
        message: 'Token is valid',
        data: {
            user: req.user
        },
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
