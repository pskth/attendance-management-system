// src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import DatabaseService from './lib/database';

// Import routes
import authRoutes from './routes/auth';
import databaseRoutes from './routes/database';
import usersRoutes from './routes/users';
import coursesRoutes from './routes/courses';
import departmentsRoutes from './routes/departments';
import collegesRoutes from './routes/colleges';
import analyticsRoutes from './routes/analytics';

console.log('=== About to import export routes ===');
let exportRoutes;
try {
	exportRoutes = require('./routes/export').default;
	console.log('=== Export routes imported successfully ===');
} catch (error) {
	console.error('=== Error importing export routes ===', error);
}

console.log('=== About to import admin routes ===');
let adminRoutes;
try {
	adminRoutes = require('./routes/admin').default;
	console.log('=== Admin routes imported successfully ===');
} catch (error) {
	console.error('=== Error importing admin routes ===', error);
}
let studentRoutes;
try {
  studentRoutes = require('./routes/student').default;
  console.log('=== Student routes imported successfully ===');
} catch (error) {
  console.error('=== Error importing student routes ===', error);
}
console.log('=== About to import teacher routes ===');
let teacherRoutes;
try {
	teacherRoutes = require('./routes/teacher').default;
	console.log('=== Teacher routes imported successfully ===');
	console.log('=== Teacher routes type:', typeof teacherRoutes);
	console.log('=== Teacher routes is function:', typeof teacherRoutes === 'function');
} catch (error) {
	console.error('=== Error importing teacher routes ===', error);
}

dotenv.config();

const app = express();

console.log('=== INDEX.TS LOADED ===');

app.use(cors({
	origin: ['https://attendance-management-system-1-5bbv.onrender.com/'],
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

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
DatabaseService.connect().catch((error) => {
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
app.use('/api/auth', authRoutes);
app.use('/api/db', databaseRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/colleges', collegesRoutes);

app.use('/api/analytics', analyticsRoutes);
if (exportRoutes) {
	app.use('/api/export', exportRoutes);
	console.log('=== Export routes registered ===');
}
if (adminRoutes) {
	app.use('/api/admin', adminRoutes);
	console.log('=== Admin routes registered ===');
}
if (studentRoutes){
  app.use('/api/student', studentRoutes);
  console.log('=== Student routes registered ===');
}
if (teacherRoutes) {
	app.use('/api/teacher', teacherRoutes);
	console.log('=== Teacher routes registered ===');
}

// Health check endpoint (legacy - also available at /api/db/health)
app.get('/health', async (req, res) => {
	try {
		const isHealthy = await DatabaseService.healthCheck();
		if (isHealthy) {
			res.json({ status: 'healthy', database: 'connected' });
		} else {
			res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: errorMessage });
	}
});

// Simple health endpoint for frontend
app.get('/api/health', async (req, res) => {
	try {
		const isHealthy = await DatabaseService.healthCheck();
		res.json({
			status: 'ok',
			timestamp: new Date().toISOString(),
			database: isHealthy ? 'connected' : 'disconnected'
		});
	} catch (error) {
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
	await DatabaseService.disconnect();
});

process.on('SIGINT', async () => {
	console.log('\nReceived SIGINT. Graceful shutdown...');
	await DatabaseService.disconnect();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	console.log('\nReceived SIGTERM. Graceful shutdown...');
	await DatabaseService.disconnect();
	process.exit(0);
});

app.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
	console.log(`📊 Health check available at http://localhost:${PORT}/health`);
	console.log(`📋 Database summary at http://localhost:${PORT}/api/db/summary`);
	console.log(`👥 Users API at http://localhost:${PORT}/api/users`);
});
