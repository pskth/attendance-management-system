const { PrismaClient } = require('./generated/prisma');

async function testLowAttendance() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== Testing Low Attendance Calculation ===\n');
    
    const attendanceRecords = await prisma.attendanceRecord.findMany();
    const studentAttendanceMap = new Map();
    
    // Calculate attendance per student
    attendanceRecords.forEach(record => {
      if (record.studentId) {
        if (!studentAttendanceMap.has(record.studentId)) {
          studentAttendanceMap.set(record.studentId, { total: 0, present: 0 });
        }
        const studentData = studentAttendanceMap.get(record.studentId);
        studentData.total++;
        if (record.status === 'present') {
          studentData.present++;
        }
      }
    });

    // Count and show students with less than 75% attendance
    let lowAttendanceStudents = 0;
    console.log('Student Attendance Details:');
    studentAttendanceMap.forEach((data, studentId) => {
      const studentAttendance = (data.present / data.total) * 100;
      console.log(`Student ${studentId}: ${data.present}/${data.total} = ${studentAttendance.toFixed(1)}%`);
      if (studentAttendance < 75) {
        lowAttendanceStudents++;
        console.log(`  ⚠️  Low attendance (${studentAttendance.toFixed(1)}%)`);
      }
    });

    console.log(`\nTotal students with low attendance (<75%): ${lowAttendanceStudents}`);
    console.log(`Total unique students with records: ${studentAttendanceMap.size}`);
    
  } catch (error) {
    console.error('Error testing low attendance:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLowAttendance();
