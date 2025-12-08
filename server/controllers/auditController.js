const AuditLog = require('../models/AuditLog');

// Get all audit logs with filtering
const getAuditLogs = async (req, res) => {
    try {
        const { userId, action, startDate, endDate, limit = 100, page = 1 } = req.query;
        const filter = {};

        if (userId) filter.userId = userId;
        if (action) filter.action = action;
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate) filter.timestamp.$lte = new Date(endDate);
        }

        const logs = await AuditLog.find(filter)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .populate('userId', 'fullName email role');

        const total = await AuditLog.countDocuments(filter);

        res.json({
            success: true,
            logs,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ success: false, message: 'Error fetching audit logs' });
    }
};

module.exports = {
    getAuditLogs
};
