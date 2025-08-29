// Test login and get token
const baseUrl = 'http://localhost:4000';

async function testLogin() {
  try {
    console.log('Testing login...');
    
    // Try to login with common admin credentials
    const loginAttempts = [
      { username: 'admin', password: 'admin' },
      { username: 'admin', password: 'password' },
      { username: 'admin', password: '123456' },
      { username: 'admin', password: 'admin123' }
    ];

    for (const creds of loginAttempts) {
      console.log(`Trying login with username: ${creds.username}, password: ${creds.password}`);
      
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(creds)
      });

      const result = await response.json();
      console.log(`Response status: ${response.status}`);
      console.log('Response:', JSON.stringify(result, null, 2));

      if (response.ok && result.token) {
        console.log('\n✅ LOGIN SUCCESSFUL!');
        console.log('Token:', result.token);
        console.log('User:', result.user);
        console.log('\nYou can now use this token to access analytics APIs.');
        return result.token;
      }
      console.log('---');
    }

    console.log('\n❌ All login attempts failed. Checking available users...');
    
    // Try to get users list to see what's available
    const usersResponse = await fetch(`${baseUrl}/api/users`);
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log('Available users:', JSON.stringify(users, null, 2));
    }

  } catch (error) {
    console.error('Error testing login:', error);
  }
}

testLogin();
