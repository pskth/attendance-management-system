// scripts/create-demo-users.js
const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEMO_USERS = [
  {
    username: 'amalytics',
    password: 'analytics123',
    name: 'Demo analytics',
    email: 'amalytics@demo.com',
    phone: '9999999991',
    roles: ['report_viewer']
  }
];

async function createDemoUsers() {
  console.log('🔧 Creating simple demo users...\n');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database');

    for (const user of DEMO_USERS) {
      console.log(`Creating user: ${user.username}`);
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { username: user.username }
      });

      if (existingUser) {
        console.log(`  User ${user.username} already exists, updating password...`);
        
        // Update password
        const hashedPassword = await bcrypt.hash(user.password, 12);
        await prisma.user.update({
          where: { username: user.username },
          data: { passwordHash: hashedPassword }
        });
      } else {
        // Create new user
        const hashedPassword = await bcrypt.hash(user.password, 12);
        const newUser = await prisma.user.create({
          data: {
            username: user.username,
            passwordHash: hashedPassword,
            name: user.name,
            email: user.email,
            phone: user.phone
          }
        });

        // Add roles
        for (const role of user.roles) {
          await prisma.userRoleAssignment.create({
            data: {
              userId: newUser.id,
              role: role
            }
          });
        }
      }

      console.log(`✅ ${user.username} ready with password: ${user.password}`);
    }

    console.log('\n🎉 Demo users created successfully!\n');
    console.log('📋 Login Credentials:');
    DEMO_USERS.forEach(user => {
      console.log(`${user.roles[0].toUpperCase().padEnd(8)}: ${user.username} / ${user.password}`);
    });
    
    console.log('\n🌐 You can now login at: http://localhost:3001/login');

  } catch (error) {
    console.error('❌ Error creating demo users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUsers();