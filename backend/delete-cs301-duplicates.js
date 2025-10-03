const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function deleteDuplicates() {
  try {
    console.log('Ì∑ëÔ∏è  Deleting CS301 Duplicate Offerings\n');

    const nmamit = await prisma.college.findFirst({ where: { code: 'NMAMIT' } });
    const csDept = await prisma.department.findFirst({
      where: { code: 'CS', college_id: nmamit.id }
    });

    const cs301 = await prisma.course.findFirst({
      where: { code: 'CS301', departmentId: csDept.id }
    });

    // Get all CS301 offerings
    const offerings = await prisma.courseOffering.findMany({
      where: { courseId: cs301.id, semester: 5 },
      include: {
        sections: true,
        _count: { select: { enrollments: true } }
      },
      orderBy: {
        sections: { section_name: 'asc' }
      }
    });

    console.log('Current CS301 Offerings:\n');
    offerings.forEach((o, idx) => {
      console.log(`${idx + 1}. ${o.id} - Section ${o.sections?.section_name}: ${o._count.enrollments} students`);
    });

    // These are the IDs from the earlier check that have 0 students
    const duplicateIds = ['0d7dfe84-e148-4357-8fdf-2c0d5a4c8249', '6e860090-fb8a-4ad6-9c20-ad820b9e748e'];

    console.log('\nÌ∑ëÔ∏è  Deleting specific duplicates:\n');
    
    for (const id of duplicateIds) {
      const offering = offerings.find(o => o.id === id);
      if (offering) {
        console.log(`   Deleting: ${id.substring(0,8)}... Section ${offering.sections?.section_name} (${offering._count.enrollments} students)`);
        await prisma.courseOffering.delete({ where: { id } });
      }
    }

    console.log('\n‚úÖ Duplicates deleted\n');

    // Verify
    const remaining = await prisma.courseOffering.findMany({
      where: { courseId: cs301.id, semester: 5 },
      include: {
        sections: true,
        _count: { select: { enrollments: true } }
      }
    });

    console.log('Remaining CS301 Offerings:\n');
    remaining.forEach(o => {
      console.log(`  Section ${o.sections?.section_name}: ${o._count.enrollments} students`);
    });

  } catch (error) {
    console.error('‚ùå Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteDuplicates();
