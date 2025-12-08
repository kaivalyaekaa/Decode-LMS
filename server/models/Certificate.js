const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
    studentRegistrationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Registration', // Changed from Student
        required: true
    },
    certificateNumber: {
        type: String,
        required: true,
        unique: true
    },
    programLevel: { // Changed from programName + levelsCompleted
        type: String,
        required: true
    },
    issueDate: {
        type: Date,
        required: true
    },
    certificateUrl: {
        type: String,
        required: true
    },
    digitalSignatureHash: {
        type: String,
        required: false
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    emailStatus: {
        sent: {
            type: Boolean,
            default: false
        },
        sentDate: Date,
        recipientEmail: String
    },
    validationUrl: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Certificate', certificateSchema);
