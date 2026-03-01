require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
const User = require('./models/User');
const connectDB = require('./config/db');

const seedAdmin = async () => {
    try {
        await connectDB();
        console.log('MongoDB connection SUCCESS');

        // Check if an admin already exists
        const existingAdmin = await Admin.findOne({ mob_num: '1234567890' });
        if (existingAdmin) {
            console.log('Admin already exists. Skipping seed.');
        } else {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const admin = new Admin({
                user_name: 'Super Admin',
                mob_num: '1234567890',
                password: hashedPassword,
                role: 'admin'
            });
            await admin.save();
            console.log('Admin user created: 1234567890 / admin123');
        }

        // Check if a regular user exists
        const existingUser = await User.findOne({ mob_num: '0987654321' });
        if (existingUser) {
            console.log('Demo Test User already exists.');
        } else {
            const hashedUserPassword = await bcrypt.hash('user123', 10);
            const testUser = new User({
                client_id: 'CID' + Math.floor(100000 + Math.random() * 900000),
                user_name: 'Demo Client',
                mob_num: '0987654321',
                password: hashedUserPassword,
                percentage: 10,
                current_balance: 100000,
                role: 'user',
                status: 'active'
            });
            await testUser.save();
            console.log('Demo Client user created: 0987654321 / user123');
        }

        process.exit();
    } catch (error) {
        console.error('Seed setup failed:', error);
        process.exit(1);
    }
};

seedAdmin();
