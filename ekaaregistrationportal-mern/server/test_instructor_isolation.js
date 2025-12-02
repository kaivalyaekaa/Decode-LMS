const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
const Registration = require('./models/Registration');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function testInstructorDataIsolation() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    try {
        console.log('=== Testing Instructor Data Isolation ===\n');

        // Get two instructors
        const instructor1 = await User.findOne({ username: 'kaivalya' });
        const instructor2 = await User.findOne({ username: 'testinstructor' });

        if (!instructor1 || !instructor2) {
            console.log('❌ Need 2 instructors for this test');
            return;
        }

        console.log(`Instructor 1: ${instructor1.fullName} (${instructor1._id})`);
        console.log(`Instructor 2: ${instructor2.fullName} (${instructor2._id})`);

        // Check Assignment of registrations
        const reg1 = await Registration.find({ assignedInstructorId: instructor1._id });
        const reg2 = await Registration.find({ assignedInstructorId: instructor2._id });

        console.log(`\nInstructor 1 has ${reg1.length} assigned students`);
        console.log(`Instructor 2 has ${reg2.length} assigned students`);

        // Login as instructor 1 and fetch students
        console.log('\n--- Testing Instructor 1 API Access ---');
        const login1 = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'kaivalya',
            password: 'password123',
            role: 'instructor'
        });
        const token1 = login1.data.token;

        const students1 = await axios.get(`${BASE_URL}/instructor/registrations`, {
            headers: { Authorization: `Bearer ${token1}` }
        });
        console.log(`✅ Instructor 1 API returned ${students1.data.registrations.length} students`);

        // Login as instructor 2 and fetch students
        console.log('\n--- Testing Instructor 2 API Access ---');
        const login2 = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'testinstructor',
            password: 'password123',
            role: 'instructor'
        });
        const token2 = login2.data.token;

        const students2 = await axios.get(`${BASE_URL}/instructor/registrations`, {
            headers: { Authorization: `Bearer ${token2}` }
        });
        console.log(`✅ Instructor 2 API returned ${students2.data.registrations.length} students`);

        // Check for data leaks
        console.log('\n--- Checking Data Isolation ---');
        if (students1.data.registrations.length === reg1.length) {
            console.log(`✅ Instructor 1 sees correct number of students (${reg1.length})`);
        } else {
            console.log(`❌ Instructor 1 data mismatch: API=${students1.data.registrations.length}, DB=${reg1.length}`);
        }

        if (students2.data.registrations.length === reg2.length) {
            console.log(`✅ Instructor 2 sees correct number of students (${reg2.length})`);
        } else {
            console.log(`❌ Instructor 2 data mismatch: API=${students2.data.registrations.length}, DB=${reg2.length}`);
        }

        // Check for cross-contamination
        const student1Ids = students1.data.registrations.map(r => r._id);
        const student2Ids = students2.data.registrations.map(r => r._id);
        const overlap = student1Ids.filter(id => student2Ids.includes(id));

        if (overlap.length === 0) {
            console.log(`✅ No data leak - instructors see different students`);
        } else {
            console.log(`❌ DATA LEAK DETECTED - ${overlap.length} students visible to both instructors!`);
        }

    } catch (error) {
        console.error('ERROR:', error.response?.data || error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n=== COMPLETE ===');
    }
}

testInstructorDataIsolation();
