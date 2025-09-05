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
Object.defineProperty(exports, "__esModule", { value: true });
// src/lib/database.ts
const prisma_1 = require("../../generated/prisma");
// Create a singleton Prisma client instance
class DatabaseService {
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new prisma_1.PrismaClient({
                log: ['query', 'info', 'warn', 'error'],
                errorFormat: 'pretty',
            });
        }
        return DatabaseService.instance;
    }
    static connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prisma = this.getInstance();
                yield prisma.$connect();
                console.log('✅ Database connected successfully');
            }
            catch (error) {
                console.error('❌ Failed to connect to database:', error);
                throw error;
            }
        });
    }
    static disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prisma = this.getInstance();
                yield prisma.$disconnect();
                console.log('✅ Database disconnected successfully');
            }
            catch (error) {
                console.error('❌ Failed to disconnect from database:', error);
            }
        });
    }
    static healthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prisma = this.getInstance();
                yield prisma.$queryRaw `SELECT 1`;
                return true;
            }
            catch (error) {
                console.error('Database health check failed:', error);
                return false;
            }
        });
    }
    static getDataSummary() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prisma = this.getInstance();
                const summary = yield Promise.all([
                    prisma.college.count(),
                    prisma.department.count(),
                    prisma.user.count(),
                    prisma.student.count(),
                    prisma.teacher.count(),
                    prisma.course.count(),
                    prisma.courseOffering.count(),
                    prisma.studentEnrollment.count(),
                    prisma.attendance.count(),
                    prisma.theoryMarks.count(),
                    prisma.labMarks.count(),
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
                    theoryMarks: summary[9],
                    labMarks: summary[10],
                };
            }
            catch (error) {
                console.error('Failed to get data summary:', error);
                throw error;
            }
        });
    }
}
exports.default = DatabaseService;
