const fetch = require('node-fetch');

async function testAdminLogin() {
    try {
        console.log('Testing admin login...\n');
        
        // Try admin1 login
        const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'admin1',
                password: 'admin123'  // Common admin password
            }),
        });

        const loginData = await loginResponse.json();
        console.log('Admin Login Response:', loginResponse.status, loginData);

        if (loginResponse.ok && loginData.token) {
            console.log('\n✅ Admin login successful!');
            console.log('Token:', loginData.token.substring(0, 20) + '...');
            
            // Test analytics with admin token
            const analyticsResponse = await fetch('http://localhost:4000/api/analytics/overview', {
                headers: {
                    'Authorization': `Bearer ${loginData.token}`,
                    'Content-Type': 'application/json',
                },
            });

            const analyticsData = await analyticsResponse.json();
            console.log('\nAnalytics Response:', analyticsResponse.status, analyticsData);

            if (analyticsResponse.ok) {
                console.log('\n✅ Analytics access successful with admin token!');
            }
        } else {
            console.log('\n❌ Admin login failed');
            
            // Try with different password
            console.log('\nTrying with password "password"...');
            const loginResponse2 = await fetch('http://localhost:4000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: 'admin1',
                    password: 'password'
                }),
            });

            const loginData2 = await loginResponse2.json();
            console.log('Admin Login Response 2:', loginResponse2.status, loginData2);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAdminLogin();
