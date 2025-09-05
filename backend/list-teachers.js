const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function listTeachers() {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: { select: { name: true, email: true } },
        courseOfferings: {
          include: {
            course: { select: { name: true, code: true } }
          }
        }
      }
    });

    console.log('=== ALL TEACHERS ===');
    if (teachers.length === 0) {
      console.log('No teachers found in database');
      return;
    }

    teachers.forEach((teacher, index) => {
      console.log(`\n${index + 1}. ${teacher.user.name}`);
      console.log(`   Email: ${teacher.user.email}`);
      console.log(`   Teacher ID: ${teacher.id}`);
      console.log(`   User ID: ${teacher.userId}`);
      console.log(`   Courses: ${teacher.courseOfferings.length}`);
      
      if (teacher.courseOfferings.length > 0) {
        teacher.courseOfferings.forEach(offering => {
          console.log(`     - ${offering.course.code} - ${offering.course.name}`);
        });
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listTeachers();
