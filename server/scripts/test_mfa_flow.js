const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth';

const testMfaFlow = async () => {
    try {
        console.log('1. Testing Login (Step 1)...');
        // Use the admin credentials seeded earlier or known credentials
        const loginPayload = {
            username: 'admin',
            password: 'adminpassword123',
            role: 'registration_admin'
        };

        const loginRes = await axios.post(`${API_URL}/login`, loginPayload);

        console.log('Login Response Status:', loginRes.status);
        console.log('Login Response Data:', loginRes.data);

        if (loginRes.data.mfaRequired) {
            console.log('\nSUCCESS: MFA is required. Backend is working correctly.');
            console.log(`User ID: ${loginRes.data.userId}`);

            // We cannot automagically know the OTP unless we peek at the DB or Server Logs.
            // But getting here means the Frontend *should* have switched to the OTP screen.
            console.log('Check server logs for OTP to test Step 2 manually.');
        } else {
            console.log('\nFAILURE: MFA was NOT required (Token returned immediately?).');
        }

    } catch (error) {
        if (error.response) {
            console.error('\nAPI Error:', error.response.status, error.response.data);
        } else {
            console.error('\nNetwork/Script Error:', error.message);
        }
    }
};

testMfaFlow();
