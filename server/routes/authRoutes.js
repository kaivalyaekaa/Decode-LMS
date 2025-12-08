const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/login', authController.login);
router.post('/verify-otp', authController.verifyOtp);

// Protected routes
router.get('/verify', authMiddleware, authController.verifyToken);
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;