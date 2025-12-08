const axios = require('axios');
const mongoose = require('./server/node_modules/mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const API_URL = 'http://localhost:5000/api';
const FINANCE_CREDENTIALS = { username: 'finance', password: 'password123', role: 'finance' };

async function main() {
    try {
        console.log('🚀 Starting Payment Approval...');

        // 1. Login as Finance
        console.log('🔑 Logging in as Finance...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, FINANCE_CREDENTIALS);
        const token = loginRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('✅ Logged in successfully.');

        // 2. Find Roopa's Registration ID
        await mongoose.connect(process.env.MONGO_URI);
        const Registration = require('./server/models/Registration');
        const roopa = await Registration.findOne({ email: 'roopa@test.com' });

        if (!roopa) {
            console.error('❌ Roopa not found in DB');
            process.exit(1);
        }

        // 3. Update Payment Status (API)
        // Finance uses /api/finance/update-status
        console.log(`💰 Updating payment for ${roopa.fullName}...`);
        await axios.put(`${API_URL}/finance/registration/${roopa._id}/payment`, {
            paymentStatus: 'Paid',
            paymentMode: 'Online',
            transactionId: 'API-APPROVE-01'
        }, config);

        console.log('✅ Payment Approved!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Payment Approval Failed:', error.message);
        if (error.response) console.error(error.response.data);
        process.exit(1);
    }
}

main();
