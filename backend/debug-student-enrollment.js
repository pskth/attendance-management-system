const { PrismaClient } = require('./generated/prisma');

async function debugStudentEnrollment() {
  const prisma = new PrismaClient();
  
  try {
    console.log('\n=== DEBUGGING STUDENT ENROLLMENT MISMATCH ===\n');
    
    // Find the specific section NM_CSE_B2
    const section = await prisma.sections.findFirst({
      where: {
        section_name: 'NM_CSE_B2'
      },
      include: {
        students: {
          include: {
            user: true
          }
        },
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
      console.log('Section NM_CSE_B2 not found');
      return;
    }

    console.log(`Section: ${section.section_name} (${section.departments.name})`);
    console.log(`Total students in section: ${section.students.length}`);
    
    if (section.students.length > 0) {
      console.log('\nStudents in section:');
      section.students.forEach((student, index) => {
        console.log(`  ${index + 1}. ${student.user.name} (${student.usn})`);
      });
    }

    console.log(`\nCourse offerings in this section: ${section.course_offerings.length}`);
    
    for (const offering of section.course_offerings) {
      console.log(`\n--- Course: ${offering.course.name} (${offering.course.code}) ---`);
      console.log(`Enrollments in this course: ${offering.enrollments.length}`);
      
      if (offering.enrollments.length > 0) {
        console.log('Students enrolled in this course:');
        offering.enrollments.forEach((enrollment, index) => {
          if (enrollment.student) {
            console.log(`  ${index + 1}. ${enrollment.student.user.name} (${enrollment.student.usn})`);
          }
        });
      } else {
        console.log('No students enrolled in this course');
      }
    }

    // Check if students are enrolled in courses outside their section
    console.log('\n=== CHECKING STUDENT ENROLLMENTS ACROSS ALL COURSES ===');
    
    for (const student of section.students) {
      const allEnrollments = await prisma.studentEnrollment.findMany({
        where: {
          studentId: student.id
        },
        include: {
          offering: {
            include: {
              course: true,
              sections: true
            }
          }
        }
      });
      
      console.log(`\n${student.user.name} (${student.usn}) enrollments:`);
      if (allEnrollments.length === 0) {
        console.log('  No enrollments found');
      } else {
        allEnrollments.forEach(enrollment => {
          const sectionName = enrollment.offering.sections?.section_name || 'No section';
          console.log(`  - ${enrollment.offering.course.name} (${enrollment.offering.course.code}) in section ${sectionName}`);
        });
      }
    }

  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugStudentEnrollment();
