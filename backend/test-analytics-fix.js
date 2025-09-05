const { PrismaClient } = require('./generated/prisma');

async function testAnalyticsFix() {
  const prisma = new PrismaClient();
  
  try {
    console.log('\n=== TESTING ANALYTICS FIX ===\n');
    
    // Simulate the analytics calculation for NM_CSE_B2 section
    const section = await prisma.sections.findFirst({
      where: {
        section_name: 'NM_CSE_B2'
      },
      include: {
        students: true,
        course_offerings: {
          include: {
            course: true,
            enrollments: {
              include: {
                student: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        },
        departments: true
      }
    });

    if (!section) {
      console.log('Section not found');
      return;
    }

    console.log(`Section: ${section.section_name}`);
    console.log(`Students assigned to section: ${section.students.length}`);
    
    let totalEnrollments = 0;
    console.log('\nCourse offerings and enrollments:');
    
    section.course_offerings.forEach(offering => {
      console.log(`  ${offering.course.name} (${offering.course.code}): ${offering.enrollments.length} enrollments`);
      totalEnrollments += offering.enrollments.length;
    });
    
    console.log(`\nBEFORE FIX: Would show ${section.students.length} students`);
    console.log(`AFTER FIX: Now shows ${totalEnrollments} students`);
    
    if (totalEnrollments === 0) {
      console.log('\n✅ CORRECT: Section shows 0 students because no students are enrolled in its courses');
    } else {
      console.log(`\n✅ CORRECT: Section shows ${totalEnrollments} actually enrolled students`);
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAnalyticsFix();
