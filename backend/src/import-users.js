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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../generated/prisma");
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const path_1 = __importDefault(require("path"));
const prisma = new prisma_1.PrismaClient();
function importUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🚀 Starting user import...');
        try {
            yield prisma.$connect();
            console.log('✅ Database connected');
            // Path to users.csv
            const csvPath = path_1.default.join(__dirname, '../../sample_data_simplified/users.csv');
            console.log('📁 Reading CSV from:', csvPath);
            const users = [];
            // Read CSV file
            yield new Promise((resolve, reject) => {
                fs_1.default.createReadStream(csvPath)
                    .pipe((0, csv_parser_1.default)())
                    .on('data', (row) => {
                    users.push(row);
                })
                    .on('end', () => {
                    console.log(`📄 Read ${users.length} users from CSV`);
                    resolve();
                })
                    .on('error', reject);
            });
            // Import users in batches
            console.log('💾 Importing users to database...');
            let imported = 0;
            for (const user of users) {
                try {
                    // Check if user already exists
                    const existingUser = yield prisma.user.findUnique({
                        where: { username: user.username }
                    });
                    if (existingUser) {
                        console.log(`⏭️  User ${user.username} already exists, skipping`);
                        continue;
                    }
                    // Create user
                    const createdUser = yield prisma.user.create({
                        data: {
                            username: user.username,
                            passwordHash: user.password_hash,
                            name: user.name,
                            phone: user.phone,
                            email: user.email || null,
                        }
                    });
                    imported++;
                    if (imported % 10 === 0) {
                        console.log(`✅ Imported ${imported} users...`);
                    }
                }
                catch (error) {
                    console.error(`❌ Error importing user ${user.username}:`, error);
                }
            }
            console.log(`🎉 Import completed! Imported ${imported} new users out of ${users.length} total users.`);
        }
        catch (error) {
            console.error('❌ Import failed:', error);
            throw error;
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
importUsers()
    .catch((e) => {
    console.error(e);
    process.exit(1);
});
