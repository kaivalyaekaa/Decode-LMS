const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

const isFinance = (req, res, next) => {
    if (req.user.role !== 'finance') {
        return res.status(403).json({ message: 'Access denied. Finance only.' });
    }
    next();
};

router.use(isFinance);

// Get all registrations with payment status (can be filtered by region)
router.get('/registrations', financeController.getAllRegistrationsPaymentStatus);

// Manually update a registration's payment details
router.put('/registration/:registrationId/payment', financeController.updateRegistrationPayment);

// Get finance-related statistics
router.get('/statistics', financeController.getPaymentStatistics);


// --- PAYMENT GATEWAY ROUTES (COMMENTED OUT) --- //
/*
// Razorpay (India)
router.post('/pay/razorpay/initiate', financeController.initiateRazorpayPayment);
router.post('/pay/razorpay/callback', financeController.handleRazorpayCallback);

// Network International (UAE)
router.post('/pay/network/initiate', financeController.initiateNetworkPayment);
router.post('/pay/network/callback', financeController.handleNetworkCallback);
*/

module.exports = router;