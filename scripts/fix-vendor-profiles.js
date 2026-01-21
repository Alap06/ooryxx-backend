const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('../src/models/User');
const Vendor = require('../src/models/Vendor');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ooryxx')
    .then(async () => {
        console.log('✅ Connecté à MongoDB');

        try {
            // Find all users with role 'vendor'
            const vendorUsers = await User.find({ role: 'vendor' });
            console.log(`\n📋 Trouvé ${vendorUsers.length} utilisateurs vendeurs\n`);

            let created = 0;
            let skipped = 0;

            for (const user of vendorUsers) {
                // Check if vendor profile exists
                const existingVendor = await Vendor.findOne({ userId: user._id });

                if (existingVendor) {
                    console.log(`⊘ Profil vendeur existe déjà pour: ${user.email}`);
                    skipped++;
                    continue;
                }

                // Create vendor profile
                const companyName = `${user.firstName} ${user.lastName}`.trim() || 'Mon Entreprise';
                const vendor = await Vendor.create({
                    userId: user._id,
                    companyInfo: {
                        name: companyName,
                        description: `Bienvenue chez ${companyName}`,
                        address: {
                            street: '123 Rue Principale',
                            city: 'Tunis',
                            postalCode: '1000',
                            country: 'Tunisie'
                        },
                        phone: user.phoneNumber || '+216 70 000 000',
                        email: user.email
                    },
                    status: 'approved',
                    isActive: true,
                    stats: {
                        totalSales: 0,
                        totalOrders: 0,
                        totalProducts: 0,
                        rating: 0,
                        reviewCount: 0
                    }
                });

                console.log(`✓ Profil vendeur créé pour: ${user.email} (${companyName})`);
                created++;
            }

            console.log('\n=== RÉSUMÉ ===');
            console.log(`✓ ${created} profils vendeur créés`);
            console.log(`⊘ ${skipped} profils existants ignorés`);

            // List all vendor profiles now
            console.log('\n=== TOUS LES VENDEURS ===');
            const allVendors = await Vendor.find({}).populate('userId', 'email firstName lastName');
            allVendors.forEach(v => {
                console.log(`  - ${v.companyInfo?.name}: ${v.userId?.email} (status: ${v.status})`);
            });

            process.exit(0);
        } catch (error) {
            console.error('❌ Erreur:', error);
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('❌ Erreur connexion MongoDB:', err);
        process.exit(1);
    });
