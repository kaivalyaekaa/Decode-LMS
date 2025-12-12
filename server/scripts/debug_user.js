
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const checkUser = async () => {
    try {
        await connectDB();
        const username = 'regadmin';
        const user = await User.findOne({ username });

        if (user) {
            console.log(`User '${username}' found:`, JSON.stringify(user, null, 2));
        } else {
            console.log(`User '${username}' NOT found.`);
            // List all users to see what's there
            const allUsers = await User.find({}, 'username role email');
            console.log('Existing users:', JSON.stringify(allUsers, null, 2));
        }
        process.exit(0);
    } catch (error) {
        console.error('Error checking user:', error);
        process.exit(1);
    }
};

checkUser();
