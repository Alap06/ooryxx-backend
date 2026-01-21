require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ooryxx';

async function fix() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected');

        const emails = [
            'livreur1@ooryxx.tn',
            'livreur2@ooryxx.tn',
            'livreur3@ooryxx.tn',
            'livreur4@ooryxx.tn',
            'livreur5@ooryxx.tn',
            'vendeur@test.com',
            'admin@test.com',
            'client@test.com'
        ];

        for (const email of emails) {
            const user = await User.findOne({ email });
            if (user) {
                // IMPORTANT: Plain text password. Mongoose middleware will hash it.
                // Do NOT use bcrypt.hash here manually!
                user.password = 'Password123!';
                user.isActive = true;
                user.status = 'active';

                await user.save();
                console.log(`✅ Fixed password for ${email}`);
            } else {
                console.log(`⚠️ Not found: ${email}`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

fix();
