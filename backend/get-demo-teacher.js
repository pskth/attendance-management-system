const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function getDemoTeacher() {
  try {
    const demoTeacher = await prisma.user.findFirst({
      where: { email: 'teacher@demo.com' },
      select: { 
        id: true,
        username: true, 
        name: true, 
        email: true,
        passwordHash: true
      }
    });
    
    if (demoTeacher) {
      console.log('Demo Teacher Details:');
      console.log('Username:', demoTeacher.username);
      console.log('Name:', demoTeacher.name);
      console.log('Email:', demoTeacher.email);
      console.log('Has Password Hash:', !!demoTeacher.passwordHash);
      console.log('Password Hash Length:', demoTeacher.passwordHash ? demoTeacher.passwordHash.length : 0);
    } else {
      console.log('Demo teacher not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getDemoTeacher();
