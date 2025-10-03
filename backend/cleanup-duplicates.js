const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function cleanupDuplicateOfferings() {
  try {
    console.log('🧹 Cleaning up Duplicate Course Offerings\n');

    const nmamit = await prisma.college.findFirst({ where: { code: 'NMAMIT' } });
    const nmamitCS = await prisma.department.findFirst({
      where: { code: 'CS', college_id: nmamit.id }
    });

    const cs301 = await prisma.course.findFirst({
      where: { code: 'CS301', departmentId: nmamitCS.id }
    });

    const academicYear = await prisma.academic_years.findFirst({
      where: { is_active: true, college_id: nmamit.id }
    });

    // Get all CS301 offerings
    const offerings = await prisma.courseOffering.findMany({
      where: {
        courseId: cs301.id,
        semester: 5,
        year_id: academicYear.year_id
      },
      include: {
        sections: true,
        enrollments: true
      }
    });

    console.log(`Found ${offerings.length} CS301 offerings\n`);

    // Group by section
    const bySection = {};
    offerings.forEach(o => {
      const section = o.sections?.section_name || 'None';
      if (!bySection[section]) bySection[section] = [];
      bySection[section].push(o);
    });

    let deletedCount = 0;

    for (const [section, sectionOfferings] of Object.entries(bySection)) {
      console.log(`Section ${section}: ${sectionOfferings.length} offerings`);
      
      if (sectionOfferings.length > 1) {
        // Keep the one with enrollments, delete the empty ones
        const withEnrollments = sectionOfferings.filter(o => o.enrollments.length > 0);
        const empty = sectionOfferings.filter(o => o.enrollments.length === 0);

        console.log(`  - With enrollments: ${withEnrollments.length}`);
        console.log(`  - Empty: ${empty.length}`);

        for (const emptyOffering of empty) {
          console.log(`  🗑️  Deleting empty offering: ${emptyOffering.id}`);
          await prisma.courseOffering.delete({
            where: { id: emptyOffering.id }
          });
          deletedCount++;
        }
      }
    }

    console.log(`\n✅ Deleted ${deletedCount} duplicate offerings\n`);

    // Final verification
    const finalOfferings = await prisma.courseOffering.findMany({
      where: {
        courseId: cs301.id,
        semester: 5,
        year_id: academicYear.year_id
      },
      include: {
        sections: true,
        enrollments: true
      }
    });

    console.log('📊 Final CS301 Offerings:');
    finalOfferings.forEach(o => {
      console.log(`  Section ${o.sections?.section_name}: ${o.enrollments.length} students`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicateOfferings();
