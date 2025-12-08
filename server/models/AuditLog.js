const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userEmail: { // Redundant but useful for quick lookup if user is deleted
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true,
        uppercase: true
    },
    resource: {
        type: String,
        required: true
    },
    resourceId: {
        type: String,
        default: null
    },
    details: {
        type: mongoose.Schema.Types.Mixed, // Flexible field for any extra data
        default: {}
    },
    ipAddress: {
        type: String,
        default: ''
    },
    userAgent: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILURE'],
        default: 'SUCCESS'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for faster querying by user, action, or date
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
