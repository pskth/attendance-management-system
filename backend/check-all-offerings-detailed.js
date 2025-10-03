const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function checkAllOfferings() {
  try {
    console.log('Ì¥ç Checking All Course Offerings for NMAMIT CS\n');

    const nmamit = await prisma.college.findFirst({ where: { code: 'NMAMIT' } });
    const csDept = await prisma.department.findFirst({
      where: { code: 'CS', college_id: nmamit.id }
    });

    // Get all CS301 offerings
    const cs301 = await prisma.course.findFirst({
      where: { code: 'CS301', departmentId: csDept.id }
    });

    const cs301Offerings = await prisma.courseOffering.findMany({
      where: { courseId: cs301.id, semester: 5 },
      include: {
        sections: true,
        _count: { select: { enrollments: true } }
      }
    });

    console.log(`CS301 Offerings: ${cs301Offerings.length}\n`);
    cs301Offerings.forEach((o, idx) => {
      console.log(`${idx + 1}. ${o.id.substring(0,8)}... Section ${o.sections?.section_name || 'NULL'}: ${o._count.enrollments} students`);
    });

    // Get all other courses
    console.log('\n\nAll Other CS Courses for Semester 5:\n');
    const allCourses = await prisma.course.findMany({
      where: { departmentId: csDept.id }
    });

    for (const course of allCourses) {
      const offerings = await prisma.courseOffering.findMany({
        where: { courseId: course.id, semester: 5 },
        include: {
          sections: true,
          _count: { select: { enrollments: true } }
        }
      });

      if (offerings.length > 0) {
        console.log(`\n${course.code} - ${course.name}:`);
        offerings.forEach(o => {
          console.log(`  Section ${o.sections?.section_name || 'NULL'}: ${o._count.enrollments} students`);
        });
      }
    }

  } catch (error) {
    console.error('‚ùå Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllOfferings();
