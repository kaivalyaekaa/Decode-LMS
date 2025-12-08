const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Registration = require('../models/Registration');

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

async function verifyFinance() {
    console.log('🧪 Starting Verification 4: Finance Payment Update');

    try {
        await mongoose.connect(process.env.MONGO_URI);

        // 1. SETUP
        const email = `verify_4_${Date.now()}@example.com`;
        const student = new Registration({
            fullName: 'Verify Four',
            email: email,
            phone: '4444444444',
            cityCountry: 'Finance City',
            programLevel: 'Level 1 – Decode Your Mind',
            mode: 'Online Training',
            region: 'INDIA',
            paymentStatus: 'Pending'
        });
        await student.save();
        console.log(`Setup: Created Student ${student._id} (Pending)`);

        // 2. PAYMENT UPDATE
        console.log('--- Action: Finance Updates Payment ---');
        const { updateRegistrationPayment } = require('../controllers/financeController');
        const financeId = new mongoose.Types.ObjectId().toString();

        const { req, res } = mockReqRes({
            paymentStatus: 'Paid',
            paymentMode: 'Online',
            transactionId: 'TXN_VERIFY_4'
        }, { userId: financeId, role: 'finance_admin' }, { registrationId: student._id.toString() });

        await updateRegistrationPayment(req, res);

        if (res.data.success) {
            console.log('✅ Payment API Success');
        } else {
            throw new Error(`Payment API Failed: ${res.data?.message}`);
        }

        // 3. VERIFY
        const updatedStudent = await Registration.findById(student._id);
        if (updatedStudent.paymentStatus === 'Paid' && updatedStudent.transactionId === 'TXN_VERIFY_4') {
            console.log('✅ Database Verification: Status Paid, TXN Recorded');
        } else {
            throw new Error('❌ Database Verification Failed');
        }

        console.log('🎉 Verification 4 PASSED');
        process.exit(0);
    } catch (error) {
        console.error('❌ Verification 4 FAILED', error);
        process.exit(1);
    }
}

verifyFinance();
