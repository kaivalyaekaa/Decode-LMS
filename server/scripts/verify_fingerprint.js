const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const TEST_EMAIL = `test_fp_${Date.now()}@example.com`;
const TEST_USERNAME = `fp_user_${Date.now()}`;
const TEST_PASSWORD = 'password123';

const runTest = async () => {
    try {
        console.log('1. Creating User (Registration Admin)...');
        await mongoose.connect(process.env.MONGO_URI);
        const User = require('../models/User'); // Mongoose model
        const bcrypt = require('bcryptjs');

        const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
        const user = new User({
            username: TEST_USERNAME,
            password: hashedPassword,
            role: 'registration_admin',
            fullName: 'Fingerprint Test User',
            email: TEST_EMAIL
        });
        await user.save();
        console.log('User created:', user._id);

        console.log('2. Attempting Login (Step 1: Get OTP)...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            username: TEST_USERNAME,
            password: TEST_PASSWORD,
            role: 'registration_admin'
        });

        if (!loginRes.data.devOtp) {
            console.error('Login Failed or devOtp missing');
            process.exit(1);
        }
        const otp = loginRes.data.devOtp;
        console.log(`OTP Received: ${otp}`);

        console.log('3. Verifying OTP (Step 2: Authenticate & Capture IP)...');
        const verifyRes = await axios.post(
            'http://localhost:5000/api/auth/verify-otp',
            {
                userId: user._id,
                otp: otp
            },
            {
                headers: { 'User-Agent': 'TestScript/1.0 (Node.js)' }
            }
        );

        if (verifyRes.data.success) {
            console.log('Login Successful.');
        } else {
            console.error('OTP Verification Failed:', verifyRes.data);
            process.exit(1);
        }

        console.log('4. Checking DB for Fingerprint...');
        const updatedUser = await User.findById(user._id);

        if (updatedUser.loginHistory && updatedUser.loginHistory.length > 0) {
            const history = updatedUser.loginHistory[0];
            console.log('Login History Found:', history);

            if (history.userAgent && history.userAgent.includes('TestScript')) {
                console.log('SUCCESS: User-Agent captured correctly.');
            } else {
                console.error('FAILURE: User-Agent mismatch or missing.');
            }

            if (history.ip) {
                console.log('SUCCESS: IP Address captured.');
            } else {
                console.error('FAILURE: IP Address missing.');
            }

        } else {
            console.error('FAILURE: loginHistory is empty!');
        }

        // Cleanup
        await User.deleteOne({ _id: user._id });
        console.log('Cleanup complete.');
        process.exit(0);

    } catch (error) {
        console.error('Test Failed:', error.message);
        if (error.response) console.error('Response:', error.response.data);
        process.exit(1);
    }
};

runTest();
