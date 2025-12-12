
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const connectDB = require('../config/db');

const fixUser = async () => {
    try {
        await connectDB();

        // Find by ID to be sure (from previous output) or by case-insensitive regex
        const user = await User.findOne({ username: { $regex: /^regadmin$/i } });

        if (!user) {
            console.log('User regadmin not found.');
            process.exit(1);
        }

        console.log(`Found user: ${user.username}`);

        // Update username to lowercase
        user.username = 'regadmin';

        // Reset password to 'regadmin123'
        const hashedPassword = await bcrypt.hash('regadmin123', 10);
        user.password = hashedPassword;

        await user.save();

        console.log('User updated successfully:');
        console.log(`Username: ${user.username}`);
        console.log(`New Password: regadmin123`);

        process.exit(0);
    } catch (error) {
        console.error('Error fixing user:', error);
        process.exit(1);
    }
};

fixUser();
