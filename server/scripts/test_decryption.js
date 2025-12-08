const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Registration = require('../models/Registration');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to DB');

        const { encrypt, decrypt } = require('../utils/encryption');
        console.log('--- Fresh Cycle Test ---');
        const original = "Hello World";
        const enc = encrypt(original);
        console.log('Encrypted:', enc);
        const dec = decrypt(enc);
        console.log('Decrypted:', dec);

        if (dec !== original) {
            console.error("CRITICAL: New Encryption/Decryption failed!");
        } else {
            console.log("SUCCESS: New Encryption/Decryption works.");
        }

        console.log('--- DB Data Test (Fresh Record) ---');
        const newReg = new Registration({
            fullName: 'Fresh Decrypt Test',
            email: `fresh_${Date.now()}@example.com`,
            phone: '8888888888',
            cityCountry: 'Test City',
            programLevel: 'Level 1 – Decode Your Mind',
            mode: 'Online Training'
        });
        await newReg.save();
        console.log('Saved Fresh User:', newReg.email);

        console.log('--- Fetching Fresh via findOne (Mongoose Document) ---');
        const schemaReg = await Registration.findById(newReg._id);
        console.log('Email:', schemaReg.email);

        console.log('--- Fetching Fresh via Aggregate (Raw) ---');
        const aggReg = await Registration.aggregate([{ $match: { _id: newReg._id } }]);
        console.log('Agg Email (Raw):', aggReg[0].email);
        console.log('Agg Email (Manual Decrypt):', decrypt(aggReg[0].email));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
