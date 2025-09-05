const { PrismaClient } = require('./generated/prisma');

async function checkCourses() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== Checking Actual Courses ===\n');
    
    // Get all courses
    const courses = await prisma.course.findMany({
      include: {
        department: true,
        courseOfferings: {
          include: {
            sections: true,
            enrollments: {
              include: {
                student: {
                  include: {
                    sections: true,
                    departments: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log(`Found ${courses.length} courses:\n`);
    
    courses.forEach(course => {
      console.log(`Course: ${course.name} (${course.code})`);
      console.log(`  Department: ${course.department?.name || 'No Department'}`);
      console.log(`  Type: ${course.type || 'No Type'}`);
      console.log(`  Offerings: ${course.courseOfferings.length}`);
      
      course.courseOfferings.forEach((offering, index) => {
        console.log(`    Offering ${index + 1}:`);
        console.log(`      Section: ${offering.sections?.section_name || 'No Section'}`);
        console.log(`      Enrollments: ${offering.enrollments.length}`);
      });
      console.log('');
    });

    // Get departments with their actual course offerings
    console.log('\n=== Department-wise Course Distribution ===\n');
    
    const departments = await prisma.department.findMany({
      include: {
        courses: true,
        sections: {
          include: {
            course_offerings: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });

    departments.forEach(dept => {
      console.log(`Department: ${dept.name} (${dept.code || 'No Code'})`);
      console.log(`  Direct Courses: ${dept.courses.length}`);
      
      dept.courses.forEach(course => {
        console.log(`    - ${course.name} (${course.code})`);
      });
      
      console.log(`  Sections: ${dept.sections.length}`);
      dept.sections.forEach(section => {
        console.log(`    Section ${section.section_name}: ${section.course_offerings.length} course offerings`);
        section.course_offerings.forEach(offering => {
          console.log(`      - ${offering.course.name} (${offering.course.code})`);
        });
      });
      console.log('');
    });
    
  } catch (error) {
    console.error('Error checking courses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCourses();
