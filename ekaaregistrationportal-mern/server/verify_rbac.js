const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';
const MONGO_URI = process.env.MONGO_URI;

// Test Users
const users = [
    { username: 'regadmin', password: 'password123', role: 'registration_admin' },
    { username: 'kaivalya', password: 'password123', role: 'instructor' },
    { username: 'finance_test', password: 'password123', role: 'finance' },
    { username: 'management_test', password: 'password123', role: 'management' }
];

async function setupTestUsers() {
    console.log('--- Setting up Test Users ---');
    await mongoose.connect(MONGO_URI);

    for (const u of users) {
        // Delete existing test user to ensure password is correct
        if (u.username.includes('_test')) {
            await User.findOneAndDelete({ username: u.username });
            console.log(`Deleted existing test user: ${u.username}`);
        }

        let user = await User.findOne({ username: u.username });
        if (!user) {
            console.log(`Creating user: ${u.username} (${u.role})`);
            const hashedPassword = await bcrypt.hash(u.password, 10);
            user = new User({
                username: u.username,
                password: hashedPassword,
                role: u.role,
                fullName: `Test ${u.role}`,
                email: `${u.role}@test.com`,
                isActive: true
            });
            await user.save();
        } else {
            console.log(`User exists: ${u.username}`);
            // Ensure role is correct
            if (user.role !== u.role) {
                user.role = u.role;
                await user.save();
                console.log(`Updated role for ${u.username} to ${u.role}`);
            }
        }
    }
    // Don't disconnect yet, we might need it? No, axios is HTTP.
    await mongoose.disconnect();
    console.log('--- User Setup Complete ---\n');
}

async function login(username, password, role) {
    try {
        const res = await axios.post(`${BASE_URL}/auth/login`, { username, password, role });
        return res.data.token;
    } catch (error) {
        console.error(`Login failed for ${username}:`, error.response?.data || error.message, error.code);
        return null;
    }
}

async function testEndpoint(token, method, url, description, expectedStatus) {
    try {
        await axios({
            method,
            url: `${BASE_URL}${url}`,
            headers: { Authorization: `Bearer ${token}` }
        });
        if (expectedStatus === 200) {
            console.log(`✅ PASS: ${description} (Got 200 OK)`);
            return true;
        } else {
            console.log(`❌ FAIL: ${description} (Expected ${expectedStatus}, Got 200 OK)`);
            return false;
        }
    } catch (error) {
        const status = error.response?.status;
        if (status === expectedStatus) {
            console.log(`✅ PASS: ${description} (Got ${status})`);
            return true;
        } else {
            console.log(`❌ FAIL: ${description} (Expected ${expectedStatus}, Got ${status || error.message})`);
            return false;
        }
    }
}

async function runTests() {
    await setupTestUsers();

    console.log('--- Starting RBAC Verification ---\n');

    // 1. Test Instructor
    console.log('Testing INSTRUCTOR Role (kaivalya)...');
    const instructorToken = await login('kaivalya', 'password123', 'instructor');
    if (instructorToken) {
        await testEndpoint(instructorToken, 'get', '/instructor/my-registrations', 'Access Own Routes', 200);
        await testEndpoint(instructorToken, 'get', '/finance/registrations/all', 'Access Finance Routes', 403);
        await testEndpoint(instructorToken, 'get', '/management/certificates', 'Access Management Routes', 403);
        await testEndpoint(instructorToken, 'get', '/registration-admin/users', 'Access Admin Routes', 403);
    }

    console.log('\n--------------------------------------------------\n');

    // 2. Test Finance
    console.log('Testing FINANCE Role (finance_test)...');
    const financeToken = await login('finance_test', 'password123', 'finance');
    if (financeToken) {
        await testEndpoint(financeToken, 'get', '/finance/registrations/all', 'Access Own Routes', 200);
        await testEndpoint(financeToken, 'get', '/instructor/my-registrations', 'Access Instructor Routes', 403);
        await testEndpoint(financeToken, 'get', '/management/certificates', 'Access Management Routes', 403);
    }

    console.log('\n--------------------------------------------------\n');

    // 3. Test Management
    console.log('Testing MANAGEMENT Role (management_test)...');
    const managementToken = await login('management_test', 'password123', 'management');
    if (managementToken) {
        await testEndpoint(managementToken, 'get', '/management/certificates', 'Access Own Routes', 200);
        await testEndpoint(managementToken, 'get', '/finance/registrations/all', 'Access Finance Routes', 403);
        await testEndpoint(managementToken, 'get', '/instructor/my-registrations', 'Access Instructor Routes', 403);
    }

    console.log('\n--- RBAC Verification Complete ---');
}

runTests().catch(console.error);
