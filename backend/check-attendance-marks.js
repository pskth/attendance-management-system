const { PrismaClient } = require('./generated/prisma');

async function checkAttendanceAndMarks() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== Checking Attendance Records ===\n');
    
    const attendanceRecords = await prisma.attendanceRecord.count();
    const attendanceSessions = await prisma.attendance.count();
    const theoryMarks = await prisma.theoryMarks.count();
    const labMarks = await prisma.labMarks.count();
    
    console.log(`Attendance Records: ${attendanceRecords}`);
    console.log(`Attendance Sessions: ${attendanceSessions}`);
    console.log(`Theory Marks Records: ${theoryMarks}`);
    console.log(`Lab Marks Records: ${labMarks}`);
    
    // Sample attendance records
    console.log('\n=== Sample Attendance Records ===');
    const sampleAttendance = await prisma.attendanceRecord.findMany({
      take: 5,
      include: {
        student: {
          include: {
            user: true
          }
        },
        attendance: {
          include: {
            offering: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });
    
    sampleAttendance.forEach(record => {
      console.log(`Student: ${record.student?.user?.name || 'Unknown'} | Course: ${record.attendance?.offering?.course?.name || 'Unknown'} | Status: ${record.status}`);
    });
    
    // Sample theory marks
    console.log('\n=== Sample Theory Marks ===');
    const sampleMarks = await prisma.theoryMarks.findMany({
      take: 5,
      include: {
        enrollment: {
          include: {
            student: {
              include: {
                user: true
              }
            },
            offering: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });
    
    sampleMarks.forEach(mark => {
      const total = (mark.mse1Marks || 0) + (mark.mse2Marks || 0) + (mark.mse3Marks || 0) + 
                   (mark.task1Marks || 0) + (mark.task2Marks || 0) + (mark.task3Marks || 0);
      console.log(`Student: ${mark.enrollment?.student?.user?.name || 'Unknown'} | Course: ${mark.enrollment?.offering?.course?.name || 'Unknown'} | Total: ${total}`);
    });
    
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAttendanceAndMarks();
