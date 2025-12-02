const express = require('express');
const router = express.Router();
const managementController = require('../controllers/managementController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Check if user is management
const isManagement = (req, res, next) => {
    if (req.user.role !== 'management') {
        return res.status(403).json({ message: 'Access denied. Management only.' });
    }
    next();
};

router.use(isManagement);

// Student overview routes
router.get('/registrations/all', managementController.getAllRegistrationsStatus);
router.get('/registrations/eligible', managementController.getEligibleRegistrations);

// Certificate routes
router.get('/certificates', managementController.getIssuedCertificates);
router.post('/certificate/approve', managementController.approveCertificate);
router.post('/certificate/resend-email', managementController.resendCertificateEmail);
router.post('/certificate/revoke', managementController.revokeCertificate);

// Statistics
router.get('/statistics', managementController.getDashboardStatistics);

// Template Management
router.post('/templates', isManagement, managementController.createTemplate);
router.get('/templates', isManagement, managementController.getTemplates);
router.post('/templates/set-active', isManagement, managementController.setActiveTemplate);

module.exports = router;
