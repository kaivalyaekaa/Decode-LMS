const mongoose = require('mongoose');
const Certificate = require('./models/Certificate');
const Registration = require('./models/Registration');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

async function checkCertificates() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    try {
        console.log('=== Checking Certificates ===\n');

        const certificates = await Certificate.find({})
            .populate('studentRegistrationId', 'fullName email programLevel')
            .populate('approvedBy', 'fullName role')
            .sort({ issueDate: -1 });

        console.log(`Total certificates: ${certificates.length}\n`);

        certificates.forEach((cert, index) => {
            console.log(`\n--- Certificate ${index + 1} ---`);
            console.log(`Certificate Number: ${cert.certificateNumber}`);
            console.log(`Student: ${cert.studentRegistrationId?.fullName || 'UNKNOWN'}`);
            console.log(`Email: ${cert.studentRegistrationId?.email || 'UNKNOWN'}`);
            console.log(`Program: ${cert.programLevel}`);
            console.log(`Issued: ${cert.issueDate}`);
            console.log(`Approved By: ${cert.approvedBy?.fullName || 'UNKNOWN'} (${cert.approvedBy?.role || 'UNKNOWN'})`);
            console.log(`Email Sent: ${cert.emailStatus?.sent || false}`);
        });

        console.log('\n=== Checking Registrations ===\n');

        const registrations = await Registration.find({})
            .select('fullName email programLevel certificateStatus paymentStatus')
            .sort({ registrationDate: -1 });

        console.log(`Total registrations: ${registrations.length}\n`);

        registrations.forEach((reg, index) => {
            console.log(`${index + 1}. ${reg.fullName} - ${reg.programLevel}`);
            console.log(`   Payment: ${reg.paymentStatus} | Certificate: ${reg.certificateStatus || 'Pending'}`);
        });

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n=== COMPLETE ===');
    }
}

checkCertificates();
