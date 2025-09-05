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
exports.JWT_SECRET = exports.optionalAuth = exports.requireAnalytics = exports.requireTeacherOrAdmin = exports.requireStudent = exports.requireTeacher = exports.requireAdmin = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../lib/database"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
exports.JWT_SECRET = JWT_SECRET;
// Middleware to verify JWT token
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            return res.status(401).json({
                status: 'error',
                error: 'Access token required',
                code: 'TOKEN_MISSING'
            });
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Get fresh user data from database
        const prisma = database_1.default.getInstance();
        const user = yield prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                userRoles: true,
                student: true,
                teacher: true,
                admin: true
            }
        });
        if (!user) {
            return res.status(401).json({
                status: 'error',
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }
        // Attach user info to request
        req.user = {
            id: user.id,
            username: user.username,
            email: user.email || undefined,
            name: user.name,
            roles: user.userRoles.map(role => role.role)
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                status: 'error',
                error: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({
                status: 'error',
                error: 'Invalid token',
                code: 'TOKEN_INVALID'
            });
        }
        console.error('Authentication error:', error);
        return res.status(500).json({
            status: 'error',
            error: 'Authentication failed',
            code: 'AUTH_ERROR'
        });
    }
});
exports.authenticateToken = authenticateToken;
// Middleware to check if user has required role(s)
const requireRole = (requiredRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 'error',
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        const hasRequiredRole = roles.some(role => req.user.roles.includes(role));
        if (!hasRequiredRole) {
            return res.status(403).json({
                status: 'error',
                error: `Access denied. Required role(s): ${roles.join(', ')}`,
                code: 'INSUFFICIENT_PERMISSIONS',
                userRoles: req.user.roles,
                requiredRoles: roles
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
// Convenience middleware for common role combinations
exports.requireAdmin = (0, exports.requireRole)('admin');
exports.requireTeacher = (0, exports.requireRole)(['teacher', 'admin']);
exports.requireStudent = (0, exports.requireRole)(['student', 'teacher', 'admin']);
exports.requireTeacherOrAdmin = (0, exports.requireRole)(['teacher', 'admin']);
// Middleware for analytics access
const requireAnalytics = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            status: 'error',
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
        });
    }
    // Analytics access for admin or users with analytics role
    const hasAnalyticsAccess = req.user.roles.includes('admin') ||
        req.user.roles.includes('analytics') ||
        req.user.roles.includes('teacher'); // Teachers can view limited analytics
    if (!hasAnalyticsAccess) {
        return res.status(403).json({
            status: 'error',
            error: 'Analytics access denied',
            code: 'ANALYTICS_ACCESS_DENIED'
        });
    }
    next();
};
exports.requireAnalytics = requireAnalytics;
// Optional authentication - doesn't fail if no token, but adds user if valid token
const optionalAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return next(); // No token, continue without user
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const prisma = database_1.default.getInstance();
        const user = yield prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                userRoles: true
            }
        });
        if (user) {
            req.user = {
                id: user.id,
                username: user.username,
                email: user.email || undefined,
                name: user.name,
                roles: user.userRoles.map(role => role.role)
            };
        }
        next();
    }
    catch (error) {
        // Token invalid, continue without user
        next();
    }
});
exports.optionalAuth = optionalAuth;
