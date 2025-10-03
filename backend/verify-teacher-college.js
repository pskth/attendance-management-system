const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function verify() {
  try {
    console.log('\nÌ¥ç VERIFYING TEACHER COLLEGE FILTER\n');
    console.log('='.repeat(80) + '\n');

    // Get CS Teacher 1 from NMAMIT
    const teacher = await prisma.teacher.findFirst({
      where: {
        user: { name: 'CS Teacher 1' },
        department: {
          code: 'CS',
          colleges: { code: 'NMAMIT' }
        }
      },
      include: {
        user: true,
        department: {
          include: {
            colleges: true
          }
        }
      }
    });

    if (!teacher) {
      console.log('‚ùå Teacher not found');
      return;
    }

    console.log(`Teacher: ${teacher.user.name}`);
    console.log(`College: ${teacher.department.colleges.name} (${teacher.department.colleges.code})`);
    console.log(`Department: ${teacher.department.name} (${teacher.department.code})\n`);

    // Get all departments for this college
    const departments = await prisma.department.findMany({
      where: {
        college_id: teacher.department.college_id
      },
      include: {
        colleges: true
      },
      orderBy: { code: 'asc' }
    });

    console.log('='.repeat(80));
    console.log(`\nÌ≥ö Departments in ${teacher.department.colleges.code}:\n`);
    
    departments.forEach((dept, i) => {
      console.log(`${i + 1}. ${dept.code}: ${dept.name}`);
      console.log(`   College: ${dept.colleges.name} (${dept.colleges.code})`);
      console.log(`   ID: ${dept.id}\n`);
    });

    console.log('='.repeat(80));
    console.log(`\n‚úÖ Total departments for ${teacher.department.colleges.code}: ${departments.length}`);
    console.log(`\nExpected behavior:`);
    console.log(`- Teacher dropdown should show ONLY these ${departments.length} departments`);
    console.log(`- Should NOT show departments from other colleges\n`);
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('‚ùå Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
