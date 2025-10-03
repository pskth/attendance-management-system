const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function listTeachers() {
  try {
    console.log('\nÌ±®‚ÄçÌø´ TEACHERS AND THEIR ASSIGNED COURSES:\n');
    console.log('='.repeat(80) + '\n');

    const teachers = await prisma.teacher.findMany({
      include: {
        user: true,
        department: {
          include: {
            colleges: true
          }
        },
        courseOfferings: {
          include: {
            course: true,
            sections: true,
            enrollments: true
          }
        }
      }
    });

    if (teachers.length === 0) {
      console.log('‚ùå No teachers found in the database!\n');
      return;
    }

    for (const teacher of teachers) {
      console.log(`\nÌ≥ç ${teacher.user.name}`);
      console.log(`   Employee ID: ${teacher.employeeId}`);
      console.log(`   Department: ${teacher.department?.name || 'None'} (${teacher.department?.colleges?.name || 'No College'})`);
      console.log(`   User ID: ${teacher.userId.substring(0, 12)}...`);
      console.log(`   Teacher ID: ${teacher.id.substring(0, 12)}...`);
      console.log(`   Assigned Courses: ${teacher.courseOfferings.length}`);

      if (teacher.courseOfferings.length > 0) {
        teacher.courseOfferings.forEach((offering, i) => {
          const students = offering.enrollments.length;
          console.log(`      ${i + 1}. ${offering.course.code} - ${offering.course.name}`);
          console.log(`         Section: ${offering.sections?.section_name || 'None'}`);
          console.log(`         Students: ${students}`);
        });
      } else {
        console.log('      ‚ö†Ô∏è  No courses assigned');
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\nÌ≥ä SUMMARY:');
    console.log(`   Total Teachers: ${teachers.length}`);
    console.log(`   Teachers with courses: ${teachers.filter(t => t.courseOfferings.length > 0).length}`);
    console.log(`   Teachers without courses: ${teachers.filter(t => t.courseOfferings.length === 0).length}`);
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('‚ùå Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listTeachers();
