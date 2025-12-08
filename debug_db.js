const mongoose = require('./server/node_modules/mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const Registration = require('./server/models/Registration');
const Batch = require('./server/models/Batch');
const Attendance = require('./server/models/Attendance');

async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const studentName = "Roopa Student";
        const registration = await Registration.findOne({ fullName: studentName });

        if (!registration) {
            console.log(`❌ Registration not found for ${studentName}`);
            process.exit(0);
        }

        console.log('--- Registration ---');
        console.log(`ID: ${registration._id}`);
        console.log(`Batch ID: ${registration.batchId}`);
        console.log(`Payment Status: ${registration.paymentStatus}`);

        if (registration.batchId) {
            const batch = await Batch.findById(registration.batchId);
            console.log('--- Batch ---');
            if (batch) {
                console.log(`ID: ${batch._id}`);
                console.log(`Code: ${batch.batchCode}`);
                console.log(`Program: ${batch.programLevel}`);
            } else {
                console.log('❌ Batch not found in DB!');
            }
        } else {
            console.log('❌ No Batch ID assigned to registration!');
        }

        const attendance = await Attendance.find({ studentRegistrationId: registration._id });
        console.log('--- Attendance ---');
        console.log(`Count: ${attendance.length}`);
        attendance.forEach(att => {
            console.log(`- Date: ${att.date}, Status: ${att.status}, BatchId: ${att.batchId}`);
        });

        const Certificate = require('./server/models/Certificate');
        const cert = await Certificate.findOne({ studentRegistrationId: registration._id });
        console.log('--- Certificate ---');
        if (cert) {
            console.log(`ID: ${cert._id}`);
            console.log(`Number: ${cert.certificateNumber}`);
        } else {
            console.log('No certificate found.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
