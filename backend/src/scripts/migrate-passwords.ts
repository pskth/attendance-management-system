// scripts/migrate-passwords.ts
import bcrypt from 'bcryptjs';
import DatabaseService from '../lib/database';

async function migratePasswords() {
  console.log('🔄 Starting password migration...\n');

  try {
    const prisma = DatabaseService.getInstance();
    
    // Get all users with plain text passwords
    const users = await prisma.user.findMany({
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
        const hashedPassword = await bcrypt.hash(user.passwordHash, 12);
        
        // Update the user with hashed password
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: hashedPassword }
        });

        console.log(`✅ Updated password for ${user.username}`);
        updatedCount++;

      } catch (error) {
        console.error(`❌ Error updating password for ${user.username}:`, error);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`Total users: ${users.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped (already hashed): ${skippedCount}`);
    console.log(`Errors: ${users.length - updatedCount - skippedCount}`);

    console.log('\n✅ Password migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await DatabaseService.disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migratePasswords().catch(console.error);
}

export default migratePasswords;
