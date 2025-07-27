const testFrontendAPI = async () => {
  try {
    // First, login to get a token
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (loginData.status === 'success') {
      const token = loginData.data.token;
      
      // Now try to fetch users with the token
      const usersResponse = await fetch('http://localhost:4000/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      const usersData = await usersResponse.json();
      console.log('Users response status:', usersResponse.status);
      console.log('Users response headers:', Object.fromEntries(usersResponse.headers.entries()));
      console.log('Users data (first 200 chars):', JSON.stringify(usersData).substring(0, 200));

      // Also test without auth token
      const noAuthResponse = await fetch('http://localhost:4000/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const noAuthData = await noAuthResponse.json();
      console.log('No auth response status:', noAuthResponse.status);
      console.log('No auth data (first 200 chars):', JSON.stringify(noAuthData).substring(0, 200));
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

testFrontendAPI();
