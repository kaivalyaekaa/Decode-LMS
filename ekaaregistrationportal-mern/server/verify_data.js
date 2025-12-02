const mongoose = require('mongoose');
const Registration = require('./models/Registration');
const Batch = require('./models/Batch');
const User = require('./models/User');
require('dotenv').config();

const verifyData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const batches = await Batch.find({});
        console.log(`Found ${batches.length} batches.`);
        batches.forEach(b => console.log(`Batch: ${b.batchCode} (${b._id}), Instructor: ${b.instructorId}`));

        const registrations = await Registration.find({});
        console.log(`Found ${registrations.length} registrations.`);
        registrations.forEach(r => {
            console.log(`Reg: ${r.fullName}, Batch: ${r.batchId}, Instructor: ${r.assignedInstructorId}`);
        });

        // Test Management Aggregation
        const managementData = await Registration.aggregate([
            {
                $lookup: {
                    from: 'batches',
                    localField: 'batchId',
                    foreignField: '_id',
                    as: 'batchInfo'
                }
            },
            {
                $unwind: { path: "$batchInfo", preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    fullName: 1,
                    batchCode: '$batchInfo.batchCode',
                    batchId: '$batchInfo._id'
                }
            }
        ]);
        console.log('Management Aggregation Sample:', managementData.slice(0, 3));

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
};

verifyData();
