import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import multer from 'multer';
import DatabaseService from '../../services/database.service';

const execAsync = promisify(exec);
const router = Router();
const prisma = DatabaseService.getInstance().getPrisma();

// Helper function to sanitize error messages containing database URLs
const sanitizeError = (error: any): string => {
    const message = error?.message || error?.toString() || 'Unknown error';
    // Remove database credentials from error messages
    return message.replace(/postgresql:\/\/[^@\s]+@[^\s"']+/g, 'postgresql://***:***@***/***');
};

// Configure multer for SQL file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../../dumps');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `restore-${Date.now()}.sql`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.originalname.endsWith('.sql')) {
            cb(null, true);
        } else {
            cb(new Error('Only .sql files are allowed'));
        }
    },
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

/**
 * GET /api/admin/export-dump
 * Export PostgreSQL database dump
 */
router.get('/export-dump', async (req: Request, res: Response) => {
    try {
        console.log('\n' + '='.repeat(70));
        console.log('📦 DATABASE EXPORT STARTED');
        console.log('='.repeat(70));

        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            console.error('❌ DATABASE_URL not configured');
            return res.status(500).json({
                success: false,
                error: 'DATABASE_URL not configured'
            });
        }

        console.log('✓ DATABASE_URL found');

        // Remove schema query parameter (Prisma-specific, not supported by pg_dump)
        const cleanDatabaseUrl = databaseUrl.split('?')[0];
        console.log('✓ DATABASE_URL cleaned for pg_dump');

        const timestamp = Date.now();
        const dumpFileName = `attendance-db-dump-${timestamp}.sql`;
        const dumpDir = path.join(__dirname, '../../../dumps');
        const dumpPath = path.join(dumpDir, dumpFileName);

        console.log(`✓ Dump path: ${dumpPath}`);

        // Create dumps directory if it doesn't exist
        if (!fs.existsSync(dumpDir)) {
            console.log('Creating dumps directory...');
            fs.mkdirSync(dumpDir, { recursive: true });
            console.log('✓ Dumps directory created');
        } else {
            console.log('✓ Dumps directory exists');
        }

        // Execute pg_dump command using connection string directly
        const command = `pg_dump "${cleanDatabaseUrl}" -F p -f "${dumpPath}"`;

        console.log('Executing pg_dump command...');
        console.log(`Command: pg_dump "<DATABASE_URL>" -F p -f "${dumpPath}"`);

        await execAsync(command, { maxBuffer: 50 * 1024 * 1024 }); // 50MB buffer
        console.log('✓ pg_dump completed');

        // Check if file was created
        if (!fs.existsSync(dumpPath)) {
            console.error('❌ Dump file was not created at:', dumpPath);
            return res.status(500).json({
                success: false,
                error: 'Dump file was not created'
            });
        }

        const stats = fs.statSync(dumpPath);
        console.log(`✓ Dump file created: ${dumpFileName}`);
        console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB (${stats.size} bytes)`);

        // Set response headers for file download
        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', `attachment; filename="${dumpFileName}"`);
        res.setHeader('Content-Length', stats.size);

        console.log('✓ Response headers set');
        console.log('✓ Streaming file to client...');

        // Stream the file to response
        const fileStream = fs.createReadStream(dumpPath);
        fileStream.pipe(res);

        // Delete the file after streaming
        fileStream.on('end', () => {
            try {
                fs.unlinkSync(dumpPath);
                console.log('✓ Dump file cleaned up');
                console.log('='.repeat(70));
                console.log('✅ DATABASE EXPORT COMPLETED');
                console.log('='.repeat(70) + '\n');
            } catch (err) {
                console.error('Warning: Could not delete dump file:', err);
            }
        });

        fileStream.on('error', (error) => {
            console.error('❌ Stream error:', error);
            console.log('='.repeat(70) + '\n');
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: 'Error streaming dump file'
                });
            }
        });

    } catch (error: any) {
        const sanitizedError = sanitizeError(error);
        console.error('❌ Export dump error:', sanitizedError);
        console.log('='.repeat(70) + '\n');
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: sanitizedError
            });
        }
    }
});

/**
 * POST /api/admin/import-dump
 * Import PostgreSQL database dump
 */
router.post('/import-dump', upload.single('dumpFile'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No dump file provided'
            });
        }

        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            return res.status(500).json({
                success: false,
                error: 'DATABASE_URL not configured'
            });
        }

        // Remove schema query parameter (Prisma-specific, not supported by psql)
        const cleanDatabaseUrl = databaseUrl.split('?')[0];

        const dumpPath = req.file.path;

        console.log('Importing database dump:', req.file.originalname);

        // Execute psql command to restore database using connection string
        const command = `psql "${cleanDatabaseUrl}" -f "${dumpPath}"`;

        const { stdout, stderr } = await execAsync(command, {
            maxBuffer: 50 * 1024 * 1024 // 50MB buffer
        });

        // Clean up uploaded file
        fs.unlinkSync(dumpPath);

        console.log('Database restored successfully');
        if (stderr && !stderr.includes('NOTICE')) {
            console.warn('Import warnings:', stderr);
        }

        res.json({
            success: true,
            message: 'Database dump imported successfully',
            originalName: req.file.originalname,
            size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`
        });

    } catch (error: any) {
        // Clean up file on error
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        const sanitizedError = sanitizeError(error);
        console.error('Import dump error:', sanitizedError);
        res.status(500).json({
            success: false,
            error: sanitizedError
        });
    }
});

