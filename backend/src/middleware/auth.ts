// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import DatabaseService from '../lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

export interface AuthenticatedUser {
  id: string;
  username: string;
  email?: string;
  name: string;
  roles: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Middleware to verify JWT token
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Get fresh user data from database
    const prisma = DatabaseService.getInstance();
    const user = await prisma.user.findUnique({
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
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        status: 'error',
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
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
};

// Middleware to check if user has required role(s)
export const requireRole = (requiredRoles: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const hasRequiredRole = roles.some(role => req.user!.roles.includes(role));

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

// Convenience middleware for common role combinations
export const requireAdmin = requireRole('admin');
export const requireTeacher = requireRole(['teacher', 'admin']);
export const requireStudent = requireRole(['student', 'teacher', 'admin']);
export const requireTeacherOrAdmin = requireRole(['teacher', 'admin']);

// Middleware for analytics access
export const requireAnalytics = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

// Optional authentication - doesn't fail if no token, but adds user if valid token
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // No token, continue without user
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const prisma = DatabaseService.getInstance();
    const user = await prisma.user.findUnique({
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
  } catch (error) {
    // Token invalid, continue without user
    next();
  }
};

export { JWT_SECRET };
