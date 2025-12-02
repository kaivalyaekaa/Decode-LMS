const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Login for all 3 roles
exports.login = async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Validate required fields
        if (!username || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, and role are required'
            });
        }

        // Validate role
        const validRoles = ['instructor', 'finance', 'management', 'registration_admin'];
        if (!validRoles.includes(role.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be instructor, finance, management, or registration_admin'
            });
        }

        const normalizedUsername = username.toLowerCase().trim();
        const normalizedRole = role.toLowerCase().trim();

        console.log('Login attempt:', { username: normalizedUsername, role: normalizedRole });

        // Find user by username and role
        const user = await User.findOne({
            username: normalizedUsername,
            role: normalizedRole,
            isActive: true
        });

        if (!user) {
            console.log('User not found or inactive:', { username: normalizedUsername, role: normalizedRole });
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials or role'
            });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('Invalid password for user:', normalizedUsername);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                role: user.role,
                fullName: user.fullName,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Login successful:', { username: user.username, role: user.role });

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
        console.error("Login error:", error);
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
