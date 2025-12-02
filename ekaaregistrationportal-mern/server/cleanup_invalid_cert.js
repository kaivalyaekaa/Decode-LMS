const mongoose = require('mongoose');
const Certificate = require('./models/Certificate');
const dotenv = require('dotenv');

dotenv.config();

async function cleanupInvalidCertificates() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    try {
        // Find certificate with undefined program
        const invalidCert = await Certificate.findOne({ programLevel: undefined });

        if (invalidCert) {
            console.log(`Found invalid certificate: ${invalidCert.certificateNumber}`);
            console.log(`Deleting certificate #${invalidCert._id}...`);
            await Certificate.deleteOne({ _id: invalidCert._id });
            console.log('✅ Deleted invalid certificate');
        } else {
            console.log('No invalid certificates found');
        }

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n=== COMPLETE ===');
    }
}

cleanupInvalidCertificates();
