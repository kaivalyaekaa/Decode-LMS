const mongoose = require('mongoose');

const certificateTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    htmlContent: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure only one template is active at a time
certificateTemplateSchema.pre('save', async function (next) {
    if (this.isActive) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id } },
            { $set: { isActive: false } }
        );
    }
    next();
});

module.exports = mongoose.model('CertificateTemplate', certificateTemplateSchema);
