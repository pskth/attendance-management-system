// Quick script to check user roles
const { PrismaClient } = require('./generated/prisma');

async function checkUserRoles() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('Connected to database');
    
    // Get all users with their roles - showing only first 10
    const users = await prisma.user.findMany({
      include: {
        userRoles: true
      },
      take: 10
    });
    
    console.log('\n=== USER ROLES SUMMARY ===');
    users.forEach((user, index) => {
      const roles = user.userRoles.map(r => r.role);
      console.log(`${index + 1}. Username: ${user.username}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Roles: [${roles.join(', ')}]`);
      console.log(`   Has admin role: ${roles.includes('admin')}`);
      console.log(`   Has teacher role: ${roles.includes('teacher')}`);
      console.log(`   Can access analytics: ${roles.some(role => ['admin', 'teacher', 'analytics'].includes(role))}`);
      console.log('');
    });
    
    // Check for admin users specifically
    const adminUsers = await prisma.user.findMany({
      include: {
        userRoles: true
      },
      where: {
        userRoles: {
          some: {
            role: 'admin'
          }
        }
      }
    });
    
    console.log(`\n=== ADMIN USERS (${adminUsers.length} found) ===`);
    adminUsers.forEach(user => {
      const roles = user.userRoles.map(r => r.role);
      console.log(`Username: ${user.username}, Roles: [${roles.join(', ')}]`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRoles();
