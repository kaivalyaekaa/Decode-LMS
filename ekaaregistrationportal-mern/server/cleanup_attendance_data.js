const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const dotenv = require('dotenv');

dotenv.config();

async function cleanupAttendanceData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get all attendance records
        const allRecords = await Attendance.find({});
        console.log(`\n📊 Total attendance records in DB: ${allRecords.length}`);

        // Group by studentRegistrationId and date to find duplicates
        const recordMap = new Map();
        const duplicates = [];

        allRecords.forEach(record => {
            const key = `${record.studentRegistrationId}_${record.date.toISOString().split('T')[0]}`;
            if (recordMap.has(key)) {
                duplicates.push(record._id);
                console.log(`⚠️  Duplicate found: ${record.studentRegistrationId} on ${record.date.toISOString().split('T')[0]}`);
            } else {
                recordMap.set(key, record);
            }
        });

        if (duplicates.length > 0) {
            console.log(`\n🗑️  Deleting ${duplicates.length} duplicate records...`);
            const deleteResult = await Attendance.deleteMany({ _id: { $in: duplicates } });
            console.log(`✅ Deleted ${deleteResult.deletedCount} duplicate records`);
        } else {
            console.log('\n✅ No duplicates found');
        }

        // Show summary by student
        const summaryByStudent = await Attendance.aggregate([
            {
                $group: {
                    _id: '$studentRegistrationId',
                    totalSessions: { $sum: 1 },
                    presentCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
                    },
                    absentCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] }
                    }
                }
            },
            {
                $addFields: {
                    attendancePercentage: {
                        $multiply: [
                            { $divide: ['$presentCount', '$totalSessions'] },
                            100
                        ]
                    }
                }
            }
        ]);

        console.log('\n📈 Attendance Summary by Student:');
        console.log('─'.repeat(70));
        summaryByStudent.forEach(s => {
            console.log(`Student ID: ${s._id}`);
            console.log(`  Total Sessions: ${s.totalSessions}`);
            console.log(`  Present: ${s.presentCount}`);
            console.log(`  Absent: ${s.absentCount}`);
            console.log(`  Percentage: ${Math.round(s.attendancePercentage)}%`);
            console.log('─'.repeat(70));
        });

        console.log('\n✅ Cleanup complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

cleanupAttendanceData();
