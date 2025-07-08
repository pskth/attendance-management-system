import Database from './lib/database';

async function findCourse() {
  try {
    const prisma = Database.getInstance();
    
    const course = await prisma.course.findFirst({
      where: { code: 'CS301' }
    });
    
    console.log('CS301 course:', course);
    
    // Also check enrollments for this course
    if (course) {
      const enrollments = await prisma.studentEnrollment.findMany({
        where: {
          offering: {
            courseId: course.id
          }
        },
        include: {
          student: {
            include: { user: true }
          },
          offering: {
            include: { course: true }
          }
        },
        take: 5
      });
      
      console.log('Sample enrollments for CS301:', enrollments.length);
      enrollments.forEach(enrollment => {
        console.log(`- ${enrollment.student?.user.name} (${enrollment.student?.usn})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await Database.getInstance().$disconnect();
  }
}

findCourse();
