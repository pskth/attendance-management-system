"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = __importDefault(require("./lib/database"));
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const database_2 = __importDefault(require("./routes/database"));
const users_1 = __importDefault(require("./routes/users"));
const courses_1 = __importDefault(require("./routes/courses"));
const departments_1 = __importDefault(require("./routes/departments"));
const colleges_1 = __importDefault(require("./routes/colleges"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const request_context_1 = require("./lib/request-context");
console.log('=== About to import export routes ===');
let exportRoutes;
try {
    exportRoutes = require('./routes/export').default;
    console.log('=== Export routes imported successfully ===');
}
catch (error) {
    console.error('=== Error importing export routes ===', error);
}
console.log('=== About to import admin routes ===');
let adminRoutes;
try {
    adminRoutes = require('./routes/admin').default;
    console.log('=== Admin routes imported successfully ===');
}
catch (error) {
    console.error('=== Error importing admin routes ===', error);
}
let studentRoutes;
try {
    studentRoutes = require('./routes/student').default;
    console.log('=== Student routes imported successfully ===');
}
catch (error) {
    console.error('=== Error importing student routes ===', error);
}
console.log('=== About to import teacher routes ===');
let teacherRoutes;
try {
    teacherRoutes = require('./routes/teacher').default;
    console.log('=== Teacher routes imported successfully ===');
    console.log('=== Teacher routes type:', typeof teacherRoutes);
    console.log('=== Teacher routes is function:', typeof teacherRoutes === 'function');
}
catch (error) {
    console.error('=== Error importing teacher routes ===', error);
}
dotenv_1.default.config();
const app = (0, express_1.default)();
console.log('=== INDEX.TS LOADED ===');
const corsOptions = {
    origin: (origin, callback) => {
        const defaultOrigins = [
            'https://attendance-management-system-navy.vercel.app',
            'https://attendance-management-system-1-5bbv.onrender.com',
            'http://localhost:3000',
            'http://localhost:3001'
        ];
        const envOrigins = (process.env.CORS_ORIGINS || '')
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);
        const allowedOrigins = new Set([...defaultOrigins, ...envOrigins]);
        if (!origin || allowedOrigins.has(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// Request context + summary logging (duration + DB queries per request)
app.use((req, res, next) => {
    const ctx = {
        id: (0, request_context_1.createRequestId)(),
        startTime: Date.now(),
        queryCount: 0,
        method: req.method,
        path: req.path
    };
    request_context_1.requestContext.run(ctx, () => {
        res.on('finish', () => {
            const durationMs = Date.now() - ctx.startTime;
            console.log(`[REQ] ${ctx.method} ${ctx.path} ${res.statusCode} - ${durationMs}ms - db:${ctx.queryCount}`);
        });
        next();
    });
});
// Add request logging to debug API calls
app.use((req, res, next) => {
    if (req.path.includes('/teacher/courses/') && req.path.includes('/statistics')) {
        console.log('=== STATISTICS ENDPOINT REQUEST ===');
        console.log('Method:', req.method);
        console.log('Path:', req.path);
        console.log('URL:', req.url);
        console.log('Headers:', req.headers.authorization ? 'Authorization header present' : 'No auth header');
        console.log('=== END STATISTICS REQUEST LOG ===');
    }
    next();
});
const PORT = process.env.PORT || 4000;
// Initialize database connection
database_1.default.connect().catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
});
app.get('/', (req, res) => {
    res.json({
        message: 'College ERP backend is running',
        database: 'Connected to PostgreSQL via Prisma',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth/login',
            currentUser: '/api/auth/me',
            health: '/api/db/health',
            summary: '/api/db/summary',
            users: '/api/users',
            usersByRole: '/api/users/role/:role',
            userById: '/api/users/:id',
            courses: '/api/courses',
            courseById: '/api/courses/:id',
            coursesByDepartment: '/api/courses/department/:departmentId',
            coursesByType: '/api/courses/type/:courseType',
            departments: '/api/departments',
            departmentById: '/api/departments/:id',
            departmentsByCollege: '/api/departments/college/:collegeId',
            departmentStats: '/api/departments/:id/stats',
            analytics: '/api/analytics',
            analyticsOverview: '/api/analytics/overview/:academicYear?',
            analyticsAttendance: '/api/analytics/attendance/:academicYear?',
            analyticsMarks: '/api/analytics/marks/:academicYear?'
        }
    });
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/db', database_2.default);
app.use('/api/users', users_1.default);
app.use('/api/courses', courses_1.default);
app.use('/api/departments', departments_1.default);
app.use('/api/colleges', colleges_1.default);
app.use('/api/analytics', analytics_1.default);
if (exportRoutes) {
    app.use('/api/export', exportRoutes);
    console.log('=== Export routes registered ===');
}
if (adminRoutes) {
    app.use('/api/admin', adminRoutes);
    console.log('=== Admin routes registered ===');
}
if (studentRoutes) {
    app.use('/api/student', studentRoutes);
    console.log('=== Student routes registered ===');
}
if (teacherRoutes) {
    app.use('/api/teacher', teacherRoutes);
    app.use('/teacher', teacherRoutes); // alias to support clients that omit /api prefix
    console.log('=== Teacher routes registered (with /api and /teacher aliases) ===');
}
// Health check endpoint (legacy - also available at /api/db/health)
app.get('/health', async (req, res) => {
    try {
        const isHealthy = await database_1.default.healthCheck();
        if (isHealthy) {
            res.json({ status: 'healthy', database: 'connected' });
        }
        else {
            res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: errorMessage });
    }
});
// Simple health endpoint for frontend
app.get('/api/health', async (req, res) => {
    try {
        const isHealthy = await database_1.default.healthCheck();
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: isHealthy ? 'connected' : 'disconnected'
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: errorMessage
        });
    }
});
// Graceful shutdown
process.on('beforeExit', async () => {
    await database_1.default.disconnect();
});
process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT. Graceful shutdown...');
    await database_1.default.disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM. Graceful shutdown...');
    await database_1.default.disconnect();
    process.exit(0);
});
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check available at http://localhost:${PORT}/health`);
    console.log(`📋 Database summary at http://localhost:${PORT}/api/db/summary`);
    console.log(`👥 Users API at http://localhost:${PORT}/api/users`);
});
