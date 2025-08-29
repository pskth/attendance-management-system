// Test login functionality
const baseUrl = 'http://localhost:4000';

async function testLoginFlow() {
  console.log('🔍 Testing login flow...\n');
  
  try {
    // Test 1: Check if backend is responding
    console.log('1. Testing backend health...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('Health status:', healthData);
    console.log('✅ Backend is responding\n');
    
    // Test 2: Try login with common credentials
    console.log('2. Testing login with admin credentials...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response status:', loginResponse.status);
    console.log('Login response:', JSON.stringify(loginData, null, 2));
    
    if (loginResponse.ok && loginData.data && loginData.data.token) {
      console.log('✅ Login successful!');
      console.log('Token received:', loginData.data.token.substring(0, 20) + '...');
      console.log('User:', loginData.data.user);
      
      // Test 3: Try accessing analytics with token
      console.log('\n3. Testing analytics access with token...');
      const analyticsResponse = await fetch(`${baseUrl}/api/analytics/overview`, {
        headers: {
          'Authorization': `Bearer ${loginData.data.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const analyticsData = await analyticsResponse.json();
      console.log('Analytics response status:', analyticsResponse.status);
      console.log('Analytics response:', JSON.stringify(analyticsData, null, 2));
      
      if (analyticsResponse.ok) {
        console.log('✅ Analytics API access successful!');
      } else {
        console.log('❌ Analytics API access failed');
      }
      
    } else {
      console.log('❌ Login failed');
      console.log('Trying to check available users...');
      
      // Check what users exist
      const usersResponse = await fetch(`${baseUrl}/api/db/summary`);
      if (usersResponse.ok) {
        const summary = await usersResponse.json();
        console.log('Database summary:', JSON.stringify(summary, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

testLoginFlow();
