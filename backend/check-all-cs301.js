const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function checkAllCS301Offerings() {
  try {
    console.log('🔍 Checking All CS301 Offerings\n');

    const cs301 = await prisma.course.findFirst({
      where: { code: 'CS301' }
    });

    const allOfferings = await prisma.courseOffering.findMany({
      where: {
        courseId: cs301.id
      },
      include: {
        sections: true,
        academic_years: true,
        teacher: {
          include: {
            user: true
          }
        },
        enrollments: {
          include: {
            student: {
              include: {
                sections: true
              }
            }
          }
        }
      },
      orderBy: {
        semester: 'asc'
      }
    });

    console.log(`Total CS301 Offerings: ${allOfferings.length}\n`);

    allOfferings.forEach((offering, idx) => {
      console.log(`${idx + 1}. Offering ID: ${offering.id}`);
      console.log(`   Section: ${offering.sections?.section_name || 'Not assigned'}`);
      console.log(`   Semester: ${offering.semester}`);
      console.log(`   Academic Year: ${offering.academic_years?.year_name || 'Unknown'}`);
      console.log(`   Teacher: ${offering.teacher?.user?.name || 'Not assigned'}`);
      console.log(`   Enrolled Students: ${offering.enrollments.length}`);
      if (offering.enrollments.length > 0) {
        const studentSections = offering.enrollments.map(e => 
          e.student?.sections?.section_name || 'No section'
        );
        const uniqueSections = [...new Set(studentSections)];
        console.log(`   Student Sections: ${uniqueSections.join(', ')}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllCS301Offerings();
