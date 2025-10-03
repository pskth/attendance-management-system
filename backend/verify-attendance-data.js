const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function verify() {
  try {
    console.log('\nÌ≥ä VERIFYING ATTENDANCE DATA FOR CS TEACHER 1\n');
    console.log('='.repeat(80) + '\n');

    // Get CS Teacher 1's course offering (CS301 Section A)
    const offering = await prisma.courseOffering.findFirst({
      where: {
        teacher: {
          user: { name: 'CS Teacher 1' },
          department: {
            code: 'CS',
            colleges: { code: 'NMAMIT' }
          }
        },
        course: { code: 'CS301' },
        sections: { section_name: 'A' }
      },
      include: {
        course: true,
        sections: true,
        teacher: {
          include: { user: true }
        },
        enrollments: {
          include: {
            student: {
              include: {
                user: true,
                attendanceRecords: {
                  include: {
                    attendance: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!offering) {
      console.log('‚ùå No course offering found for CS Teacher 1');
      return;
    }

    console.log(`Course: ${offering.course.code} - ${offering.course.name}`);
    console.log(`Section: ${offering.sections.section_name}`);
    console.log(`Teacher: ${offering.teacher.user.name}`);
    console.log(`Total Students Enrolled: ${offering.enrollments.length}\n`);

    // Check attendance sessions
    const attendanceSessions = await prisma.attendance.findMany({
      where: { offeringId: offering.id },
      include: {
        attendanceRecords: true
      }
    });

    console.log('='.repeat(80));
    console.log(`\nÌ≥Ö Attendance Sessions: ${attendanceSessions.length}\n`);

    if (attendanceSessions.length === 0) {
      console.log('‚ö†Ô∏è  NO ATTENDANCE SESSIONS FOUND!');
      console.log('\nThis is why the analytics shows:');
      console.log('- 0% attendance for all students');
      console.log('- 0 total classes\n');
      console.log('To fix: Teacher needs to mark attendance at least once\n');
    } else {
      attendanceSessions.forEach((session, i) => {
        console.log(`${i + 1}. Date: ${session.date.toISOString().split('T')[0]}`);
        console.log(`   Topic: ${session.topic || 'N/A'}`);
        console.log(`   Records: ${session.attendanceRecords.length}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('\nÌ±• STUDENT ATTENDANCE SUMMARY:\n');

    offering.enrollments.forEach((enrollment, i) => {
      const student = enrollment.student;
      const records = student.attendanceRecords.filter(r => 
        r.attendance?.offeringId === offering.id
      );
      
      const totalClasses = records.length;
      const presentCount = records.filter(r => r.status === 'present').length;
      const percentage = totalClasses > 0 ? (presentCount / totalClasses * 100).toFixed(1) : '0.0';

      console.log(`${i + 1}. ${student.usn} - ${student.user.name}`);
      console.log(`   Attendance: ${presentCount}/${totalClasses} (${percentage}%)\n`);
    });

    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('‚ùå Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
