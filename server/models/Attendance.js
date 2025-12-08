const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    studentRegistrationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Registration',
        required: true
    },
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent'],
        required: true
    },
    programLevel: {
        type: String,
        required: true
    },
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
attendanceSchema.index({ studentRegistrationId: 1, programLevel: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
