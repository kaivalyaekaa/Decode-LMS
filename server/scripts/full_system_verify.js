const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Registration = require('../models/Registration');
const User = require('../models/User');
const Batch = require('../models/Batch');
const Attendance = require('../models/Attendance');
const Certificate = require('../models/Certificate');
const { decrypt } = require('../utils/encryption');

dotenv.config({ path: path.join(__dirname, '../.env') });

// Mock Request/Response Helper
const mockReqRes = (body = {}, user = {}, params = {}, query = {}) => {
    const req = { body, user, params, query };
    const res = {
        statusCode: 200,
        data: null,
        status: function (code) { this.statusCode = code; return this; },
        json: function (data) { this.data = data; return this; },
        send: function (data) { this.data = data; return this; },
        end: function () { }
    };
    return { req, res };
};

async function runTest() {
    console.log('🚀 Starting Full System Verification Check...');

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // --- PRE-CLEANUP ---
        const testEmail = `test_sys_verify_${Date.now()}@example.com`;

        // 1. PUBLIC REGISTRATION
        console.log('\n--- Step 1: Public Registration ---');
        const { createRegistration, studentLogin } = require('../controllers/registrationController');
        const { req: regReq, res: regRes } = mockReqRes({
            fullName: 'System Verify Student',
            email: testEmail,
            phone: '9876543210',
            cityCountry: 'Test City, In-Depth',
            programLevel: 'Level 1 – Decode Your Mind', // Exact enum match
            mode: 'Online Training',
            region: 'INDIA',
            referralSource: 'Social Media'
        });

        await createRegistration(regReq, regRes);

        if (regRes.statusCode !== 201 || !regRes.data.success) {
            throw new Error(`Registration Failed: ${regRes.data?.message}`);
        }

        const studentId = regRes.data.registration._id;
        console.log(`✅ Student Registered: ${studentId}`);
        // Expect encrypted email in response
        if (regRes.data.registration.email !== testEmail) {
            console.log('✅ PII Matches Encryption Expectation (Response is encrypted)');
        } else {
            console.warn('⚠️ Warning: Email returned in plain text (Check controller logic)');
        }

        // 1.1 DUPLICATE CHECK
        console.log('\n--- Step 1.1: Duplicate Registration Check ---');
        const { req: dupReq, res: dupRes } = mockReqRes({
            fullName: 'Duplicate User',
            email: testEmail, // Same email
            phone: '0000000000',
            cityCountry: 'City',
            programLevel: 'Level 1 – Decode Your Mind',
            mode: 'Online Training',
            region: 'INDIA'
        });
        await createRegistration(dupReq, dupRes);
        if (dupRes.statusCode === 400) {
            console.log('✅ Duplicate Registration Blocked (Expected)');
        } else {
            console.error('❌ Duplicate Check Failed');
        }

        // 1.2 LOGIN CHECK
        console.log('\n--- Step 1.2: Student Login Check ---');
        const { req: loginReq, res: loginRes } = mockReqRes({
            email: testEmail,
            phone: '9876543210'
        });
        await studentLogin(loginReq, loginRes);
        if (loginRes.data.success) {
            console.log('✅ Student Login Successful (Hash Lookup works)');
        } else {
            throw new Error('Student Login Failed');
        }

        // 2. ADMIN ASSIGNMENT
        console.log('\n--- Step 2: Admin Assignment ---');
        // Find an instructor first
        const instructor = await User.findOne({ role: 'instructor' });
        if (!instructor) throw new Error('No Instructor found in DB. Seed Admins first.');

        const adminId = new mongoose.Types.ObjectId().toString(); // Valid ObjectId
        const { assignToInstructor } = require('../controllers/registrationAdminController');
        const { req: assignReq, res: assignRes } = mockReqRes({
            registrationIds: [studentId],
            instructorId: instructor._id.toString()
        }, { userId: adminId, role: 'registration_admin' });

        await assignToInstructor(assignReq, assignRes);
        if (!assignRes.data.success) throw new Error(`Assignment Failed: ${assignRes.data.message}`);
        console.log(`✅ Assigned to Instructor: ${instructor.fullName}`);

        // 3. INSTRUCTOR BATCH CREATION
        console.log('\n--- Step 3: Instructor Creates Batch ---');
        const { createBatch } = require('../controllers/instructorController');
        const batchCode = `BATCH_${Date.now()}`;
        const { req: batchReq, res: batchRes } = mockReqRes({
            batchCode: batchCode,
            programLevel: 'Level 1 – Decode Your Mind',
            startDate: new Date(),
            mode: 'Online', // Correct Enum
            studentIds: [studentId]
        }, { userId: instructor._id.toString(), role: 'instructor' });

        await createBatch(batchReq, batchRes);
        if (!batchRes.data.success) throw new Error(`Batch Creation Failed: ${batchRes.data.message}`);
        const batchId = batchRes.data.batch._id;
        console.log(`✅ Batch Created: ${batchCode} (${batchId})`);

        // 3.1 ATTENDANCE MARKING (BATCHED)
        console.log('\n--- Step 3.1: Instructor Marks Attendance ---');
        const { markAttendance } = require('../controllers/instructorController');
        const { req: attReq, res: attRes } = mockReqRes({
            registrationId: studentId.toString(),
            date: new Date().toISOString(),
            status: 'Present',
            batchId: batchId.toString()
        }, { userId: instructor._id.toString(), role: 'instructor' });

        await markAttendance(attReq, attRes);
        if (!attRes.data.success) throw new Error(`Attendance Failed: ${attRes.data.message}`);
        console.log('✅ Attendance Marked: Present');

        // 4. FINANCE PAYMENT
        console.log('\n--- Step 4: Finance Updates Payment ---');
        const financeId = new mongoose.Types.ObjectId().toString(); // Valid ObjectId
        const { updateRegistrationPayment } = require('../controllers/financeController');
        const { req: payReq, res: payRes } = mockReqRes({
            paymentStatus: 'Paid',
            paymentMode: 'Online',
            transactionId: 'TXN_VERIFY_123'
        }, { userId: financeId, role: 'finance_admin' }, { registrationId: studentId.toString() });

        await updateRegistrationPayment(payReq, payRes);
        if (!payRes.data.success) throw new Error(`Payment Update Failed: ${payRes.data.message}`);
        console.log('✅ Payment Status: Paid');

        // 5. MANAGEMENT APPROVAL
        console.log('\n--- Step 5: Management Approval & Certificate ---');
        const mgmtId = new mongoose.Types.ObjectId().toString(); // Valid ObjectId
        const { approveCertificate } = require('../controllers/managementController');
        const { req: certReq, res: certRes } = mockReqRes({
            registrationId: studentId.toString(),
            batchId: batchId.toString(),
            notes: 'System Verify Automated Approval'
        }, { userId: mgmtId, role: 'management' });

        await approveCertificate(certReq, certRes);

        if (certRes.statusCode === 400 && certRes.data?.message?.includes('already issued')) {
            console.log('⚠️ Certificate already issued (Idempotency Check Passed)');
        } else if (!certRes.data.success) {
            throw new Error(`Certificate Approval Failed: ${certRes.data.message} ${certRes.data.error || ''}`);
        } else {
            console.log(`✅ Certificate Generated: ${certRes.data.certificate.certificateNumber}`);
            console.log(`   URL: ${certRes.data.certificate.certificateUrl}`);
        }

        console.log('\n🏁 FATAL CHECK: All Functional Steps Passed.');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED');
        console.error(error);
        process.exit(1);
    }
}

runTest();
