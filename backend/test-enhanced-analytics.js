const { PrismaClient } = require('./generated/prisma');

async function testEnhancedAnalytics() {
  const prisma = new PrismaClient();
  
  try {
    console.log('\n=== TESTING ENHANCED ANALYTICS WITH STUDENT DETAILS ===\n');
    
    // Test one course offering to see the enhanced student data
    const offering = await prisma.courseOffering.findFirst({
      where: {
        enrollments: {
          some: {}
        }
      },
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
    });

    if (!offering) {
      console.log('No course offerings with enrollments found');
      return;
    }

    console.log(`Testing Course: ${offering.course.name} (${offering.course.code})`);
    console.log(`Enrollments: ${offering.enrollments.length}`);
    console.log('');

    for (const enrollment of offering.enrollments.slice(0, 3)) { // Test first 3 students
      if (!enrollment.student) continue;

      console.log(`Student: ${enrollment.student.user?.name} (${enrollment.student.usn})`);
      
      // Get attendance records for this student in this course
      const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: {
          studentId: enrollment.student.id,
          attendance: {
            offeringId: offering.id
          }
        }
      });
      
      const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
      const totalCount = attendanceRecords.length;
      const attendancePercent = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;
      
      console.log(`  Attendance: ${presentCount}/${totalCount} = ${attendancePercent.toFixed(1)}%`);
      
      // Get marks for this student in this course
      const theoryMark = await prisma.theoryMarks.findFirst({
        where: {
          enrollmentId: enrollment.id
        }
      });
      
      const labMark = await prisma.labMarks.findFirst({
        where: {
          enrollmentId: enrollment.id
        }
      });
      
      let theoryTotal = 0;
      if (theoryMark) {
        theoryTotal = (theoryMark.mse1Marks || 0) + (theoryMark.mse2Marks || 0) + (theoryMark.mse3Marks || 0) + 
                     (theoryMark.task1Marks || 0) + (theoryMark.task2Marks || 0) + (theoryMark.task3Marks || 0);
      }
      
      let labTotal = 0;
      if (labMark) {
        labTotal = (labMark.recordMarks || 0) + (labMark.continuousEvaluationMarks || 0) + (labMark.labMseMarks || 0);
      }
      
      const totalMarks = theoryTotal + labTotal;
      
      console.log(`  Theory Marks: ${theoryTotal}`);
      console.log(`  Lab Marks: ${labTotal}`);
      console.log(`  Total Marks: ${totalMarks}`);
      console.log('');
    }
    
    console.log('✅ Enhanced analytics will now show:');
    console.log('  • Individual student attendance percentages in Attendance tab');
    console.log('  • Individual student marks (theory, lab, total) in Marks tab');
    console.log('  • Color-coded indicators based on performance thresholds');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEnhancedAnalytics();
