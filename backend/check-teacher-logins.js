const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function checkTeacherLogins() {
  try {
    const teachers = await prisma.user.findMany({
      where: {
        teacher: {
          isNot: null
        }
      },
      select: {
        id: true,
        name: true, 
        email: true,
        passwordHash: true,
        teacher: {
          select: {
            id: true,
            courseOfferings: {
              include: {
                course: { select: { name: true, code: true } }
              }
            }
          }
        }
      }
    });

    console.log('=== TEACHER LOGIN CREDENTIALS ===');
    
    teachers.forEach((teacher, index) => {
      console.log(`\n${index + 1}. ${teacher.name}`);
      console.log(`   Email: ${teacher.email}`);
      console.log(`   Password: ${teacher.passwordHash ? '[SET]' : '[NOT SET]'}`);
      console.log(`   Password Hash: ${teacher.passwordHash || 'None'}`);
      console.log(`   User ID: ${teacher.id}`);
      
      if (teacher.teacher) {
        console.log(`   Teacher ID: ${teacher.teacher.id}`);
        console.log(`   Courses: ${teacher.teacher.courseOfferings.length}`);
        
        if (teacher.teacher.courseOfferings.length > 0) {
          teacher.teacher.courseOfferings.slice(0, 3).forEach(offering => {
            console.log(`     - ${offering.course.code} - ${offering.course.name}`);
          });
          if (teacher.teacher.courseOfferings.length > 3) {
            console.log(`     ... and ${teacher.teacher.courseOfferings.length - 3} more`);
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeacherLogins();
