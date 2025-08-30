const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testAttendanceUpdate() {
    try {
        console.log('Testing attendance update functionality...\n');

        // First, let's login as a teacher to get the token
        console.log('1. Logging in as teacher...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            username: 'teacher1',
            password: 'password123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Teacher login successful');

        // Get the teacher's students
        console.log('\n2. Getting teacher\'s students...');
        const studentsResponse = await axios.get(`${BASE_URL}/api/teacher/attendance/students`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`✅ Found ${studentsResponse.data.students.length} students`);
        
        // Find specific students that were having issues
        const students = studentsResponse.data.students;
        const testStudents = students.filter(s => 
            s.user.name.includes('Suresh') || 
            s.user.name.includes('Myra') ||
            s.user.name.includes('Joshi') ||
            s.user.name.includes('Das')
        );

        if (testStudents.length === 0) {
            console.log('⚠️ Test students (Suresh Joshi, Myra Das) not found, using first available student');
            testStudents.push(students[0]);
        }

        console.log(`\n3. Testing attendance updates for ${testStudents.length} students...`);

        for (const student of testStudents.slice(0, 2)) { // Test with first 2 students
            console.log(`\nTesting student: ${student.user.name} (ID: ${student.id})`);
            
            // Test different attendance statuses
            const statuses = ['present', 'absent', 'unmarked'];
            
            for (const status of statuses) {
                try {
                    console.log(`  Setting status to: ${status}`);
                    
                    const updateResponse = await axios.put(`${BASE_URL}/api/teacher/attendance/student`, {
                        studentId: student.id,
                        status: status,
                        date: '2025-08-30'
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    console.log(`  ✅ ${status}: ${updateResponse.data.message}`);
                    console.log(`     Response status: ${updateResponse.data.data.status}`);
                    console.log(`     Record ID: ${updateResponse.data.data.recordId || 'null (deleted)'}`);
                    
                } catch (error) {
                    console.log(`  ❌ ${status}: ${error.response?.data?.message || error.message}`);
                }
            }
        }

        console.log('\n✅ Attendance update test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testAttendanceUpdate();
