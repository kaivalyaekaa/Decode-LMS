const mongoose = require('mongoose');
const Registration = require('./models/Registration');
const dotenv = require('dotenv');

dotenv.config();

async function cleanupDuplicates() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    try {
        console.log('=== CLEANING UP DUPLICATES ===\n');

        // Target instructor ID (Kaivalya)
        const kaivalyaId = '692c225f48b74919c223f725';

        // Find all "Test Student" records
        const testStudents = await Registration.find({ fullName: 'Test Student' });
        console.log(`Found ${testStudents.length} "Test Student" records.`);

        let deletedCount = 0;

        for (const student of testStudents) {
            const assignedId = student.assignedInstructorId?.toString();

            if (assignedId === kaivalyaId) {
                console.log(`✓ KEEPING: ${student._id} (Assigned to Kaivalya)`);
            } else {
                console.log(`✗ DELETING: ${student._id} (Assigned to ${assignedId || 'None'})`);
                await Registration.findByIdAndDelete(student._id);
                deletedCount++;
            }
        }

        console.log(`\nDeleted ${deletedCount} duplicate records.`);

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n=== COMPLETE ===');
    }
}

cleanupDuplicates();
