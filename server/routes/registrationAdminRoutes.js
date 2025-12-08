const express = require('express');
const router = express.Router();
const registrationAdminController = require('../controllers/registrationAdminController');
const authMiddleware = require('../middleware/authMiddleware');
const auditLogger = require('../middleware/auditMiddleware');

const authorize = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Protect all routes with 'registration_admin' role check
router.use(authorize('registration_admin'));

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Registration management routes
router.get('/registrations', registrationAdminController.getAllRegistrations);
router.get('/instructors', registrationAdminController.getAllInstructors);
router.put('/registration/:registrationId', registrationAdminController.updateRegistration);
router.delete('/registration/:registrationId', registrationAdminController.deleteRegistration);
router.post('/assign-instructor', registrationAdminController.assignToInstructor);
router.get('/export', registrationAdminController.exportRegistrations);
router.get('/test', (req, res) => res.json({ message: 'Test route working' }));
router.post('/upload-excel', upload.single('file'), registrationAdminController.uploadExcel);
router.get('/statistics', registrationAdminController.getStatistics);

const auditController = require('../controllers/auditController');

// User management routes
router.get('/users', registrationAdminController.getAllUsers);
router.post('/users', auditLogger('CREATE_USER', 'User'), registrationAdminController.createUser);
router.put('/users/:userId', auditLogger('UPDATE_USER', 'User'), registrationAdminController.updateUser);
router.delete('/users/:userId', auditLogger('DELETE_USER', 'User'), registrationAdminController.deleteUser);
router.put('/users/:userId/role', auditLogger('UPDATE_ROLE', 'User'), registrationAdminController.assignUserRole);

// Audit Logs
router.get('/audit-logs', auditController.getAuditLogs);

module.exports = router;