const express = require('express');
const router = express.Router();
const managementController = require('../controllers/managementController');
const authMiddleware = require('../middleware/authMiddleware');

const authorize = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

router.use(authorize('management'));

// Student overview routes
router.get('/registrations/all', managementController.getAllRegistrationsStatus);
router.get('/registrations/eligible', managementController.getEligibleRegistrations);

// Certificate routes
router.get('/certificates', managementController.getIssuedCertificates);
router.post('/approve-certificate', managementController.approveCertificate);
router.post('/reject-certificate', managementController.rejectCertificate); // New rejection route
router.post('/resend-certificate', managementController.resendCertificate);
router.post('/certificate/revoke', managementController.revokeCertificate);

// Statistics
router.get('/statistics', managementController.getDashboardStatistics);

// Batch Management
router.get('/batches', managementController.getAllBatches);
router.get('/batches/:batchId/students', managementController.getStudentsByBatch);
router.get('/batches/:batchId/certificates-zip', managementController.downloadBatchCertificates);

// Template Management
router.post('/templates', managementController.createTemplate);
router.get('/templates', managementController.getTemplates);
router.post('/templates/set-active', managementController.setActiveTemplate);

module.exports = router;
