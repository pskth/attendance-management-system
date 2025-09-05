// Test script to verify analytics endpoints
const baseUrl = 'http://localhost:4000';

// Mock token - replace with a real admin token for testing
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczNzUzNDI4MSwiZXhwIjoxNzM3NjIwNjgxfQ.KxZGqYvHHfnGx3gNzEPDKtyXaV9qfk2qglDcwRVpJDo';

async function testAnalyticsEndpoints() {
  const headers = {
    'Authorization': `Bearer ${testToken}`,
    'Content-Type': 'application/json'
  };

  try {
    console.log('Testing Analytics Endpoints...\n');

    // Test overview endpoint
    console.log('1. Testing Overview Stats...');
    const overviewResponse = await fetch(`${baseUrl}/api/analytics/overview`, { headers });
    const overviewData = await overviewResponse.json();
    console.log('Overview Status:', overviewResponse.status);
    console.log('Overview Data:', JSON.stringify(overviewData, null, 2));
    console.log('\n---\n');

    // Test attendance analytics
    console.log('2. Testing Attendance Analytics...');
    const attendanceResponse = await fetch(`${baseUrl}/api/analytics/attendance`, { headers });
    const attendanceData = await attendanceResponse.json();
    console.log('Attendance Status:', attendanceResponse.status);
    console.log('Attendance Data Sample:', JSON.stringify(attendanceData, null, 2));
    console.log('\n---\n');

    // Test marks analytics
    console.log('3. Testing Marks Analytics...');
    const marksResponse = await fetch(`${baseUrl}/api/analytics/marks`, { headers });
    const marksData = await marksResponse.json();
    console.log('Marks Status:', marksResponse.status);
    console.log('Marks Data Sample:', JSON.stringify(marksData, null, 2));
    console.log('\n---\n');

    // Test academic years
    console.log('4. Testing Academic Years...');
    const yearsResponse = await fetch(`${baseUrl}/api/analytics/academic-years`, { headers });
    const yearsData = await yearsResponse.json();
    console.log('Years Status:', yearsResponse.status);
    console.log('Years Data:', JSON.stringify(yearsData, null, 2));

  } catch (error) {
    console.error('Error testing endpoints:', error);
  }
}

testAnalyticsEndpoints();
