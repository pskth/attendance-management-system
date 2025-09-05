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
// scripts/migrate-passwords.ts
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../lib/database"));
function migratePasswords() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🔄 Starting password migration...\n');
        try {
            const prisma = database_1.default.getInstance();
            // Get all users with plain text passwords
            const users = yield prisma.user.findMany({
                select: {
                    id: true,
                    username: true,
                    passwordHash: true
                }
            });
            console.log(`Found ${users.length} users to process\n`);
            let updatedCount = 0;
            let skippedCount = 0;
            for (const user of users) {
                try {
                    // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
                    if (user.passwordHash.startsWith('$2')) {
                        console.log(`⏭️  Skipping ${user.username} (already hashed)`);
                        skippedCount++;
                        continue;
                    }
                    // Hash the plain text password
                    const hashedPassword = yield bcryptjs_1.default.hash(user.passwordHash, 12);
                    // Update the user with hashed password
                    yield prisma.user.update({
                        where: { id: user.id },
                        data: { passwordHash: hashedPassword }
                    });
                    console.log(`✅ Updated password for ${user.username}`);
                    updatedCount++;
                }
                catch (error) {
                    console.error(`❌ Error updating password for ${user.username}:`, error);
                }
            }
            console.log('\n📊 Migration Summary:');
            console.log(`Total users: ${users.length}`);
            console.log(`Updated: ${updatedCount}`);
            console.log(`Skipped (already hashed): ${skippedCount}`);
            console.log(`Errors: ${users.length - updatedCount - skippedCount}`);
            console.log('\n✅ Password migration completed!');
        }
        catch (error) {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        }
        finally {
            yield database_1.default.disconnect();
        }
    });
}
// Run migration if called directly
if (require.main === module) {
    migratePasswords().catch(console.error);
}
exports.default = migratePasswords;
