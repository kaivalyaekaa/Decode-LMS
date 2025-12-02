require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db'); // Import DB connection

// Import routes
const authRoutes = require('./routes/authRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const financeRoutes = require('./routes/financeRoutes');
const managementRoutes = require('./routes/managementRoutes');
const registrationAdminRoutes = require('./routes/registrationAdminRoutes');
const certificateRoutes = require('./routes/certificateRoutes');

// Connect to database
connectDB();

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors()); // Configure CORS as needed
app.use(express.json()); // Body parser

// Rate limiting for authentication routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiting middleware to API calls only
app.use('/api/auth', authLimiter);

// Serve static files (e.g., PDFs) - Adjust path as necessary
app.use('/certificates', express.static('certificates'));


// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/management', managementRoutes);
app.use('/api/registration-admin', registrationAdminRoutes);
app.use('/api/certificate', certificateRoutes); // Public certificate verification

// Basic route for testing server status
app.get('/', (req, res) => {
    res.json({ message: 'Ekaa Registration Portal API is running!' });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
    console.error('GLOBAL ERROR HANDLER:', err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'An unexpected error occurred. Please try again later.'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));