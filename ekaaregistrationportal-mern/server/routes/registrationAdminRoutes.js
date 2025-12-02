const express = require('express');
const router = express.Router();
const registrationAdminController = require('../controllers/registrationAdminController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Check if user is registration admin
const isRegistrationAdmin = (req, res, next) => {
    if (req.user.role !== 'registration_admin') {
        return res.status(403).json({ message: 'Access denied. Registration Admin only.' });
    }
    next();
};

router.use(isRegistrationAdmin);

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

// User management routes
router.get('/users', registrationAdminController.getAllUsers);
router.post('/users', registrationAdminController.createUser);
router.put('/users/:userId', registrationAdminController.updateUser);
router.delete('/users/:userId', registrationAdminController.deleteUser);
router.put('/users/:userId/role', registrationAdminController.assignUserRole);

module.exports = router;