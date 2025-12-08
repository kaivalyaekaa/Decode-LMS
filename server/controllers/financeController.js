const Registration = require('../models/Registration');
const { sendNotificationEmail } = require('../services/emailService');

// Get all registrations with payment status, with optional region filtering
const getAllRegistrationsPaymentStatus = async (req, res) => {
    try {
        const { region, country, startDate, endDate } = req.query;
        const filter = {};
        if (region) {
            filter.region = region;
        }
        if (country) {
            filter.cityCountry = { $regex: country, $options: 'i' }; // Case-insensitive partial match for City/Country field
        }
        if (startDate || endDate) {
            filter.registrationDate = {};
            if (startDate) filter.registrationDate.$gte = new Date(startDate);
            if (endDate) filter.registrationDate.$lte = new Date(endDate);
        }

        const registrations = await Registration.find(filter)
            .select('fullName email phone paymentStatus paymentMode transactionId programLevel region')
            .sort({ registrationDate: -1 });

        res.json({ success: true, registrations });
    } catch (error) {
        console.error('Error fetching payment status:', error);
        res.status(500).json({ success: false, message: 'Error fetching payment status' });
    }
};

// Update registration payment status (for manual updates by finance team)
const updateRegistrationPayment = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const { paymentStatus, paymentMode, transactionId } = req.body;

        const registration = await Registration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        registration.paymentStatus = paymentStatus;
        registration.paymentMode = paymentMode || null;
        registration.transactionId = transactionId || null;
        await registration.save();

        if (paymentStatus === 'Paid') {
            // Placeholder for sending payment confirmation email
        }

        res.json({ success: true, message: 'Payment status updated successfully', registration });
    } catch (error) {
        console.error('Error updating payment:', error);
        res.status(500).json({ success: false, message: 'Error updating payment' });
    }
};

// --- PAYMENT GATEWAY INTEGRATION STUBS --- //

/**
 * Initiates a payment with Razorpay for registrations in the 'IN' region.
 * This function should be called from the frontend when a user from India proceeds to pay.
 */
/*
const initiateRazorpayPayment = async (req, res) => {
    const { registrationId, amount } = req.body;
    // 1. Find registration and verify details.
    // 2. Create an order with the Razorpay SDK.
    //    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    //    const options = { amount: amount * 100, currency: 'INR', receipt: registrationId };
    //    const order = await razorpay.orders.create(options);
    // 3. Return the order_id to the frontend.
    //    res.json({ success: true, order });
    res.json({ success: true, message: "Razorpay integration point. Logic is commented out." });
};
*/

/**
 * Handles the callback from Razorpay after a payment attempt.
 * Verifies the payment signature and updates the registration status.
 */
/*
const handleRazorpayCallback = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationId } = req.body;
    // 1. Verify the signature from Razorpay.
    //    const body = razorpay_order_id + "|" + razorpay_payment_id;
    //    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest('hex');
    // 2. If signature is valid:
    //    - Find the registration by registrationId.
    //    - Update paymentStatus to 'Paid', set paymentMode to 'Online', and save transactionId.
    //    - Redirect user to a success page.
    // 3. If signature is invalid, handle the failure.
    res.redirect('/payment-success'); // Mock redirect
};
*/

/**
 * Initiates a payment with Network International for registrations in the 'AE' region.
 */
/*
const initiateNetworkPayment = async (req, res) => {
    const { registrationId, amount } = req.body;
    // 1. Logic to create a payment session/order with the Network International gateway.
    // 2. Redirect the user to the Network payment page or return session details to the frontend.
    res.json({ success: true, message: "Network International integration point. Logic is commented out." });
};
*/

/**
 * Handles the callback from Network International after a payment attempt.
 */
/*
const handleNetworkCallback = async (req, res) => {
    // 1. Logic to handle the data returned from Network in the callback.
    // 2. Verify payment status and update the registration in the database accordingly.
    res.redirect('/payment-success'); // Mock redirect
};
*/

const getPaymentStatistics = async (req, res) => {
    try {
        const totalRegistrations = await Registration.countDocuments();
        const paidRegistrations = await Registration.countDocuments({ paymentStatus: 'Paid' });
        res.json({
            success: true, statistics: {
                totalRegistrations,
                paidRegistrations,
                pendingPayments: totalRegistrations - paidRegistrations,
                paymentRate: totalRegistrations > 0 ? ((paidRegistrations / totalRegistrations) * 100).toFixed(2) : 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching statistics' });
    }
};

module.exports = {
    getAllRegistrationsPaymentStatus,
    updateRegistrationPayment,
    getPaymentStatistics
    // Uncomment the following lines when payment gateway logic is implemented
    // initiateRazorpayPayment,
    // handleRazorpayCallback,
    // initiateNetworkPayment,
    // handleNetworkCallback
};