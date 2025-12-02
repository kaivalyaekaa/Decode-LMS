const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    cityCountry: {
        type: String,
        required: true
    },
    region: {
        type: String,
        enum: ['IN', 'US', 'UAE'],
        default: 'IN' // Default to India
    },
    programLevel: {
        type: String,
        required: true,
        enum: ['Level 1 – Decode Your Mind', 'Level 2 – Decode Your Behavior', 'Level 3 – Decode Your Relationship', 'Level 4 – Decode Your Blueprint']
    },
    referralSource: {
        type: String
    },
    referrerName: {
        type: String
    },
    mode: {
        type: String,
        required: true,
        enum: ['Online', 'Offline']
    },
    assignedInstructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
        default: null
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Emergency Override'],
        default: 'Pending'
    },
    paymentMode: {
        type: String,
        enum: ['Online', 'Offline', null],
        default: null
    },
    transactionId: {
        type: String
    },
    certificateStatus: {
        type: String,
        enum: ['Pending', 'Issued', 'Revoked'],
        default: 'Pending'
    },
    certificateIssuedDate: {
        type: Date
    },
    managementNotes: {
        type: String
    }
});

module.exports = mongoose.model('Registration', registrationSchema);
