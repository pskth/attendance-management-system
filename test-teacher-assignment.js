// Simple test to verify teacher assignment data
const fetch = require('node-fetch');

async function testTeacherAssignment() {
  try {
    const response = await fetch('http://localhost:4000/api/admin/course-management');
    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('=== TEACHER ASSIGNMENT TEST ===');
      
      // Find courses with and without teachers
      const coursesWithTeachers = data.data.filter(course => course.teacherAssigned);
      const coursesWithoutTeachers = data.data.filter(course => !course.teacherAssigned);
      
      console.log(`Total courses: ${data.data.length}`);
      console.log(`Courses with teachers: ${coursesWithTeachers.length}`);
      console.log(`Courses without teachers: ${coursesWithoutTeachers.length}`);
      
      // Show first few courses with teachers
      console.log('\nCourses WITH teachers:');
      coursesWithTeachers.slice(0, 3).forEach(course => {
        console.log(`  ${course.code} - ${course.name}: Teacher = ${course.teacher ? course.teacher.name : 'NULL'}`);
      });
      
      // Show first few courses without teachers
      console.log('\nCourses WITHOUT teachers:');
      coursesWithoutTeachers.slice(0, 3).forEach(course => {
        console.log(`  ${course.code} - ${course.name}: Teacher = ${course.teacher ? course.teacher.name : 'NULL'}`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testTeacherAssignment();
