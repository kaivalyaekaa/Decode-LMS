const mongoose = require('./server/node_modules/mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const Registration = require('./server/models/Registration');
const Certificate = require('./server/models/Certificate');

async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const studentName = "Test Student";
        const registration = await Registration.findOne({ fullName: studentName });

        if (!registration) {
            console.log(`❌ Registration not found for ${studentName}`);
            process.exit(0);
        }

        const cert = await Certificate.findOne({ studentRegistrationId: registration._id });
        if (cert) {
            console.log(`🗑️ Deleting orphaned certificate: ${cert.certificateNumber}`);
            await Certificate.deleteOne({ _id: cert._id });
            console.log('✅ Certificate deleted.');
        } else {
            console.log('ℹ️ No certificate found to delete.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
