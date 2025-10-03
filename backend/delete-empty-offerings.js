const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function deleteEmptyNMAMITofferings() {
  try {
    console.log('🗑️  Deleting Empty NMAMIT Offerings\n');

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

    // Get all CS301 offerings with enrollment count
    const offerings = await prisma.courseOffering.findMany({
      where: {
        courseId: cs301.id,
        semester: 5,
        year_id: academicYear.year_id
      },
      include: {
        sections: true,
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: {
        sections: {
          section_name: 'asc'
        }
      }
    });

    console.log(`Found ${offerings.length} CS301 offerings:\n`);

    offerings.forEach(o => {
      console.log(`  ${o.id.substring(0,8)}... Section ${o.sections?.section_name}: ${o._count.enrollments} enrollments`);
    });

    console.log('');

    // Delete empty offerings
    let deletedCount = 0;
    for (const offering of offerings) {
      if (offering._count.enrollments === 0) {
        console.log(`🗑️  Deleting empty offering: Section ${offering.sections?.section_name} (${offering.id.substring(0,8)}...)`);
        await prisma.courseOffering.delete({
          where: { id: offering.id }
        });
        deletedCount++;
      }
    }

    console.log(`\n✅ Deleted ${deletedCount} empty offerings\n`);

    // Verify
    const remaining = await prisma.courseOffering.findMany({
      where: {
        courseId: cs301.id,
        semester: 5,
        year_id: academicYear.year_id
      },
      include: {
        sections: true,
        _count: {
          select: { enrollments: true }
        }
      }
    });

    console.log('📊 Remaining offerings:');
    remaining.forEach(o => {
      console.log(`  Section ${o.sections?.section_name}: ${o._count.enrollments} students`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteEmptyNMAMITofferings();
