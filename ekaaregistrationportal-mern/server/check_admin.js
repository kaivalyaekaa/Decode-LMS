const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

async function checkAdminCredentials() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    try {
        const admin = await User.findOne({ role: 'registration_admin' });
        if (admin) {
            console.log('Admin user found:');
            console.log(`Username: ${admin.username}`);
            console.log(`Full Name: ${admin.fullName}`);
            console.log(`Email: ${admin.email}`);
            console.log(`Role: ${admin.role}`);
            console.log(`Active: ${admin.isActive}`);
        } else {
            console.log('No registration_admin user found');
        }

        // Check all users
        const allUsers = await User.find({});
        console.log(`\n=== All Users (${allUsers.length}) ===`);
        allUsers.forEach(user => {
            console.log(`\n${user.fullName}`);
            console.log(`  Username: ${user.username}`);
            console.log(`  Role: ${user.role}`);
            console.log(`  Active: ${user.isActive}`);
        });

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n=== COMPLETE ===');
    }
}

checkAdminCredentials();
