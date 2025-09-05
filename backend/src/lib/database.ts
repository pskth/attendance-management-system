// src/lib/database.ts
import { PrismaClient } from '../../generated/prisma';

// Create a singleton Prisma client instance
class DatabaseService {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
        errorFormat: 'pretty',
      });
    }
    return DatabaseService.instance;
  }

  public static async connect(): Promise<void> {
    try {
      const prisma = this.getInstance();
      await prisma.$connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  public static async disconnect(): Promise<void> {
    try {
      const prisma = this.getInstance();
      await prisma.$disconnect();
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Failed to disconnect from database:', error);
    }
  }

  public static async healthCheck(): Promise<boolean> {
    try {
      const prisma = this.getInstance();
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  public static async getDataSummary() {
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
    } catch (error) {
      console.error('Failed to get data summary:', error);
      throw error;
    }
  }
}

export default DatabaseService;
