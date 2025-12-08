const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const crypto = require('crypto');
const { encrypt } = require('../utils/encryption');
const Registration = require('../models/Registration');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('Database connection error:', err);
        process.exit(1);
    }
};

const hashEmail = (email) => {
    return crypto.createHash('sha256').update(email).digest('hex');
};

const migrateData = async () => {
    await connectDB();

    try {
        const registrations = await Registration.find({});
        console.log(`Found ${registrations.length} registrations to process.`);

        let successCount = 0;
        let skippedCount = 0;

        for (const reg of registrations) {
            // Check if already encrypted (simple check for colon which acts as IV separator in our logic)
            // Or assume if it lacks emailHash but has plaintext email, it needs migration.
            // But we didn't add emailHash to schema yet, so strict schema might strip it? 
            // Mongoose flexible? No, need to define schema or update via direct command?
            // Actually, we can update via Mongoose even if strict is default (it filters), but we SHOULD update Schema FIRST or use updateOne with $set.
            // Let's use updateOne to bypass Schema limitation if I haven't updated it yet.

            // Wait, I should update Schema FIRST so the code can work with the new field?
            // If I update Schema first, finding existing docs is fine.
            // But `reg.emailHash` assignment won't work if it's not in schema in the code running HERE? 
            // No, "Registration" required above is the OLD schema if I haven't updated the file.

            // To be safe, I will use `Registration.collection.updateOne` to bypass Mongoose Schema validation for the migration step.

            const email = reg.email;
            const phone = reg.phone;

            // Simple heuristic to detect if already encrypted (contains IV separator ':' and looks hex-ish)
            const isEncrypted = email.includes(':') && !email.includes('@');

            if (isEncrypted) {
                skippedCount++;
                continue;
            }

            const encryptedEmail = encrypt(email);
            const encryptedPhone = encrypt(phone);
            const emailHash = hashEmail(email);

            await Registration.collection.updateOne(
                { _id: reg._id },
                {
                    $set: {
                        email: encryptedEmail,
                        phone: encryptedPhone,
                        emailHash: emailHash
                    }
                }
            );
            successCount++;
        }

        console.log(`Migration Complete.`);
        console.log(`Encrypted: ${successCount}`);
        console.log(`Skipped (Already encrypted): ${skippedCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Migration Error:', error);
        process.exit(1);
    }
};

migrateData();
