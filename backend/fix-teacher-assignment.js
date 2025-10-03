const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function fixAssignment() {
  try {
    console.log('\nÌ¥ß FIXING CS TEACHER 1 ASSIGNMENT (SECTION A ONLY)\n');
    console.log('='.repeat(80) + '\n');

    // Get CS Teacher 1 from NMAMIT
    const teacher1 = await prisma.teacher.findFirst({
      where: {
        user: { name: 'CS Teacher 1' },
        department: {
          code: 'CS',
          colleges: { code: 'NMAMIT' }
        }
      },
      include: {
        user: true
      }
    });

    if (!teacher1) {
      console.log('‚ùå CS Teacher 1 not found');
      return;
    }

    console.log(`Found: ${teacher1.user.name}\n`);

    // Get Section B offering for CS301 NMAMIT that has this teacher
    const sectionB = await prisma.courseOffering.findFirst({
      where: {
        course: {
          code: 'CS301',
          department: {
            code: 'CS',
            colleges: { code: 'NMAMIT' }
          }
        },
        sections: { section_name: 'B' },
        teacherId: teacher1.id,
        semester: 5
      },
      include: {
        sections: true
      }
    });

    if (sectionB) {
      console.log(`Removing teacher from Section B...`);
      await prisma.courseOffering.update({
        where: { id: sectionB.id },
        data: { teacherId: null }
      });
      console.log('‚úÖ Removed teacher from Section B\n');
    } else {
      console.log('Section B not assigned to this teacher\n');
    }

    // Verify final state
    const finalOfferings = await prisma.courseOffering.findMany({
      where: {
        teacherId: teacher1.id
      },
      include: {
        course: true,
        sections: true,
        enrollments: true
      }
    });

    console.log('='.repeat(80));
    console.log(`\nÌ≥ä ${teacher1.user.name}'s Courses:\n`);
    
    if (finalOfferings.length === 0) {
      console.log('   No courses assigned');
    } else {
      finalOfferings.forEach((o, i) => {
        console.log(`   ${i + 1}. ${o.course.code} - Section ${o.sections?.section_name} (${o.enrollments.length} students)`);
      });
    }

    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('‚ùå Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAssignment();
