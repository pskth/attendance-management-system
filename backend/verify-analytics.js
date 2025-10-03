const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function verifyAnalyticsData() {
  try {
    console.log('📊 Verifying Analytics Data\n');
    console.log('='.repeat(80) + '\n');

    const nmit = await prisma.college.findFirst({ where: { code: 'NMIT' } });
    const nmamit = await prisma.college.findFirst({ where: { code: 'NMAMIT' } });

    for (const college of [nmit, nmamit]) {
      console.log(`\n🏛️  ${college.name} (${college.code})`);
      console.log('─'.repeat(80));

      // Get CS department for this college
      const csDept = await prisma.department.findFirst({
        where: {
          code: 'CS',
          college_id: college.id
        },
        include: {
          sections: true
        }
      });

      if (!csDept) {
        console.log('  ⚠️  No CS department found\n');
        continue;
      }

      console.log(`\n  Department: ${csDept.name}`);
      console.log(`  Department ID: ${csDept.id}`);
      console.log(`  Sections: ${csDept.sections.length}\n`);

      // Get students in semester 5 (Year 3)
      const students = await prisma.student.findMany({
        where: {
          college_id: college.id,
          department_id: csDept.id,
          semester: 5
        },
        include: {
          sections: true
        }
      });

      console.log(`  📚 Students in Semester 5: ${students.length}`);

      // Group by section
      const bySection = students.reduce((acc, s) => {
        const section = s.sections?.section_name || 'No Section';
        if (!acc[section]) acc[section] = [];
        acc[section].push(s);
        return acc;
      }, {});

      Object.keys(bySection).sort().forEach(section => {
        console.log(`     Section ${section}: ${bySection[section].length} students`);
      });

      // Get course offerings
      const offerings = await prisma.courseOffering.findMany({
        where: {
          course: {
            departmentId: csDept.id
          },
          semester: 5
        },
        include: {
          course: true,
          sections: true,
          enrollments: {
            include: {
              student: {
                include: {
                  sections: true
                }
              }
            }
          }
        }
      });

      console.log(`\n  📚 Course Offerings for Semester 5: ${offerings.length}\n`);

      // Group offerings by course
      const byCourse = offerings.reduce((acc, o) => {
        const courseCode = o.course.code;
        if (!acc[courseCode]) {
          acc[courseCode] = {
            name: o.course.name,
            offerings: []
          };
        }
        acc[courseCode].offerings.push(o);
        return acc;
      }, {});

      Object.keys(byCourse).sort().forEach(courseCode => {
        const course = byCourse[courseCode];
        console.log(`     ${courseCode} - ${course.name}:`);

        course.offerings.forEach(o => {
          const sectionName = o.sections?.section_name || 'No Section';
          const enrollmentCount = o.enrollments.length;
          
          // Count unique students
          const uniqueStudents = new Set(o.enrollments.map(e => e.student?.id)).size;
          
          console.log(`       Section ${sectionName}: ${enrollmentCount} enrollments (${uniqueStudents} unique students)`);
          
          if (enrollmentCount > 0 && enrollmentCount <= 3) {
            o.enrollments.forEach(e => {
              console.log(`         - ${e.student?.usn} (Section ${e.student?.sections?.section_name})`);
            });
          }
        });
        console.log('');
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Analytics Verification Complete\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAnalyticsData();