/**
 * POST /api/admin/clear-database
 * Clear all data from database except admin users (WARNING: Destructive operation)
 */
router.post('/clear-database', async (req: Request, res: Response) => {
    try {
        const { confirmation } = req.body;

        if (confirmation !== 'DELETE_ALL_DATA') {
            return res.status(400).json({
                success: false,
                error: 'Invalid confirmation. Send { confirmation: "DELETE_ALL_DATA" } to proceed.'
            });
        }

        console.log('\n' + '='.repeat(70));
        console.log('🗑️  DATABASE CLEAR OPERATION STARTED');
        console.log('='.repeat(70));
        console.log('Starting database clear (preserving admin users)...');

        // Get all admin user IDs before clearing
        console.log('\n[Step 1] Fetching admin users from database...');
        const adminUsers = await prisma.admin.findMany({
            select: {
                userId: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true
                    }
                }
            }
        });
        console.log(`[Step 1] Query returned ${adminUsers.length} admin user(s)`);

        // Safety check: Ensure admins exist
        if (adminUsers.length === 0) {
            console.error('\n❌ OPERATION ABORTED: No admin users found in database!');
            console.log('='.repeat(70) + '\n');
            return res.status(400).json({
                success: false,
                error: 'Cannot clear database: No admin users found. Please create an admin user first using the create-admin.js script.',
                suggestion: 'Run: node create-admin.js'
            });
        }

        const adminUserIds = adminUsers.map((admin: any) => admin.userId);
        console.log(`\n[Step 1] ✅ Admin users to preserve:`);
        adminUsers.forEach((a: any, i: number) => {
            console.log(`  ${i + 1}. ${a.user.username} (${a.user.name})`);
            console.log(`     User ID: ${a.userId}`);
        });
        console.log(`\n[Step 1] Admin User IDs array: [${adminUserIds.join(', ')}]`);

        // Delete data in order (respecting foreign key constraints)
        // Start with leaf tables (no dependencies) and work backwards

        console.log('Deleting transactional data...');

        // 1. Student Marks and Test Components (depend on enrollments and offerings)
        await prisma.studentMark.deleteMany({});
        await prisma.testComponent.deleteMany({});
        console.log('  ✓ Deleted marks and test components');

        // 2. Attendance Records (depend on attendance and students)
        await prisma.attendanceRecord.deleteMany({});
        console.log('  ✓ Deleted attendance records');

        // 3. Attendance (depends on course offerings)
        await prisma.attendance.deleteMany({});
        console.log('  ✓ Deleted attendance sessions');

        // 4. Student Enrollments (depend on students and offerings)
        await prisma.studentEnrollment.deleteMany({});
        console.log('  ✓ Deleted student enrollments');

        // 5. Course Offerings (depend on courses, teachers, sections)
        await prisma.courseOffering.deleteMany({});
        console.log('  ✓ Deleted course offerings');

        console.log('Deleting configuration data...');

        // 6. Elective configuration
        await prisma.courseElectiveGroupMember.deleteMany({});
        await prisma.openElectiveRestriction.deleteMany({});
        await prisma.departmentElectiveGroup.deleteMany({});
        console.log('  ✓ Deleted elective configurations');

        // 7. Courses (depend on departments)
        await prisma.course.deleteMany({});
        console.log('  ✓ Deleted courses');

        // 8. Academic Years (depend on colleges)
        await prisma.academic_years.deleteMany({});
        console.log('  ✓ Deleted academic years');

        console.log('Deleting user profiles (except admins)...');

        // 9. Students (depend on users) - delete non-admin students
        const deletedStudents = await prisma.student.deleteMany({
            where: {
                userId: {
                    notIn: adminUserIds
                }
            }
        });
        console.log(`  ✓ Deleted ${deletedStudents.count} students`);

        // 10. Teachers (depend on users) - delete non-admin teachers
        const deletedTeachers = await prisma.teacher.deleteMany({
            where: {
                userId: {
                    notIn: adminUserIds
                }
            }
        });
        console.log(`  ✓ Deleted ${deletedTeachers.count} teachers`);

        // 11. Report Viewers (depend on users) - delete non-admin viewers
        const deletedViewers = await prisma.reportViewer.deleteMany({
            where: {
                userId: {
                    notIn: adminUserIds
                }
            }
        });
        console.log(`  ✓ Deleted ${deletedViewers.count} report viewers`);

        // 12. Sections (depend on departments)
        await prisma.sections.deleteMany({});
        console.log('  ✓ Deleted sections');

        // 13. Departments (depend on colleges)
        await prisma.department.deleteMany({});
        console.log('  ✓ Deleted departments');

        // 14. Colleges (independent)
        await prisma.college.deleteMany({});
        console.log('  ✓ Deleted colleges');

        console.log('Deleting non-admin users...');

        // 15. User Role Assignments (depend on users) - delete non-admin roles
        const deletedRoles = await prisma.userRoleAssignment.deleteMany({
            where: {
                userId: {
                    notIn: adminUserIds
                }
            }
        });
        console.log(`  ✓ Deleted ${deletedRoles.count} user role assignments`);

        // 16. Users (keep only admins)
        const deletedUsers = await prisma.user.deleteMany({
            where: {
                id: {
                    notIn: adminUserIds
                }
            }
        });
        console.log(`  ✓ Deleted ${deletedUsers.count} non-admin users`);

        console.log('\n' + '='.repeat(70));
        console.log('✅ DATABASE CLEAR COMPLETED');
        console.log('='.repeat(70));
        console.log(`Preserved ${adminUsers.length} admin user(s)`);

        // VERIFICATION: Double-check admins still exist
        console.log('\n[VERIFICATION] Checking if admin users still exist...');
        const remainingAdmins = await prisma.admin.findMany({
            include: { user: { select: { username: true } } }
        });
        console.log(`[VERIFICATION] Found ${remainingAdmins.length} admin(s) after clear:`);
        remainingAdmins.forEach((a: any, i: number) => {
            console.log(`  ${i + 1}. ${a.user.username}`);
        });

        const remainingUsers = await prisma.user.count();
        console.log(`[VERIFICATION] Total users remaining: ${remainingUsers}`);
        console.log('='.repeat(70) + '\n');

        res.json({
            success: true,
            message: 'Database cleared successfully. Admin users preserved.',
            details: {
                preserved: {
                    admins: adminUsers.length,
                    usernames: adminUsers.map((a: any) => a.user.username)
                },
                deleted: {
                    users: deletedUsers.count,
                    students: deletedStudents.count,
                    teachers: deletedTeachers.count,
                    roles: deletedRoles.count
                }
            },
            warning: 'All data except admin users has been deleted. This action cannot be undone.'
        });

    } catch (error: any) {
        const sanitizedError = sanitizeError(error);
        console.error('Clear database error:', sanitizedError);
        res.status(500).json({
            success: false,
            error: sanitizedError
        });
    }
});

/**
 * GET /api/admin/dump-info
 * Get information about pg_dump availability
 */
router.get('/dump-info', async (req: Request, res: Response) => {
    try {
        // Check if pg_dump is available
        await execAsync('pg_dump --version');

        res.json({
            success: true,
            available: true,
            message: 'PostgreSQL dump tools are available'
        });
    } catch (error) {
        res.json({
            success: false,
            available: false,
            message: 'PostgreSQL dump tools (pg_dump/psql) not found in PATH',
            instructions: 'Install PostgreSQL client tools to use this feature'
        });
    }
});

export default router;
