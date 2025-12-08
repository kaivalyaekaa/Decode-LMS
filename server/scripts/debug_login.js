const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const connectDB = require('../config/db');

const debugLogin = async () => {
    try {
        await connectDB();

        console.log('--- DEBUG START ---');

        const username = 'admin';
        const role = 'registration_admin';
        const password = 'adminpassword123';

        console.log(`Checking for User: ${username}, Role: ${role}`);

        const user = await User.findOne({
            username: username,
            role: role
        });

        if (!user) {
            console.log('❌ User NOT FOUND in database.');
            const anyUser = await User.findOne({ username: username });
            if (anyUser) {
                console.log(`⚠️ User found but with different role: ${anyUser.role}`);
            } else {
                console.log('No user found with that username at all.');
            }
        } else {
            console.log('✅ User FOUND.');
            console.log('User Details:', {
                id: user._id,
                username: user.username,
                role: user.role,
                isActive: user.isActive,
                hash: user.password.substring(0, 10) + '...'
            });

            console.log('Testing Password...');
            const isMatch = await bcrypt.compare(password, user.password);

            if (isMatch) {
                console.log('✅ Password VALID.');
            } else {
                console.log('❌ Password INVALID.');
            }
        }

        console.log('--- DEBUG END ---');
        process.exit(0);
    } catch (error) {
        console.error('Debug Error:', error);
        process.exit(1);
    }
};

debugLogin();
