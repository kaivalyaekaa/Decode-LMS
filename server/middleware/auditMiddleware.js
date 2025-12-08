const AuditLog = require('../models/AuditLog');

const auditLogger = (action, resource) => {
    return async (req, res, next) => {
        // Capture the original send function to intercept the response
        const originalSend = res.send;
        let responseBody;

        res.send = function (body) {
            responseBody = body;
            originalSend.apply(res, arguments);
        };

        res.on('finish', async () => {
            try {
                if (!req.user) return; // Only log authenticated actions

                const logEntry = new AuditLog({
                    userId: req.user.userId,
                    userEmail: req.user.email || 'unknown', // Assuming email is in token or fetched
                    role: req.user.role,
                    action: action,
                    resource: resource,
                    resourceId: req.params.id || req.body._id || null,
                    details: {
                        method: req.method,
                        url: req.originalUrl,
                        body: req.method !== 'GET' ? req.body : undefined, // Log body for non-GET
                        query: req.query,
                        statusCode: res.statusCode
                    },
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('User-Agent'),
                    status: res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS'
                });

                await logEntry.save();
            } catch (error) {
                console.error('Audit Logging Error:', error);
            }
        });

        next();
    };
};

module.exports = auditLogger;
