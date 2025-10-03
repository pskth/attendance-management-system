const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function checkDuplicates() {
  try {
    console.log('\nÌ¥ç CHECKING FOR DUPLICATE DEPARTMENTS\n');
    console.log('='.repeat(80) + '\n');

    // Get all departments with their colleges
    const departments = await prisma.department.findMany({
      include: {
        colleges: true
      },
      orderBy: [
        { code: 'asc' },
        { name: 'asc' }
      ]
    });

    console.log(`Total departments found: ${departments.length}\n`);

    // Group by code
    const byCode = {};
    departments.forEach(dept => {
      if (!byCode[dept.code]) {
        byCode[dept.code] = [];
      }
      byCode[dept.code].push(dept);
    });

    // Find duplicates
    const duplicates = Object.entries(byCode).filter(([code, depts]) => depts.length > 1);

    if (duplicates.length === 0) {
      console.log('‚úÖ No duplicate department codes found\n');
    } else {
      console.log(`‚ùå Found ${duplicates.length} duplicate department code(s):\n`);
      
      duplicates.forEach(([code, depts]) => {
        console.log(`Department Code: ${code} (${depts.length} entries)`);
        depts.forEach((dept, i) => {
          console.log(`  ${i + 1}. ID: ${dept.id}`);
          console.log(`     Name: ${dept.name}`);
          console.log(`     College: ${dept.colleges?.name || 'N/A'} (${dept.colleges?.code || 'N/A'})`);
          console.log(`     College ID: ${dept.college_id}`);
        });
        console.log('');
      });
    }

    // Show all departments grouped by college
    console.log('='.repeat(80));
    console.log('\nÌ≥ä ALL DEPARTMENTS BY COLLEGE:\n');
    
    const colleges = await prisma.college.findMany({
      include: {
        departments: {
          orderBy: { code: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    colleges.forEach(college => {
      console.log(`\n${college.name} (${college.code}):`);
      college.departments.forEach(dept => {
        console.log(`  - ${dept.code}: ${dept.name}`);
      });
    });

    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('‚ùå Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicates();
