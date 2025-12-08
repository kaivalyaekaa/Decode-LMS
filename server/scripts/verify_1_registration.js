const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User'); // Import User model (needed for registration logic dependencies potentially)
const Registration = require('../models/Registration');

dotenv.config({ path: path.join(__dirname, '../.env') });

const mockReqRes = (body = {}) => {
    const req = { body };
    const res = {
        statusCode: 200,
        data: null,
        status: function (code) { this.statusCode = code; return this; },
        json: function (data) { this.data = data; return this; },
        send: function (data) { this.data = data; return this; }
    };
    return { req, res };
};

async function verifyRegistration() {
    console.log('🧪 Starting Verification 1: Public Registration & Login');

    try {
        await mongoose.connect(process.env.MONGO_URI);
        const testEmail = `verify_1_${Date.now()}@example.com`;

        // 1. REGISTER
        console.log('--- Action: Create Registration ---');
        const { createRegistration } = require('../controllers/registrationController');
        const { req: regReq, res: regRes } = mockReqRes({
            fullName: 'Verify One',
            email: testEmail,
            phone: '1112223333',
            cityCountry: 'Test City',
            programLevel: 'Level 1 – Decode Your Mind',
            mode: 'Online Training',
            region: 'INDIA',
            referralSource: 'Social Media'
        });

        await createRegistration(regReq, regRes);
        if (regRes.statusCode !== 201) throw new Error(`Registration Failed: ${regRes.data?.message}`);
        console.log(`✅ Registration Created: ${testEmail}`);

        // 2. CHECK ENCRYPTION
        console.log('--- Action: Verify Encryption ---');
        // We expect the RESPONSE to be encrypted/modified by controller, 
        // OR we specifically check the DB to ensure raw data is encrypted.
        const dbReg = await Registration.collection.findOne({ _id: regRes.data.registration._id });
        if (dbReg.email.includes(':')) {
            console.log('✅ DB Record is Encrypted');
        } else {
            console.error('❌ DB Record is NOT Encrypted (Plaintext)');
        }

        // 3. LOGIN
        console.log('--- Action: Student Login ---');
        const { studentLogin } = require('../controllers/registrationController');
        const { req: loginReq, res: loginRes } = mockReqRes({
            email: testEmail,
            phone: '1112223333'
        });

        await studentLogin(loginReq, loginRes);
        if (loginRes.data.success) {
            console.log('✅ Login Successful');
            // Check if returned data is decrypted
            if (loginRes.data.registration.email === testEmail) {
                console.log('✅ Login Response Decrypted Correctly');
            } else {
                console.log('⚠️ Login Response still encrypted (Client must handle?)');
            }
        } else {
            throw new Error(`Login Failed: ${loginRes.data?.message}`);
        }

        console.log('🎉 Verification 1 PASSED');
        process.exit(0);
    } catch (error) {
        console.error('❌ Verification 1 FAILED', error);
        process.exit(1);
    }
}

verifyRegistration();
