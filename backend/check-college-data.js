const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function checkCollegeData() {
  try {
    console.log('🏛️  Checking College Data\n');

    // Get all colleges
    const colleges = await prisma.college.findMany();
    console.log('Colleges:');
    colleges.forEach(c => {
      console.log(`  - ${c.name} (${c.code}): ID = ${c.id}`);
    });
    console.log('');

    // Check CS department and its college
    const csDept = await prisma.department.findFirst({
      where: { code: 'CS' },
      include: {
        colleges: true
      }
    });

    if (csDept) {
      console.log('CS Department:');
      console.log(`  Name: ${csDept.name}`);
      console.log(`  Code: ${csDept.code}`);
      console.log(`  College: ${csDept.colleges?.name} (${csDept.colleges?.code})`);
      console.log(`  College ID: ${csDept.college_id}`);
      console.log('');
    }

    // Check students by college
    const students = await prisma.student.findMany({
      where: {
        semester: 5,
        departments: {
          code: 'CS'
        }
      },
      include: {
        colleges: true
      }
    });

    console.log(`Total CS Students in Semester 5: ${students.length}\n`);

    const byCollege = students.reduce((acc, s) => {
      const collegeName = s.colleges?.name || 'No College';
      if (!acc[collegeName]) acc[collegeName] = [];
      acc[collegeName].push(s);
      return acc;
    }, {});

    console.log('Students by College:');
    Object.keys(byCollege).forEach(college => {
      console.log(`  ${college}: ${byCollege[college].length} students`);
      byCollege[college].slice(0, 3).forEach(s => {
        console.log(`    - ${s.usn}`);
      });
      if (byCollege[college].length > 3) {
        console.log(`    ... and ${byCollege[college].length - 3} more`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCollegeData();
