const { PrismaClient } = require('./generated/prisma');

async function checkStudentCounts() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== Checking Student Distribution ===\n');
    
    // Get departments with their sections and students
    const departments = await prisma.department.findMany({
      include: {
        sections: {
          include: {
            students: true
          }
        }
      }
    });

    console.log(`Found ${departments.length} departments:\n`);
    
    departments.forEach(dept => {
      const totalStudents = dept.sections.reduce((sum, section) => sum + section.students.length, 0);
      console.log(`Department: ${dept.name} (${dept.code || 'No Code'})`);
      console.log(`  Total Students: ${totalStudents}`);
      console.log(`  Sections: ${dept.sections.length}`);
      
      dept.sections.forEach(section => {
        console.log(`    Section ${section.section_name}: ${section.students.length} students`);
      });
      console.log('');
    });

    // Also check total student count
    const totalStudents = await prisma.student.count();
    console.log(`\nTotal students in database: ${totalStudents}`);
    
  } catch (error) {
    console.error('Error checking student counts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudentCounts();
