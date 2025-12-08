const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Batch = require('../models/Batch');
const Attendance = require('../models/Attendance');

dotenv.config({ path: path.join(__dirname, '../.env') });

const mockReqRes = (body = {}, user = {}, query = {}) => {
    const req = { body, user, query };
    const res = {
        statusCode: 200,
        data: null,
        status: function (code) { this.statusCode = code; return this; },
        json: function (data) { this.data = data; return this; },
        send: function (data) { this.data = data; return this; }
    };
    return { req, res };
};

// Setup: Student assigned to Instructor
async function setupInstructorData() {
    const instructor = await User.findOne({ role: 'instructor' });
    if (!instructor) throw new Error("No instructor found.");

    const email = `verify_3_${Date.now()}@example.com`;
    const student = new Registration({
        fullName: 'Verify Three',
        email: email,
        phone: '3333333333',
        cityCountry: 'Instructor City',
        programLevel: 'Level 1 – Decode Your Mind',
        mode: 'Online Training',
        region: 'INDIA',
        assignedInstructorId: instructor._id
    });
    await student.save();
    return { student, instructor };
}

async function verifyInstructor() {
    console.log('🧪 Starting Verification 3: Instructor Batch & Attendance');

    try {
        await mongoose.connect(process.env.MONGO_URI);

        // 1. SETUP
        const { student, instructor } = await setupInstructorData();
        console.log(`Setup: Student ${student._id} assigned to ${instructor.fullName}`);

        // 2. CREATE BATCH
        console.log('--- Action: Create Batch ---');
        const { createBatch } = require('../controllers/instructorController');
        const batchCode = `BATCH_V3_${Date.now()}`;

        const { req: batchReq, res: batchRes } = mockReqRes({
            batchCode: batchCode,
            programLevel: 'Level 1 – Decode Your Mind',
            startDate: new Date(),
            mode: 'Online', // Correct Enum
            studentIds: [student._id.toString()]
        }, { userId: instructor._id.toString(), role: 'instructor' });

        await createBatch(batchReq, batchRes);
        if (!batchRes.data.success) throw new Error(`Batch Create Failed: ${batchRes.data?.message}`);

        const batchId = batchRes.data.batch._id;
        console.log(`✅ Batch Created: ${batchId}`);

        // 3. VERIFY BATCH ASSIGNMENT
        const updatedStudent = await Registration.findById(student._id);
        if (updatedStudent.batchId.toString() === batchId.toString()) {
            console.log('✅ Student BatchID Updated');
        } else {
            throw new Error('❌ Student not linked to Batch');
        }

        // 4. MARK ATTENDANCE
        console.log('--- Action: Mark Attendance ---');
        const { markAttendance } = require('../controllers/instructorController');
        const { req: attReq, res: attRes } = mockReqRes({
            registrationId: student._id.toString(),
            date: new Date().toISOString(),
            status: 'Present',
            batchId: batchId.toString()
        }, { userId: instructor._id.toString(), role: 'instructor' });

        await markAttendance(attReq, attRes);
        if (!attRes.data.success) throw new Error(`Attendance Failed: ${attRes.data?.message}`);

        // 5. VERIFY ATTENDANCE
        const attRecord = await Attendance.findOne({
            studentRegistrationId: student._id,
            batchId: batchId
        });

        if (attRecord && attRecord.status === 'Present') {
            console.log('✅ Attendance Record Verified in DB');
        } else {
            throw new Error('❌ Attendance Record Missing/Incorrect');
        }

        console.log('🎉 Verification 3 PASSED');
        process.exit(0);
    } catch (error) {
        console.error('❌ Verification 3 FAILED', error);
        process.exit(1);
    }
}

verifyInstructor();
