const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function checkTeacherEnrollments() {
  try {
    // Find teacher Demo Teacher
    const teacher = await prisma.teacher.findFirst({
      where: { 
        user: { email: 'teacher@demo.com' }
      },
      include: {
        user: { select: { name: true, email: true } },
        courseOfferings: {
          include: {
            course: { select: { name: true, code: true } },
            sections: { select: { section_name: true } },
            enrollments: {
              include: {
                student: {
                  include: {
                    user: { select: { name: true, email: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!teacher) {
      console.log('Teacher not found');
      return;
    }

    console.log('=== TEACHER COURSE ENROLLMENTS ===');
    console.log('Teacher:', teacher.user.name);
    console.log('Email:', teacher.user.email);
    console.log('\nCourses taught:');
    
    teacher.courseOfferings.forEach(offering => {
      console.log(`\n- ${offering.course.code} - ${offering.course.name}`);
      console.log(`  Section: ${offering.sections?.section_name || 'No section'}`);
      console.log(`  Offering ID: ${offering.id}`);
      console.log(`  Course ID: ${offering.courseId}`);
      console.log(`  Enrolled students: ${offering.enrollments.length}`);
      
      if (offering.enrollments.length > 0) {
        console.log('  Students:');
        offering.enrollments.forEach(enrollment => {
          console.log(`    - ${enrollment.student.user.name} (${enrollment.student.user.email})`);
        });
      } else {
        console.log('  ⚠️  NO STUDENTS ENROLLED');
      }
    });
    
    console.log('\n=== SUMMARY ===');
    const totalCourses = teacher.courseOfferings.length;
    const coursesWithStudents = teacher.courseOfferings.filter(o => o.enrollments.length > 0).length;
    const totalStudents = teacher.courseOfferings.reduce((sum, o) => sum + o.enrollments.length, 0);
    
    console.log(`Total courses: ${totalCourses}`);
    console.log(`Courses with students: ${coursesWithStudents}`);
    console.log(`Total students across all courses: ${totalStudents}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeacherEnrollments();
