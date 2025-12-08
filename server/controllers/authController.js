const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Login for all 3 roles
const fs = require('fs');
const path = require('path');

// Login for all 3 roles
exports.login = async (req, res) => {
    try {
        const { username, password, role } = req.body;
        console.log('--- LOGIN ATTEMPT ---');
        console.log('Request Payload:', JSON.stringify(req.body, null, 2));

        // Validate required fields
        if (!username || !password || !role) {
            console.log('FAILED: Missing fields');
            return res.status(400).json({
                success: false,
                message: 'Username, password, and role are required'
            });
        }

        // Validate role
        const validRoles = ['instructor', 'finance', 'management', 'registration_admin'];
        if (!validRoles.includes(role.toLowerCase())) {
            console.log(`FAILED: Invalid role '${role}'`);
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be instructor, finance, management, or registration_admin'
            });
        }

        const normalizedUsername = username.toLowerCase().trim();
        const normalizedRole = role.toLowerCase().trim();

        // Find user by username ONLY first to debug role mismatch
        const user = await User.findOne({
            username: normalizedUsername,
            isActive: true
        });

        if (!user) {
            console.log(`FAILED: User '${normalizedUsername}' not found or inactive.`);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials or role'
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log(`FAILED: Invalid password for '${normalizedUsername}'`);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check Role Mismatch
        if (user.role !== normalizedRole) {
            console.log(`FAILED: Role Mismatch! User has role '${user.role}' but tried to login as '${normalizedRole}'`);
            return res.status(401).json({
                success: false,
                message: `Your account is for '${user.role}', but you selected '${normalizedRole}'. Please switch logic.`
            });
        }

        console.log(`SUCCESS: Password Valid for '${normalizedUsername}'. Sending OTP...`);

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        // Save OTP to User
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        // Send OTP Email
        const { sendOtpEmail } = require('../services/emailService');
        await sendOtpEmail(user.email, otp);

        res.status(200).json({
            success: true,
            message: 'OTP sent to your email',
            mfaRequired: true,
            userId: user._id,
            emailMasked: user.email.replace(/(.{2})(.*)(@.*)/, '$1...$3'),
            devOtp: otp // <--- TEMPORARY: Return OTP to client for debugging
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Verify OTP and Issue Token
exports.verifyOtp = async (req, res) => {
    try {
        const { userId, otp } = req.body;

        if (!userId || !otp) {
            return res.status(400).json({ success: false, message: 'User ID and OTP are required' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP has expired' });
        }

        // OTP Valid - Clear it
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Generate JWT token with RS256
        const privateKey = fs.readFileSync(path.join(__dirname, '../config/private.key'), 'utf8');
        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                role: user.role,
                fullName: user.fullName,
                email: user.email
            },
            privateKey,
            { algorithm: 'RS256', expiresIn: '24h' }
        );

        // Update Login History
        user.loginHistory.push({
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            date: new Date()
        });
        await user.save();

        // Audit Log for Login
        const AuditLog = require('../models/AuditLog');
        await AuditLog.create({
            userId: user._id,
            userEmail: user.email,
            role: user.role,
            action: 'LOGIN',
            resource: 'Auth',
            details: { method: 'POST', url: '/api/auth/verify-otp' },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            status: 'SUCCESS'
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("OTP Verification error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Verify token
exports.verifyToken = async (req, res) => {
    try {
        // If middleware passed, token is valid
        res.status(200).json({
            success: true,
            message: 'Token is valid',
            user: req.user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Create new user (for initial setup - can be protected later)
exports.createUser = async (req, res) => {
    try {
        const { username, password, role, fullName, email } = req.body;

        // Validate required fields
        if (!username || !password || !role || !fullName || !email) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate role
        const validRoles = ['instructor', 'finance', 'management', 'registration_admin'];
        if (!validRoles.includes(role.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { username: username.toLowerCase() },
                { email: email.toLowerCase() }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            username: username.toLowerCase(),
            password: hashedPassword,
            role: role.toLowerCase(),
            fullName,
            email: email.toLowerCase()
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Create user error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Get current user's info
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error("Get current user error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
