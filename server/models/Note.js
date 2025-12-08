const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
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
    note: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

noteSchema.index({ studentRegistrationId: 1, instructorId: 1 });

module.exports = mongoose.model('Note', noteSchema);
