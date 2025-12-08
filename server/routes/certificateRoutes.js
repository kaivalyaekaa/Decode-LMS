const express = require('express');
const router = express.Router();
const managementController = require('../controllers/managementController');

// Public certificate verification route (no auth required)
router.get('/verify/:certificateNumber', managementController.verifyCertificate);

module.exports = router;
