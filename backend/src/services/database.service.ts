import { PrismaClient } from '../../generated/prisma';

class DatabaseService {
    private static instance: DatabaseService;
    private prisma: PrismaClient;
    private connected: boolean = false;

    private constructor() {
        this.prisma = new PrismaClient({
            datasourceUrl: process.env.DATABASE_URL,
            log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });
    }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    public getPrisma(): PrismaClient {
        return this.prisma;
    }

    public async connect(): Promise<void> {
        if (!this.connected) {
            try {
                await this.prisma.$connect();
                this.connected = true;
                console.log('✅ Database connected successfully');
            } catch (error) {
                console.error('❌ Database connection failed:', error);
                throw error;
            }
        }
    }

    public async disconnect(): Promise<void> {
        if (this.connected) {
            await this.prisma.$disconnect();
            this.connected = false;
        }
    }

    public async healthCheck(): Promise<boolean> {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return true;
        } catch (error) {
            return false;
        }
    }
}

export default DatabaseService;