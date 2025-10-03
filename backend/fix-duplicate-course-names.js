const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function fixDuplicateCourseNames() {
  try {
    console.log('\n��� Fixing Duplicate Course Names\n');
    console.log('='.repeat(80) + '\n');

    // Get NMIT college
    const nmit = await prisma.college.findFirst({
      where: { code: 'NMIT' }
    });

    if (!nmit) {
      console.log('❌ NMIT not found');
      return;
    }

    const csDept = await prisma.department.findFirst({
      where: { code: 'CS', college_id: nmit.id }
    });

    if (!csDept) {
      console.log('❌ CS department not found');
      return;
    }

    // Find CS201 course
    const cs201 = await prisma.course.findFirst({
      where: {
        code: 'CS201',
        departmentId: csDept.id
      }
    });

    if (!cs201) {
      console.log('❌ CS201 not found');
      return;
    }

    console.log(`Current CS201: "${cs201.name}"\n`);

    // Ask what to rename it to
    console.log('Suggested names for CS201:');
    console.log('  1. Advanced Data Structures');
    console.log('  2. Data Structures Lab');
    console.log('  3. Programming Fundamentals');
    console.log('  4. Object Oriented Programming');
    console.log('  5. Software Engineering\n');

    // Let's rename it to "Advanced Data Structures" to differentiate from CS301
    const newName = 'Advanced Data Structures';

    console.log(`Renaming CS201 to: "${newName}"\n`);

    await prisma.course.update({
      where: { id: cs201.id },
      data: { name: newName }
    });

    console.log('✅ CS201 renamed successfully!\n');

    // Verify the fix
    console.log('Current NMIT CS courses:\n');
    const courses = await prisma.course.findMany({
      where: { departmentId: csDept.id },
      orderBy: { code: 'asc' }
    });

    courses.forEach(course => {
      console.log(`  ${course.code} - ${course.name}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ Fix Complete\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixDuplicateCourseNames();
