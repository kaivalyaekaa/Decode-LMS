const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
    try {
        // 1. Login to get token
        console.log('Logging in as regadmin...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'regadmin',
            password: 'password123',
            role: 'registration_admin'
        });
        const token = loginRes.data.token;
        console.log('✅ Login successful');

        // 2. Test GET route
        console.log('Testing GET /registrations...');
        try {
            const getRes = await axios.get('http://localhost:5000/api/registration-admin/registrations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ GET /registrations successful. Count:', getRes.data.registrations.length);
        } catch (err) {
            console.error('❌ GET /registrations failed:', err.message);
        }

        // 3. Prepare form data
        const form = new FormData();
        form.append('file', fs.createReadStream(path.join(__dirname, 'test_registrations.xlsx')));

        // 4. Upload file
        console.log('Uploading Excel file...');
        const uploadRes = await axios.post('http://localhost:5000/api/registration-admin/upload-excel', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Upload response:', uploadRes.data);

    } catch (error) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
    }
}

testUpload();
