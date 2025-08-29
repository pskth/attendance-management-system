const { PrismaClient } = require('./generated/prisma');

async function testRealAnalytics() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== Testing Real Analytics Calculations ===\n');
    
    // Test attendance calculation
    console.log('1. Testing Attendance Calculation:');
    const attendanceRecords = await prisma.attendanceRecord.findMany();
    const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
    const totalRecords = attendanceRecords.length;
    const averageAttendance = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;
    
    console.log(`   Total Records: ${totalRecords}`);
    console.log(`   Present: ${presentCount}`);
    console.log(`   Average Attendance: ${averageAttendance.toFixed(1)}%`);
    
    // Test marks calculation
    console.log('\n2. Testing Marks Calculation:');
    const theoryMarks = await prisma.theoryMarks.findMany();
    const labMarks = await prisma.labMarks.findMany();
    
    let totalScore = 0;
    let markCount = 0;
    let passedStudents = 0;

    theoryMarks.forEach(marks => {
      const totalMarks = (marks.mse1Marks || 0) + (marks.mse2Marks || 0) + (marks.mse3Marks || 0) + 
                        (marks.task1Marks || 0) + (marks.task2Marks || 0) + (marks.task3Marks || 0);
      totalScore += totalMarks;
      markCount++;
      if (totalMarks >= 60) passedStudents++;
    });

    labMarks.forEach(marks => {
      const totalMarks = (marks.recordMarks || 0) + (marks.continuousEvaluationMarks || 0) + (marks.labMseMarks || 0);
      totalScore += totalMarks;
      markCount++;
      if (totalMarks >= 60) passedStudents++;
    });

    const averageMarks = markCount > 0 ? (totalScore / markCount) : 0;
    const passRate = markCount > 0 ? (passedStudents / markCount) * 100 : 0;
    
    console.log(`   Theory Records: ${theoryMarks.length}`);
    console.log(`   Lab Records: ${labMarks.length}`);
    console.log(`   Total Mark Count: ${markCount}`);
    console.log(`   Passed Students: ${passedStudents}`);
    console.log(`   Average Marks: ${averageMarks.toFixed(1)}`);
    console.log(`   Pass Rate: ${passRate.toFixed(1)}%`);
    
    // Test course-specific attendance
    console.log('\n3. Testing Course-Specific Data:');
    const offering = await prisma.courseOffering.findFirst({
      include: {
        course: true
      }
    });
    
    if (offering) {
      const courseAttendanceRecords = await prisma.attendanceRecord.findMany({
        where: {
          attendance: {
            offeringId: offering.id
          }
        }
      });
      
      const coursePresentCount = courseAttendanceRecords.filter(record => record.status === 'present').length;
      const courseTotalRecords = courseAttendanceRecords.length;
      const courseAttendance = courseTotalRecords > 0 ? (coursePresentCount / courseTotalRecords) * 100 : 0;
      
      console.log(`   Course: ${offering.course.name}`);
      console.log(`   Course Records: ${courseTotalRecords}`);
      console.log(`   Course Present: ${coursePresentCount}`);
      console.log(`   Course Attendance: ${courseAttendance.toFixed(1)}%`);
    }
    
  } catch (error) {
    console.error('Error testing analytics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRealAnalytics();
