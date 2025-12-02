const mongoose = require('mongoose');
require('dotenv').config();

const PROGRAM_LEVELS = [
    'Level 1 – Decode Your Mind',
    'Level 2 – Decode Your Behavior',
    'Level 3 – Decode Your Relationship',
    'Level 4 – Decode Your Blueprint'
];

const batchSchema = new mongoose.Schema({
    batchCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    programLevel: {
        type: String,
        required: true,
        enum: PROGRAM_LEVELS // Use the same enum as in Registration.js
    },
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    mode: {
        type: String,
        enum: ['Online', 'Offline', 'Hybrid'],
        default: 'Online'
    },
    maxStudents: {
        type: Number,
        default: 30
    },
    currentStudents: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Upcoming', 'Active', 'Completed'],
        default: 'Upcoming'
    },
    totalSessions: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

batchSchema.index({ programLevel: 1, instructorId: 1, status: 1 });

module.exports = mongoose.model('Batch', batchSchema);