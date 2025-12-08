const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const TEST_EMAIL = `test_enc_${Date.now()}@example.com`;
const TEST_PHONE = '9999999999';

const runTest = async () => {
    try {
        console.log('1. Creating Registration via API...');
        const createRes = await axios.post('http://localhost:5000/api/registration', {
            fullName: 'Encryption Test User',
            email: TEST_EMAIL,
            phone: TEST_PHONE,
            cityCountry: 'Test City',
            programLevel: 'Level 1 – Decode Your Mind',
            mode: 'Online Training',
            region: 'INDIA'
        });

        if (createRes.data.success) {
            console.log('API Creation Success.');
        } else {
            console.error('API Creation Failed:', createRes.data);
            process.exit(1);
        }

        console.log('2. checking Database Directly (Expect Ciphertext)...');
        await mongoose.connect(process.env.MONGO_URI);
        const Registration = mongoose.connection.collection('registrations');

        // We can't search by plaintext email if encryption works!
        // But we added emailHash.
        // Let's search by ID from API response.
        const regId = createRes.data.registration._id;
        const dbDoc = await Registration.findOne({ _id: new mongoose.Types.ObjectId(regId) });

        if (!dbDoc) {
            console.error('Document not found in DB!');
            process.exit(1);
        }

        console.log(`DB Email: ${dbDoc.email}`);
        console.log(`DB Phone: ${dbDoc.phone}`);

        if (dbDoc.email === TEST_EMAIL) {
            console.error('FAILURE: Email is PLAINTEXT in DB!');
        } else if (dbDoc.email.includes(':')) {
            console.log('SUCCESS: Email is ENCRYPTED in DB.');
        } else {
            console.warn('WARNING: Email format unknown (maybe encrypted but no IV separator?)');
        }

        if (dbDoc.emailHash) {
            console.log('SUCCESS: emailHash is present.');
        } else {
            console.error('FAILURE: emailHash is MISSING.');
        }

        console.log('3. Fetching via API (Expect Decryption)...');
        // We need an endpoint that returns this registration.
        // studentLogin returns it.
        const loginRes = await axios.post('http://localhost:5000/api/registration/student-login', {
            email: TEST_EMAIL,
            phone: TEST_PHONE
        });

        if (loginRes.data.success) {
            const fetchedEmail = loginRes.data.registration.email;
            console.log(`API Returned Email: ${fetchedEmail}`);
            if (fetchedEmail === TEST_EMAIL) {
                console.log('SUCCESS: API returned Decrypted data.');
            } else {
                console.error('FAILURE: API returned Encrypted/Wrong data.');
            }
        } else {
            console.error('API Fetch Failed:', loginRes.data);
        }

        process.exit(0);

    } catch (error) {
        console.error('Test Failed:', error.message);
        if (error.response) console.error('Response:', error.response.data);
        process.exit(1);
    }
};

runTest();
