const axios = require('axios');

async function createTestUser() {
    try {
        // 1. Login
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'regadmin',
            password: 'password123',
            role: 'registration_admin'
        });
        const token = loginRes.data.token;

        // 2. Create User
        console.log('Creating test user...');
        const createRes = await axios.post('http://localhost:5000/api/registration-admin/users', {
            username: 'testuser_delete',
            fullName: 'Test User For Delete',
            email: 'test_delete@example.com',
            password: 'password123',
            role: 'instructor'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('✅ User created:', createRes.data.user.username);

    } catch (error) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
    }
}

createTestUser();
