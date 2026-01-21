require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ooryxx';

async function checkUser() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        console.log('URI:', MONGODB_URI);

        const email = 'livreur1@ooryxx.tn';
        const user = await User.findOne({ email }).select('+password');

        if (user) {
            console.log('Found User:', {
                id: user._id,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                status: user.status,
                passwordHash: user.password ? user.password.substring(0, 10) + '...' : 'MISSING'
            });

            // Test password comparison directly
            const bcrypt = require('bcryptjs');
            const isMatch = await bcrypt.compare('Password123!', user.password);
            console.log('Password Match for "Password123!":', isMatch);
        } else {
            console.log('❌ User not found:', email);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkUser();
