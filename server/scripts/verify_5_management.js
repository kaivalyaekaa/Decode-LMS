const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Batch = require('../models/Batch');
const Attendance = require('../models/Attendance');
const Certificate = require('../models/Certificate');

dotenv.config({ path: path.join(__dirname, '../.env') });

const mockReqRes = (body = {}, user = {}, params = {}) => {
    const req = { body, user, params };
    const res = {
        statusCode: 200,
        data: null,
        status: function (code) { this.statusCode = code; return this; },
        json: function (data) { this.data = data; return this; },
        send: function (data) { this.data = data; return this; }
    };
    return { req, res };
};

// Complex Setup: Paid Student, Batch, Present Attendance
async function setupEligibleStudent() {
    const email = `verify_5_${Date.now()}@example.com`;
    const student = new Registration({
        fullName: 'Verify Five',
        email: email,
        phone: '5555555555',
        cityCountry: 'Mgmt City',
        programLevel: 'Level 1 – Decode Your Mind',
        mode: 'Online Training', // Correct Registration Enum
        region: 'INDIA',
        paymentStatus: 'Paid' // Eligible
    });
    await student.save();

    const batch = new Batch({
        batchCode: `BATCH_V5_${Date.now()}`,
        programLevel: student.programLevel,
        startDate: new Date(),
        mode: 'Online', // Correct Batch Enum
        instructorId: new mongoose.Types.ObjectId(), // Placeholder instructor
        status: 'Active'
    });
    await batch.save();

    // Link Student to Batch
    student.batchId = batch._id;
    await student.save();

    const attendance = new Attendance({
        studentRegistrationId: student._id,
        batchId: batch._id,
        date: new Date(),
        status: 'Present', // Eligible
        instructorId: batch.instructorId,
        programLevel: student.programLevel // Required
    });
    await attendance.save();

    return { student, batch };
}

async function verifyManagement() {
    console.log('🧪 Starting Verification 5: Management Certificate Approval');

    try {
        await mongoose.connect(process.env.MONGO_URI);

        // 1. SETUP
        const { student, batch } = await setupEligibleStudent();
        console.log(`Setup: Eligible Student ${student._id} in Batch ${batch.batchCode}`);

        // 2. APPROVE CERTIFICATE
        console.log('--- Action: Management Approves Certificate ---');
        const { approveCertificate } = require('../controllers/managementController');
        const mgmtId = new mongoose.Types.ObjectId().toString();

        const { req, res } = mockReqRes({
            registrationId: student._id.toString(),
            batchId: batch._id.toString(),
            notes: 'Verified by Script 5'
        }, { userId: mgmtId, role: 'management' });

        await approveCertificate(req, res);

        if (res.statusCode === 200 && res.data.success) {
            console.log('✅ Certificate API Success');
            console.log(`   Certificate No: ${res.data.certificate.certificateNumber}`);
        } else {
            throw new Error(`Certificate API Failed: ${res.data?.message} ${res.data?.error || ''}`);
        }

        // 3. VERIFY DB UPDATE
        const updatedStudent = await Registration.findById(student._id);
        if (updatedStudent.certificateStatus === 'Issued') {
            console.log('✅ Registration Status: Issued');
        } else {
            throw new Error('❌ Registration Status not updated');
        }

        // 4. VERIFY CERTIFICATE RECORD
        const cert = await Certificate.findOne({ studentRegistrationId: student._id });
        if (cert) {
            console.log('✅ Certificate Record Found');
        } else {
            console.error('❌ Certificate Record Missing. Dumping all certs:');
            const allCerts = await Certificate.find({});
            console.log(JSON.stringify(allCerts, null, 2));
            console.log('Looking for RegId:', student._id);
            throw new Error('❌ Certificate Record Missing');
        }

        console.log('🎉 Verification 5 PASSED');
        process.exit(0);
    } catch (error) {
        console.error('❌ Verification 5 FAILED', error);
        process.exit(1);
    }
}

verifyManagement();
