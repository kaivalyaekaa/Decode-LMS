const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const authMiddleware = require('../middleware/authMiddleware');

// Public route
router.post('/', registrationController.createRegistration);
router.post('/student-login', registrationController.studentLogin);

// Protected routes (require authentication)
router.get('/registrations', authMiddleware, registrationController.getRegistrations);
router.delete('/registration/:id', authMiddleware, registrationController.deleteRegistration);
router.get('/export-excel', authMiddleware, registrationController.exportRegistrations);

module.exports = router;
