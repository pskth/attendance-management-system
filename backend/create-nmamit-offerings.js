const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function createNMAMITofferings() {
  try {
    console.log('📝 Creating Missing NMAMIT CS301 Offerings\n');

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

    // Get all sections
    const sections = await prisma.sections.findMany({
      where: {
        department_id: nmamitCS.id,
        section_name: { in: ['A', 'B', 'C'] }
      }
    });

    console.log(`Found ${sections.length} NMAMIT CS sections\n`);

    for (const section of sections) {
      const existing = await prisma.courseOffering.findFirst({
        where: {
          courseId: cs301.id,
          semester: 5,
          year_id: academicYear.year_id,
          section_id: section.section_id
        }
      });

      if (existing) {
        console.log(`✓ Section ${section.section_name} offering already exists`);
      } else {
        await prisma.courseOffering.create({
          data: {
            courseId: cs301.id,
            semester: 5,
            year_id: academicYear.year_id,
            section_id: section.section_id,
            teacherId: null
          }
        });
        console.log(`✅ Created Section ${section.section_name} offering`);
      }
    }

    console.log('\n📊 All CS301 offerings for NMAMIT:');
    const allOfferings = await prisma.courseOffering.findMany({
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

    allOfferings.forEach(o => {
      console.log(`  Section ${o.sections?.section_name}: ${o.enrollments.length} students`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createNMAMITofferings();
