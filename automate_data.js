const axios = require('axios');
const mongoose = require('./server/node_modules/mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from server directory
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const API_URL = 'http://localhost:5000/api';
const ADMIN_CREDENTIALS = { username: 'regadmin', password: 'password123', role: 'registration_admin' };

// Import Models
const User = require('./server/models/User');
const Registration = require('./server/models/Registration');
const Batch = require('./server/models/Batch');

const INSTRUCTORS = [
    { username: 'sonia', fullName: 'Sonia Instructor', email: 'sonia@decode.com', password: 'password123', role: 'instructor' },
    { username: 'jacky', fullName: 'Jacky Instructor', email: 'jacky@decode.com', password: 'password123', role: 'instructor' },
    { username: 'krish', fullName: 'Krish Instructor', email: 'krish@decode.com', password: 'password123', role: 'instructor' }
];

const STUDENTS = [
    { fullName: 'Roopa Student', email: 'roopa@test.com', phone: '9876543210', cityCountry: 'Mumbai, India', programLevel: 'Level 1 – Decode Your Mind', mode: 'Online', region: 'IN' },
    { fullName: 'Divya Student', email: 'divya@test.com', phone: '9876543211', cityCountry: 'Delhi, India', programLevel: 'Level 1 – Decode Your Mind', mode: 'Online', region: 'IN' },
    { fullName: 'Karthik Student', email: 'karthik@test.com', phone: '9876543212', cityCountry: 'Bangalore, India', programLevel: 'Level 1 – Decode Your Mind', mode: 'Online', region: 'IN' }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    try {
        console.log('🚀 Starting Data Automation...');

        // 1. Login as Registration Admin (API)
        console.log('🔑 Logging in as Registration Admin...');
        let token;
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, ADMIN_CREDENTIALS);
            token = loginRes.data.token;
            console.log('✅ Logged in successfully.');
        } catch (e) {
            console.log('⚠️ Login failed (maybe user exists but credentials wrong?):', e.message);
            // Continue, maybe we don't need API if we use DB directly for everything?
            // But user asked to use API where possible.
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 2. Create Instructors (API)
        console.log('\n👨‍🏫 Creating Instructors...');
        for (const instructor of INSTRUCTORS) {
            try {
                await axios.post(`${API_URL}/registration-admin/users`, instructor, config);
                console.log(`   ✅ Created instructor: ${instructor.fullName}`);
            } catch (error) {
                if (error.response && error.response.data.message.includes('already exists')) {
                    console.log(`   ⚠️ Instructor ${instructor.fullName} already exists.`);
                } else {
                    console.log(`   ❌ Failed to create ${instructor.fullName}:`, error.message);
                }
            }
        }

        // 3. Register Students (API)
        console.log('\n🎓 Registering Students...');
        for (const student of STUDENTS) {
            try {
                await axios.post(`${API_URL}/registration`, student);
                console.log(`   ✅ Registered student: ${student.fullName}`);
            } catch (error) {
                console.log(`   ⚠️ Could not register ${student.fullName}:`, error.message);
            }
        }

        // 4. DB Operations: Create Batches and Assign
        console.log('\n🗄️ Connecting to Database for Batch Setup...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const assignments = [
            { studentEmail: 'roopa@test.com', instructorName: 'Sonia Instructor', batchCode: 'BATCH-SONIA-01' },
            { studentEmail: 'divya@test.com', instructorName: 'Jacky Instructor', batchCode: 'BATCH-JACKY-01' },
            { studentEmail: 'karthik@test.com', instructorName: 'Krish Instructor', batchCode: 'BATCH-KRISH-01' }
        ];

        for (const assignment of assignments) {
            // Find Instructor
            const instructor = await User.findOne({ email: INSTRUCTORS.find(i => i.fullName === assignment.instructorName).email });
            if (!instructor) {
                console.log(`❌ Instructor not found in DB: ${assignment.instructorName}`);
                continue;
            }

            // Find/Create Batch
            let batch = await Batch.findOne({ batchCode: assignment.batchCode });
            if (!batch) {
                batch = await Batch.create({
                    batchCode: assignment.batchCode,
                    programLevel: 'Level 1 – Decode Your Mind',
                    instructorId: instructor._id,
                    startDate: new Date(),
                    mode: 'Online',
                    status: 'Active',
                    totalSessions: 10,
                    createdBy: instructor._id // Just assigning creator as instructor for now
                });
                console.log(`   ✅ Created Batch: ${batch.batchCode}`);
            } else {
                console.log(`   ℹ️ Batch exists: ${batch.batchCode}`);
            }

            // Find Student Registration
            const registration = await Registration.findOne({ email: assignment.studentEmail });
            if (!registration) {
                console.log(`❌ Registration not found in DB: ${assignment.studentEmail}`);
                continue;
            }

            // Update Registration
            registration.assignedInstructorId = instructor._id;
            registration.batchId = batch._id;
            await registration.save();
            console.log(`   ✅ Assigned ${registration.fullName} to ${instructor.fullName} (Batch: ${batch.batchCode})`);
        }

        console.log('\n✨ Automation Complete!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Automation Failed:', error);
        process.exit(1);
    }
}

main();
