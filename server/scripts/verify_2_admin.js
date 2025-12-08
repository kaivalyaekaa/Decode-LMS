const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Registration = require('../models/Registration');

dotenv.config({ path: path.join(__dirname, '../.env') });

const mockReqRes = (body = {}, user = {}) => {
    const req = { body, user };
    const res = {
        statusCode: 200,
        data: null,
        status: function (code) { this.statusCode = code; return this; },
        json: function (data) { this.data = data; return this; },
        send: function (data) { this.data = data; return this; }
    };
    return { req, res };
};

// Setup Helper: Create a fresh registration
async function createTestRegistration() {
    const email = `verify_2_${Date.now()}@example.com`;
    const reg = new Registration({
        fullName: 'Verify Two',
        email: email,
        phone: '1231231234',
        cityCountry: 'Admin City',
        programLevel: 'Level 1 – Decode Your Mind',
        mode: 'Online Training',
        region: 'INDIA'
    });
    await reg.save();
    return reg;
}

async function verifyAdmin() {
    console.log('🧪 Starting Verification 2: Admin Instructor Assignment');

    try {
        await mongoose.connect(process.env.MONGO_URI);

        // 1. SETUP
        const student = await createTestRegistration();
        console.log(`Setup: Created Student ${student._id}`);

        const instructor = await User.findOne({ role: 'instructor' });
        if (!instructor) throw new Error("No instructor found to assign.");
        console.log(`Setup: Found Instructor ${instructor.fullName} (${instructor._id})`);

        // 2. ASSIGN
        console.log('--- Action: Admin Assigns Instructor ---');
        const { assignToInstructor } = require('../controllers/registrationAdminController');

        const adminId = new mongoose.Types.ObjectId().toString();
        const { req, res } = mockReqRes({
            registrationIds: [student._id.toString()],
            instructorId: instructor._id.toString()
        }, { userId: adminId, role: 'registration_admin' });

        await assignToInstructor(req, res);

        if (res.data.success) {
            console.log('✅ Assignment API Success');
        } else {
            throw new Error(`Assignment API Failed: ${res.data?.message}`);
        }

        // 3. VERIFY
        const updatedStudent = await Registration.findById(student._id);
        if (updatedStudent.assignedInstructorId.toString() === instructor._id.toString()) {
            console.log('✅ Database Verification: Instructor Assigned Correctly');
        } else {
            console.error('❌ Database Verification Failed: ID Mismatch');
            console.log('Expected:', instructor._id);
            console.log('Actual:', updatedStudent.assignedInstructorId);
            process.exit(1);
        }

        console.log('🎉 Verification 2 PASSED');
        process.exit(0);
    } catch (error) {
        console.error('❌ Verification 2 FAILED', error);
        process.exit(1);
    }
}

verifyAdmin();
