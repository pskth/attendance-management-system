const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function fixCS301Offerings() {
  try {
    console.log('🔧 Fixing CS301 Course Offerings\n');

    const cs301 = await prisma.course.findFirst({
      where: { code: 'CS301' }
    });

    if (!cs301) {
      console.log('❌ CS301 not found');
      return;
    }

    // Get the 2025-26 academic year
    const academicYear = await prisma.academic_years.findFirst({
      where: { year_name: '2025-26' }
    });

    // Get sections A, B, C for CS department
    const sections = await prisma.sections.findMany({
      where: {
        section_name: { in: ['A', 'B', 'C'] },
        departments: {
          code: 'CS'
        }
      },
      include: {
        departments: true
      }
    });

    console.log(`Found ${sections.length} CS sections\n`);

    // Get current offerings
    const currentOfferings = await prisma.courseOffering.findMany({
      where: {
        courseId: cs301.id,
        semester: 5,
        year_id: academicYear.year_id
      },
      include: {
        sections: true
      }
    });

    console.log('Current CS301 offerings for Semester 5:');
    currentOfferings.forEach(o => {
      console.log(`  - Section ${o.sections?.section_name || 'None'}: ${o.id}`);
    });
    console.log('');

    // Check for the wrong semester offering
    const wrongOffering = await prisma.courseOffering.findFirst({
      where: {
        courseId: cs301.id,
        semester: 1,
        sections: {
          section_name: 'B',
          departments: { code: 'CS' }
        }
      },
      include: {
        sections: true
      }
    });

    if (wrongOffering) {
      console.log(`⚠️  Found Section B offering in Semester 1: ${wrongOffering.id}`);
      console.log('   Updating to Semester 5...\n');
      
      await prisma.courseOffering.update({
        where: { id: wrongOffering.id },
        data: { 
          semester: 5,
          year_id: academicYear.year_id
        }
      });
      
      console.log('✅ Updated Section B offering to Semester 5');
    }

    // Check if Section C needs an offering
    const sectionC = sections.find(s => s.section_name === 'C');
    const hasCOffering = currentOfferings.some(o => o.sections?.section_name === 'C');

    if (sectionC && !hasCOffering) {
      console.log('\n📝 Creating offering for Section C...');
      
      await prisma.courseOffering.create({
        data: {
          courseId: cs301.id,
          semester: 5,
          year_id: academicYear.year_id,
          section_id: sectionC.section_id,
          teacherId: null // No teacher assigned yet
        }
      });
      
      console.log('✅ Created Section C offering for Semester 5');
    }

    // Show final state
    console.log('\n📊 Final CS301 Offerings for Semester 5:');
    const finalOfferings = await prisma.courseOffering.findMany({
      where: {
        courseId: cs301.id,
        semester: 5,
        year_id: academicYear.year_id
      },
      include: {
        sections: true,
        teacher: {
          include: {
            user: true
          }
        }
      }
    });

    finalOfferings.forEach(o => {
      console.log(`  ✓ Section ${o.sections?.section_name || 'None'}: Teacher ${o.teacher?.user?.name || 'Not assigned'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixCS301Offerings();
