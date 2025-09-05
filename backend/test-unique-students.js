const { PrismaClient } = require('./generated/prisma');

async function testUniqueStudentCount() {
  const prisma = new PrismaClient();
  
  try {
    console.log('\n=== TESTING UNIQUE STUDENT COUNT FIX ===\n');
    
    // Test the first few departments to see the improvement
    const departments = await prisma.department.findMany({
      include: {
        sections: {
          include: {
            students: true,
            course_offerings: {
              include: {
                enrollments: {
                  include: {
                    student: true
                  }
                }
              }
            }
          }
        }
      }
    });

    departments.slice(0, 3).forEach(dept => {
      console.log(`Department: ${dept.name} (${dept.code})`);
      
      // Calculate unique students across all sections (our new method)
      const departmentUniqueStudentIds = new Set();
      let totalEnrollments = 0;
      
      dept.sections.forEach(section => {
        section.course_offerings.forEach(offering => {
          offering.enrollments.forEach(enrollment => {
            if (enrollment.student?.id) {
              departmentUniqueStudentIds.add(enrollment.student.id);
              totalEnrollments++;
            }
          });
        });
      });
      
      console.log(`  BEFORE FIX: ${totalEnrollments} (total enrollments)`);
      console.log(`  AFTER FIX: ${departmentUniqueStudentIds.size} (unique students)`);
      console.log(`  SECTION STUDENTS: ${dept.sections.reduce((sum, section) => sum + section.students.length, 0)}`);
      console.log('');
    });

    console.log('✅ The fix should now show correct unique student counts instead of enrollment totals.');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUniqueStudentCount();
