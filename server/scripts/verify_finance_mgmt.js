const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Certificate = require('../models/Certificate');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const mockReqRes = (body = {}, user = {}) => {
    const req = { body, user, params: {} };
    const res = {
        json: (data) => console.log('Response:', JSON.stringify(data, null, 2)),
        status: (code) => {
            console.log(`Status: ${code}`);
            return { json: (data) => console.log('Response:', JSON.stringify(data, null, 2)) };
        }
    };
    return { req, res };
};

async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to DB');

        // 1. Create Mock Users
        const instructorId = new mongoose.Types.ObjectId().toString(); // Use Strings
        const managementId = new mongoose.Types.ObjectId().toString();

        // 2. Create Mock Registration
        const registration = new Registration({
            fullName: 'Test Student E2E',
            email: `test_e2e_${Date.now()}@example.com`,
            phone: '1234567890',
            programLevel: 'Level 1 – Decode Your Mind',
            mode: 'Online Training',
            cityCountry: 'Mumbai, India',
            registeredBy: instructorId,
            assignedInstructorId: instructorId,
            registrationDate: new Date()
        });
        await registration.save();
        console.log(`✅ Registration Created: ${registration._id}`);

        // 3. Instructor Marks Attendance (No Batch)
        const { markAttendance } = require('../controllers/instructorController');
        const { req: attReq, res: attRes } = mockReqRes({
            registrationId: registration._id.toString(),
            date: new Date().toISOString(),
            status: 'Present'
        }, { userId: instructorId }); // Pass String ID
        console.log('--- Marking Attendance ---');
        await markAttendance(attReq, attRes);

        // 4. Finance Updates Payment
        const { updateRegistrationPayment } = require('../controllers/financeController');
        const { req: finReq, res: finRes } = mockReqRes({
            paymentStatus: 'Paid',
            paymentMode: 'Online',
            transactionId: 'MANUAL_TX_' + Date.now()
        });
        finReq.params.registrationId = registration._id.toString();
        console.log('--- Updating Payment ---');
        await updateRegistrationPayment(finReq, finRes);

        // 5. Management Approves Certificate
        const { approveCertificate } = require('../controllers/managementController');
        const { req: mgmtReq, res: mgmtRes } = mockReqRes({
            registrationId: registration._id.toString(),
            // No Batch ID provided
            notes: 'Approved via E2E Script'
        }, { userId: managementId });
        console.log('--- Approving Certificate ---');
        await approveCertificate(mgmtReq, mgmtRes);

        console.log('✅ E2E Test Completed');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
