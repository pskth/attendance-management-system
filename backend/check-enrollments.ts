import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function checkStudentEnrollments() {
  console.log('=== STUDENT ENROLLMENT VERIFICATION ===\n');

  try {
    // Get all enrollments with student and course details
    const enrollments = await prisma.studentEnrollment.findMany({
      include: {
        student: {
          select: {
            usn: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        offering: {
          include: {
            course: {
              select: {
                name: true,
                code: true
              }
            },
            academic_years: {
              select: {
                year_name: true
              }
            },
            sections: {
              select: {
                section_name: true
              }
            }
          }
        }
      },
      orderBy: {
        id: 'desc'
      },
      take: 20 // Show latest 20 enrollments
    });

    console.log(`Found ${enrollments.length} enrollments:\n`);

    enrollments.forEach((enrollment: any, index: number) => {
      const student = enrollment.student;
      const offering = enrollment.offering;
      
      console.log(`${index + 1}. USN: ${student.usn}`);
      console.log(`   Name: ${student.user?.name || 'N/A'}`);
      console.log(`   Course: ${offering.course.code} - ${offering.course.name}`);
      console.log(`   Academic Year: ${offering.academic_years.year_name}`);
      console.log(`   Section: ${offering.sections?.section_name || 'N/A'}`);
      console.log(`   Semester: ${offering.semester}`);
      console.log(`   Enrolled At: ${new Date().toISOString()}`); // Since enrolledAt doesn't exist in schema
      console.log('   ---');
    });

    // Get enrollment count by course
    console.log('\n=== ENROLLMENT SUMMARY BY COURSE ===\n');
    
    const courseSummary = await prisma.studentEnrollment.groupBy({
      by: ['offeringId'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    for (const summary of courseSummary) {
      const offering = await prisma.courseOffering.findUnique({
        where: { id: summary.offeringId || '' },
        include: {
          course: true,
          academic_years: true
        }
      });

      if (offering) {
        console.log(`${offering.course.code} - ${offering.course.name}`);
        console.log(`  Academic Year: ${offering.academic_years?.year_name || 'N/A'}`);
        console.log(`  Total Students: ${summary._count.id}\n`);
      }
    }

  } catch (error) {
    console.error('Error checking enrollments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudentEnrollments();
