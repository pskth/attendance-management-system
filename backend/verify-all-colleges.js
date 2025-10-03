const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function verifyAll() {
  try {
    console.log('\n��� Verification Report - All Colleges\n');
    console.log('='.repeat(80) + '\n');

    const colleges = await prisma.college.findMany();

    for (const college of colleges) {
      console.log(`\n���️  ${college.name} (${college.code})`);
      console.log('─'.repeat(80));

      const csDept = await prisma.department.findFirst({
        where: { code: 'CS', college_id: college.id }
      });

      if (!csDept) {
        console.log('  No CS department\n');
        continue;
      }

      const courses = await prisma.course.findMany({
        where: { departmentId: csDept.id }
      });

      const sections = await prisma.sections.findMany({
        where: { department_id: csDept.id },
        orderBy: { section_name: 'asc' }
      });

      console.log(`\n  Courses: ${courses.length}`);
      console.log(`  Sections: ${sections.length} (${sections.map(s => s.section_name).join(', ')})\n`);

      let totalEnrollments = 0;
      let hasNull = false;
      let hasDuplicates = false;

      for (const course of courses) {
        const offerings = await prisma.courseOffering.findMany({
          where: { courseId: course.id, semester: 5 },
          include: {
            sections: true,
            _count: { select: { enrollments: true } }
          },
          orderBy: { sections: { section_name: 'asc' } }
        });

        console.log(`  ${course.code} - ${course.name}`);
        
        if (offerings.length === 0) {
          console.log('    ⚠️  No offerings!');
          continue;
        }

        const sectionCounts = {};
        offerings.forEach(o => {
          const sName = o.sections?.section_name || 'NULL';
          if (sName === 'NULL') hasNull = true;
          
          if (sectionCounts[sName]) {
            hasDuplicates = true;
            console.log(`    ❌ DUPLICATE Section ${sName}: ${o._count.enrollments} students`);
          } else {
            sectionCounts[sName] = o._count.enrollments;
            console.log(`    ✓ Section ${sName}: ${o._count.enrollments} students`);
          }
          
          totalEnrollments += o._count.enrollments;
        });
      }

      console.log(`\n  Summary:`);
      console.log(`    Total enrollments: ${totalEnrollments}`);
      console.log(`    Has NULL sections: ${hasNull ? '❌ YES' : '✅ NO'}`);
      console.log(`    Has duplicates: ${hasDuplicates ? '❌ YES' : '✅ NO'}`);
      console.log('');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Verification Complete\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAll();
