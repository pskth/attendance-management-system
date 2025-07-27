// Test script to simulate frontend API requests
// Using built-in fetch (Node.js 18+)

// Simulate the frontend's API request
async function testFrontendAPI() {
  console.log('Testing frontend API flow...\n');

  // Step 1: Login to get token
  console.log('1. Logging in...');
  const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });

  const loginData = await loginResponse.json();
  console.log('Login response:', loginData);

  if (loginData.status !== 'success') {
    console.error('Login failed!');
    return;
  }

  const token = loginData.data.token;
  console.log('Got token:', token.substring(0, 20) + '...\n');

  // Step 2: Test users API with token
  console.log('2. Testing /api/users with authentication...');
  const usersResponse = await fetch('http://localhost:4000/api/users', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  });

  console.log('Response status:', usersResponse.status);
  console.log('Response headers:', {
    'content-type': usersResponse.headers.get('content-type'),
    'x-powered-by': usersResponse.headers.get('x-powered-by'),
  });

  const responseText = await usersResponse.text();
  console.log('Response type:', typeof responseText);
  console.log('Response length:', responseText.length);
  console.log('First 200 chars:', responseText.substring(0, 200));

  // Try to parse as JSON
  try {
    const jsonData = JSON.parse(responseText);
    console.log('\n✅ Successfully parsed as JSON!');
    console.log('Data status:', jsonData.status);
    console.log('Data count:', jsonData.count);
    console.log('First user:', jsonData.data[0]?.name);
  } catch (error) {
    console.log('\n❌ Failed to parse as JSON:', error.message);
  }
}

testFrontendAPI().catch(console.error);
