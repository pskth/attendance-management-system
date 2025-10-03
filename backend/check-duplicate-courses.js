const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function checkDuplicateCourses() {
  try {
    console.log('\nÌ≥ö Checking for Duplicate Course Names\n');
    console.log('='.repeat(80) + '\n');

    const colleges = await prisma.college.findMany();

    for (const college of colleges) {
      console.log(`\nÌøõÔ∏è  ${college.name} (${college.code})`);
      console.log('‚îÄ'.repeat(80));

      const csDept = await prisma.department.findFirst({
        where: { code: 'CS', college_id: college.id }
      });

      if (!csDept) {
        console.log('  No CS department\n');
        continue;
      }

      const courses = await prisma.course.findMany({
        where: { departmentId: csDept.id },
        orderBy: { code: 'asc' }
      });

      console.log(`\n  Total Courses: ${courses.length}\n`);

      // Group by name to find duplicates
      const nameGroups = {};
      courses.forEach(course => {
        if (!nameGroups[course.name]) {
          nameGroups[course.name] = [];
        }
        nameGroups[course.name].push(course);
      });

      // Show all courses
      courses.forEach(course => {
        const isDuplicate = nameGroups[course.name].length > 1;
        const marker = isDuplicate ? '‚ö†Ô∏è  DUPLICATE' : '‚úì';
        console.log(`  ${marker} ${course.code} - ${course.name}`);
      });

      // Show duplicates summary
      console.log('\n  Duplicate Names:');
      let foundDuplicates = false;
      Object.entries(nameGroups).forEach(([name, coursesWithName]) => {
        if (coursesWithName.length > 1) {
          foundDuplicates = true;
          console.log(`\n    "${name}"`);
          coursesWithName.forEach(c => {
            console.log(`      - ${c.code} (ID: ${c.id.substring(0, 8)}...)`);
          });
        }
      });

      if (!foundDuplicates) {
        console.log('    None');
      }

      console.log('');
    }

    console.log('\n' + '='.repeat(80));
    console.log('‚úÖ Check Complete\n');

  } catch (error) {
    console.error('‚ùå Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicateCourses();
