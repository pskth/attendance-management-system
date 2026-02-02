"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/lib/database.ts
const prisma_1 = require("../../generated/prisma");
const request_context_1 = require("./request-context");
// Create a singleton Prisma client instance
class DatabaseService {
    static getInstance() {
        if (!DatabaseService.instance) {
            const baseClient = new prisma_1.PrismaClient({
                datasourceUrl: process.env.DATABASE_URL,
                log: ['query', 'info', 'warn', 'error'],
                errorFormat: 'pretty',
            });
            DatabaseService.instance = baseClient.$extends({
                query: {
                    $allOperations({ query, args }) {
                        const ctx = request_context_1.requestContext.get();
                        if (ctx) {
                            ctx.queryCount += 1;
                        }
                        return query(args);
                    }
                }
            });
        }
        return DatabaseService.instance;
    }
    static async connect() {
        try {
            const prisma = this.getInstance();
            await prisma.$connect();
            console.log('✅ Database connected successfully');
        }
        catch (error) {
            console.error('❌ Failed to connect to database:', error);
            throw error;
        }
    }
    static async disconnect() {
        try {
            const prisma = this.getInstance();
            await prisma.$disconnect();
            console.log('✅ Database disconnected successfully');
        }
        catch (error) {
            console.error('❌ Failed to disconnect from database:', error);
        }
    }
    static async healthCheck() {
        try {
            const prisma = this.getInstance();
            await prisma.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            console.error('Database health check failed:', error);
            return false;
        }
    }
    static async getDataSummary() {
        try {
            const prisma = this.getInstance();
            const summary = await Promise.all([
                prisma.college.count(),
                prisma.department.count(),
                prisma.user.count(),
                prisma.student.count(),
                prisma.teacher.count(),
                prisma.course.count(),
                prisma.courseOffering.count(),
                prisma.studentEnrollment.count(),
                prisma.attendance.count(),
                prisma.studentMark.count(),
                prisma.testComponent.count(),
            ]);
            return {
                colleges: summary[0],
                departments: summary[1],
                users: summary[2],
                students: summary[3],
                teachers: summary[4],
                courses: summary[5],
                courseOfferings: summary[6],
                enrollments: summary[7],
                attendanceSessions: summary[8],
                studentMarks: summary[9],
                testComponents: summary[10],
            };
        }
        catch (error) {
            console.error('Failed to get data summary:', error);
            throw error;
        }
    }
}
exports.default = DatabaseService;
