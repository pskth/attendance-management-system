import { PrismaClient } from '../generated/prisma';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

interface UserRow {
  username: string;
  password_hash: string;
  name: string;
  phone: string;
  email: string;
}

async function importUsers() {
  console.log('🚀 Starting user import...');
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Path to users.csv
    const csvPath = path.join(__dirname, '../../sample_data_simplified/users.csv');
    console.log('📁 Reading CSV from:', csvPath);

    const users: UserRow[] = [];

    // Read CSV file
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row: UserRow) => {
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
        const existingUser = await prisma.user.findUnique({
          where: { username: user.username }
        });

        if (existingUser) {
          console.log(`⏭️  User ${user.username} already exists, skipping`);
          continue;
        }

        // Create user
        const createdUser = await prisma.user.create({
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
      } catch (error) {
        console.error(`❌ Error importing user ${user.username}:`, error);
      }
    }

    console.log(`🎉 Import completed! Imported ${imported} new users out of ${users.length} total users.`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importUsers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
