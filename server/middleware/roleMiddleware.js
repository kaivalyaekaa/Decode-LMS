const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: 'Unauthorized. Role not found.' });
        }

        const userRole = req.user.role.toLowerCase();
        const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());

        if (normalizedAllowedRoles.includes(userRole)) {
            next();
        } else {
            res.status(403).json({ message: `Access denied. Requires one of: ${allowedRoles.join(', ')}` });
        }
    };
};

module.exports = authorize;
