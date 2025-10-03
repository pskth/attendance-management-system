const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function checkDuplicateCourses() {
  try {
    console.log('🔍 Checking for Duplicate CS301 Courses\n');

    const nmamit = await prisma.college.findFirst({ where: { code: 'NMAMIT' } });
    const nmamitCS = await prisma.department.findFirst({
      where: { code: 'CS', college_id: nmamit.id }
    });

    // Get all CS301 courses for NMAMIT CS department
    const cs301Courses = await prisma.course.findMany({
      where: {
        code: 'CS301',
        departmentId: nmamitCS.id
      }
    });

    console.log(`Found ${cs301Courses.length} CS301 courses in NMAMIT CS department\n`);

    cs301Courses.forEach((course, idx) => {
      console.log(`${idx + 1}. Course ID: ${course.id}`);
      console.log(`   Name: ${course.name}`);
      console.log(`   Code: ${course.code}`);
      console.log('');
    });

    // Get all offerings for each course
    const academicYear = await prisma.academic_years.findFirst({
      where: { is_active: true, college_id: nmamit.id }
    });

    for (const course of cs301Courses) {
      const offerings = await prisma.courseOffering.findMany({
        where: {
          courseId: course.id,
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

      console.log(`Course ${course.id.substring(0,8)}... has ${offerings.length} offerings:`);
      offerings.forEach(o => {
        console.log(`  Section ${o.sections?.section_name}: ${o._count.enrollments} students`);
      });
      console.log('');
    }

    // Check if there are multiple courses with same code
    if (cs301Courses.length > 1) {
      console.log('⚠️  Multiple CS301 courses found! This will cause duplicates in UI.\n');
      console.log('Solution: Keep one course, migrate offerings to it, delete the rest.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicateCourses();
