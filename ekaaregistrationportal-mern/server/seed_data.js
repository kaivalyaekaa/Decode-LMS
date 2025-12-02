const mongoose = require('mongoose');
const Registration = require('./models/Registration');
const Batch = require('./models/Batch');
const User = require('./models/User');
require('dotenv').config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Get an Instructor
        const instructor = await User.findOne({ role: 'instructor' });
        if (!instructor) {
            console.log('No instructor found. Creating one...');
            // Create instructor logic if needed, but assuming one exists from previous steps
            return;
        }
        console.log(`Using Instructor: ${instructor.fullName}`);

        // 2. Create a Batch
        const batch = new Batch({
            batchCode: 'B001',
            programLevel: 'Level 1 – Decode Your Mind',
            instructorId: instructor._id,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            mode: 'Online',
            maxStudents: 20,
            currentStudents: 0,
            status: 'Active',
            totalSessions: 10,
            createdBy: instructor._id
        });
        await batch.save();
        console.log(`Created Batch: ${batch.batchCode}`);

        // 3. Assign Students to Batch
        const registrations = await Registration.find({});
        for (const reg of registrations) {
            reg.batchId = batch._id;
            reg.assignedInstructorId = instructor._id;
            reg.paymentStatus = 'Paid'; // Ensure paid for testing
            reg.certificateStatus = 'Pending';
            await reg.save();
            console.log(`Assigned ${reg.fullName} to batch ${batch.batchCode}`);
        }

        console.log('Seeding complete.');

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
};

seedData();
