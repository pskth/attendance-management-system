"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../../generated/prisma");
class DatabaseService {
    constructor() {
        this.connected = false;
        this.prisma = new prisma_1.PrismaClient({
            datasourceUrl: process.env.DATABASE_URL,
            log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    getPrisma() {
        return this.prisma;
    }
    async connect() {
        if (!this.connected) {
            try {
                await this.prisma.$connect();
                this.connected = true;
                console.log('✅ Database connected successfully');
            }
            catch (error) {
                console.error('❌ Database connection failed:', error);
                throw error;
            }
        }
    }
    async disconnect() {
        if (this.connected) {
            await this.prisma.$disconnect();
            this.connected = false;
        }
    }
    async healthCheck() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.default = DatabaseService;
