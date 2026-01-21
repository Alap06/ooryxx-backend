// Script to reset admin password and status
// Run with: node resetAdmin.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
const { MONGODB_URI } = require('./src/config/env');

const resetAdmin = async () => {
    try {
        console.log('Connexion à MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB connecté');

        const email = 'admin@ooryxx.com';
        const password = 'Admin123!';

        console.log(`Recherche de l'utilisateur ${email}...`);
        let admin = await User.findOne({ email });

        if (!admin) {
            console.log('Compte inexistant, création...');
            admin = new User({
                email,
                firstName: 'Admin',
                lastName: 'OORYXX',
                phoneNumber: '+21600000000',
                role: 'admin'
            });
        } else {
            console.log('✅ Compte trouvé:', admin._id);
        }

        // Force update fields
        admin.role = 'admin';
        admin.isActive = true;
        admin.isBlocked = false;
        admin.isEmailVerified = true;
        admin.loginAttempts = 0;
        admin.lockUntil = undefined;

        // Explicitly set password to trigger hashing
        admin.password = password;

        console.log('Sauvegarde du compte...');
        await admin.save();
        console.log('✅ Compte sauvegardé avec succès');

        // Verify hashing manually
        const savedUser = await User.findOne({ email }).select('+password');
        console.log('Mot de passe hashé:', savedUser.password);

        const isMatch = await bcrypt.compare(password, savedUser.password);
        console.log('Test de comparaison mot de passe:', isMatch ? '✅ MATCH' : '❌ NO MATCH');

        if (isMatch) {
            console.log('\n🎉 Admin réinitialisé avec succès!');
            console.log('Email:', email);
            console.log('Password:', password);
        } else {
            console.error('\n❌ Erreur critique: Le mot de passe hashé ne correspond pas!');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
};

resetAdmin();
