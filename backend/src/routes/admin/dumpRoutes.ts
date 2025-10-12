import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import multer from 'multer';

const execAsync = promisify(exec);
const router = Router();

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
 * Parse DATABASE_URL to extract connection parameters
 */
function parseDatabaseUrl(databaseUrl: string): {
    user: string;
    password: string;
    host: string;
    port: string;
    database: string;
} {
    // Format: postgresql://user:password@host:port/database
    const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
    const match = databaseUrl.match(regex);

    if (!match) {
        throw new Error('Invalid DATABASE_URL format');
    }

    return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: match[4],
        database: match[5]
    };
}

/**
 * GET /api/admin/export-dump
 * Export PostgreSQL database dump
 */
router.get('/export-dump', async (req: Request, res: Response) => {
    try {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            return res.status(500).json({
                success: false,
                error: 'DATABASE_URL not configured'
            });
        }

        const dbParams = parseDatabaseUrl(databaseUrl);
        const timestamp = Date.now();
        const dumpFileName = `attendance-db-dump-${timestamp}.sql`;
        const dumpDir = path.join(__dirname, '../../../dumps');
        const dumpPath = path.join(dumpDir, dumpFileName);

        // Create dumps directory if it doesn't exist
        if (!fs.existsSync(dumpDir)) {
            fs.mkdirSync(dumpDir, { recursive: true });
        }

        // Set PGPASSWORD environment variable for pg_dump
        const env = { ...process.env, PGPASSWORD: dbParams.password };

        // Execute pg_dump command
        const command = `pg_dump -h ${dbParams.host} -p ${dbParams.port} -U ${dbParams.user} -d ${dbParams.database} -F p -f "${dumpPath}"`;

        console.log('Exporting database dump...');
        await execAsync(command, { env, maxBuffer: 50 * 1024 * 1024 }); // 50MB buffer

        // Check if file was created
        if (!fs.existsSync(dumpPath)) {
            return res.status(500).json({
                success: false,
                error: 'Dump file was not created'
            });
        }

        const stats = fs.statSync(dumpPath);
        console.log(`Dump created: ${dumpFileName} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

        // Set response headers for file download
        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', `attachment; filename="${dumpFileName}"`);
        res.setHeader('Content-Length', stats.size);

        // Stream the file to response
        const fileStream = fs.createReadStream(dumpPath);
        fileStream.pipe(res);

        // Delete the file after streaming
        fileStream.on('end', () => {
            fs.unlinkSync(dumpPath);
            console.log('Dump file cleaned up');
        });

        fileStream.on('error', (error) => {
            console.error('Stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: 'Error streaming dump file'
                });
            }
        });

    } catch (error: any) {
        console.error('Export dump error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to export database dump'
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

        const dbParams = parseDatabaseUrl(databaseUrl);
        const dumpPath = req.file.path;

        console.log('Importing database dump:', req.file.originalname);

        // Set PGPASSWORD environment variable for psql
        const env = { ...process.env, PGPASSWORD: dbParams.password };

        // Execute psql command to restore database
        const command = `psql -h ${dbParams.host} -p ${dbParams.port} -U ${dbParams.user} -d ${dbParams.database} -f "${dumpPath}"`;

        const { stdout, stderr } = await execAsync(command, {
            env,
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

        console.error('Import dump error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to import database dump'
        });
    }
});

/**
 * POST /api/admin/clear-database
 * Clear all data from database (WARNING: Destructive operation)
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

        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            return res.status(500).json({
                success: false,
                error: 'DATABASE_URL not configured'
            });
        }

        const dbParams = parseDatabaseUrl(databaseUrl);
        const env = { ...process.env, PGPASSWORD: dbParams.password };

        // SQL to drop all tables
        const dropScript = `
            DO $$ DECLARE
                r RECORD;
            BEGIN
                -- Disable triggers
                FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                    EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
                END LOOP;
            END $$;
        `;

        const command = `psql -h ${dbParams.host} -p ${dbParams.port} -U ${dbParams.user} -d ${dbParams.database} -c "${dropScript.replace(/\n/g, ' ')}"`;

        await execAsync(command, { env });

        console.log('Database cleared successfully');

        res.json({
            success: true,
            message: 'All database tables have been dropped. Run migrations to recreate schema.',
            warning: 'This action cannot be undone. Restore from a backup if needed.'
        });

    } catch (error: any) {
        console.error('Clear database error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to clear database'
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
