const mongoose = require('mongoose');
const Registration = require('./models/Registration');
const dotenv = require('dotenv');

dotenv.config();

async function checkStudentStatus() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    try {
        console.log('=== Checking Student Payment Status ===\n');

        // Find all registrations
        const allRegistrations = await Registration.find({});
        console.log(`Total registrations: ${allRegistrations.length}\n`);

        // Find registrations with payment status
        const paidStudents = await Registration.find({ paymentStatus: 'Paid' });
        const pendingStudents = await Registration.find({ paymentStatus: 'Pending' });

        console.log(`Paid students: ${paidStudents.length}`);
        console.log(`Pending students: ${pendingStudents.length}\n`);

        // Find eligible for certificates (Paid + Not Issued)
        const eligibleForCert = await Registration.find({
            paymentStatus: 'Paid',
            certificateStatus: { $ne: 'Issued' }
        });

        console.log(`Eligible for certificates: ${eligibleForCert.length}\n`);

        // Show details of all registrations
        console.log('=== All Registrations Details ===');
        for (const reg of allRegistrations) {
            console.log(`\nName: ${reg.fullName}`);
            console.log(`Email: ${reg.email}`);
            console.log(`Payment Status: ${reg.paymentStatus}`);
            console.log(`Certificate Status: ${reg.certificateStatus || 'Pending'}`);
            console.log(`Program Level: ${reg.programLevel}`);
        }

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n=== COMPLETE ===');
    }
}

checkStudentStatus();
