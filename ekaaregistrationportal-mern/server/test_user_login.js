const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function testUserLogin() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    try {
        console.log('=== Testing User Creation & Login ===\n');

        // Test existing users first
        const testUsers = [
            { username: 'regadmin', password: 'password123', role: 'registration_admin' },
            { username: 'kaivalya', password: 'password123', role: 'instructor' },
            { username: 'finance_test', password: 'password123', role: 'finance' },
            { username: 'management_test', password: 'password123', role: 'management' }
        ];

        for (const testUser of testUsers) {
            try {
                const response = await axios.post(`${BASE_URL}/auth/login`, testUser);
                console.log(`✅ ${testUser.role} login SUCCESS: ${testUser.username}`);
            } catch (error) {
                console.log(`❌ ${testUser.role} login FAILED: ${testUser.username}`);
                console.log(`   Error: ${error.response?.data?.message || error.message}`);
            }
        }

        // Create a new test user
        console.log('\n--- Creating New User ---');
        const newUsername = `test_new_${Date.now()}`;
        const hashedPassword = await bcrypt.hash('password123', 10);

        const newUser = new User({
            username: newUsername,
            fullName: 'Test New User',
            email: `${newUsername}@test.com`,
            password: hashedPassword,
            role: 'instructor'
        });
        await newUser.save();
        console.log(`✅ Created user: ${newUsername}`);

        // Try to login with newly created user
        console.log('\n--- Testing Newly Created User Login ---');
        try {
            const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
                username: newUsername,
                password: 'password123',
                role: 'instructor'
            });
            console.log(`✅ NEW USER LOGIN SUCCESS: ${newUsername}`);
            console.log(`   Token received: ${loginResponse.data.token ? 'Yes' : 'No'}`);
        } catch (error) {
            console.log(`❌ NEW USER LOGIN FAILED: ${newUsername}`);
            console.log(`   Error: ${error.response?.data?.message || error.message}`);
            console.log(`   Status: ${error.response?.status}`);
        }

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n=== COMPLETE ===');
    }
}

testUserLogin();
