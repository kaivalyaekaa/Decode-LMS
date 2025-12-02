const axios = require('axios');

async function testRoute() {
    try {
        console.log('Logging in as regadmin...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'regadmin',
            password: 'password123',
            role: 'registration_admin'
        });
        const token = loginRes.data.token;
        console.log('✅ Login successful');

        console.log('Testing GET /test...');
        const testRes = await axios.get('http://localhost:5000/api/registration-admin/test', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ GET /test response:', testRes.data);

    } catch (error) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
    }
}

testRoute();
