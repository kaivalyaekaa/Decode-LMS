const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const connectDB = require('../config/db');

const seedAdmin = async () => {
    try {
        await connectDB();

        const adminEmail = 'admin@ekaaportal.com';
        const adminUsername = 'admin';
        const adminPassword = 'adminpassword123'; // Change this after first login

        const existingAdmin = await User.findOne({
            $or: [{ email: adminEmail }, { username: adminUsername }]
        });

        if (existingAdmin) {
            console.log('Admin user already exists.');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const newAdmin = new User({
            username: adminUsername,
            email: adminEmail,
            password: hashedPassword,
            fullName: 'Super Admin',
            role: 'registration_admin',
            isActive: true
        });

        await newAdmin.save();
        console.log('Admin user created successfully!');
        console.log(`Username: ${adminUsername}`);
        console.log(`Password: ${adminPassword}`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
