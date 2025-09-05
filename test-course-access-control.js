// Test script for course access control functionality
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4000';

async function testCourseAccessControl() {
  try {
    console.log('=== Testing Course Access Control ===\n');

    // First, login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    if (loginData.status !== 'success') {
      throw new Error('Login failed: ' + JSON.stringify(loginData));
    }

    const authToken = loginData.data.token;
    console.log('✓ Login successful\n');

    // Test assigned courses endpoint
    console.log('2. Testing assigned courses endpoint...');
    const assignedCoursesResponse = await fetch(`${API_BASE}/api/admin/assigned-courses`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const assignedCoursesData = await assignedCoursesResponse.json();
    console.log('Assigned courses response:', JSON.stringify(assignedCoursesData, null, 2));

    if (assignedCoursesData.status === 'success') {
      console.log(`✓ Found ${assignedCoursesData.data.length} assigned courses`);
      
      if (assignedCoursesData.data.length > 0) {
        console.log('First course:', assignedCoursesData.data[0]);
      }
    } else {
      console.log('✗ Failed to get assigned courses');
    }
    console.log('');

    // Test attendance endpoint with course filtering
    console.log('3. Testing attendance endpoint with course filtering...');
    const today = new Date().toISOString().split('T')[0];
    
    const attendanceResponse = await fetch(`${API_BASE}/api/admin/attendance?date=${today}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const attendanceData = await attendanceResponse.json();
    console.log('Attendance response status:', attendanceData.status);
    
    if (attendanceData.status === 'success') {
      console.log(`✓ Found ${attendanceData.data.length} attendance records`);
      
      if (attendanceData.data.length > 0) {
        console.log('First attendance record:', attendanceData.data[0]);
      }
    } else {
      console.log('✗ Failed to get attendance data');
    }
    console.log('');

    // Test with specific course if available
    if (assignedCoursesData.status === 'success' && assignedCoursesData.data.length > 0) {
      const firstCourseId = assignedCoursesData.data[0].id;
      console.log(`4. Testing attendance endpoint with specific course (${firstCourseId})...`);
      
      const specificCourseResponse = await fetch(`${API_BASE}/api/admin/attendance?date=${today}&courseId=${firstCourseId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const specificCourseData = await specificCourseResponse.json();
      console.log('Specific course attendance response status:', specificCourseData.status);
      
      if (specificCourseData.status === 'success') {
        console.log(`✓ Found ${specificCourseData.data.length} attendance records for specific course`);
      } else {
        console.log('✗ Failed to get attendance data for specific course');
      }
    }

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testCourseAccessControl();
