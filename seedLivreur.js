const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const Livreur = require('./src/models/Livreur');
const Order = require('./src/models/Order');
const Product = require('./src/models/Product');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ooryxx')
    .then(() => console.log('✅ Connecté à MongoDB'))
    .catch(err => {
        console.error('❌ Erreur connexion MongoDB:', err);
        process.exit(1);
    });

async function seedLivreur() {
    try {
        console.log('\n🛵 GÉRÉRATION DU COMPTE LIVREUR DE TEST...\n');

        // 1. Create Livreur User
        console.log('1️⃣  Création du compte utilisateur...');
        await User.deleteMany({ email: 'livreur@test.com' });

        const livreurUser = await User.create({
            email: 'livreur@test.com',
            password: 'Password123!',
            firstName: 'Sami',
            lastName: 'Livreur',
            role: 'livreur',
            phoneNumber: '+21622334455',
            isEmailVerified: true
        });
        console.log(`   ✅ Utilisateur créé: ${livreurUser.email} / Password123!`);

        // 2. Create Livreur Profile
        console.log('\n2️⃣  Création du profil livreur...');
        await Livreur.deleteMany({ userId: livreurUser._id });

        const livreurProfile = await Livreur.create({
            userId: livreurUser._id,
            vehicleType: 'moto',
            licensePlate: '123 TUN 4567',
            zone: 'Tunis',
            isAvailable: true,
            status: 'approved',
            stats: {
                totalDeliveries: 15,
                successfulDeliveries: 14,
                failedDeliveries: 1,
                averageDeliveryTime: 25,
                rating: 4.8
            }
        });
        console.log(`   ✅ Profil créé pour: ${livreurUser.firstName} ${livreurUser.lastName}`);

        // 3. Update/Create Orders for Testing
        console.log('\n3️⃣  Assignation de commandes de test...');

        let orders = await Order.find({}).limit(3);

        if (orders.length < 3) {
            console.log('   ⚠️ Pas assez de commandes existantes. Création de nouvelles commandes...');

            // Ensure we have a product
            const product = await mongoose.model('Product').findOne({});
            if (!product) {
                console.log('   ⚠️ Aucun produit trouvé. Impossible de créer des commandes.');
                process.exit(1);
            }

            // Create new orders
            const orderPromises = [];
            const statuses = ['assigned_to_delivery', 'picked_up', 'delivered'];

            for (let i = 0; i < 3; i++) {
                orderPromises.push(Order.create({
                    userId: livreurUser._id, // Assign to livreur user just for placeholder (normally client)
                    items: [{
                        productId: product._id,
                        title: product.title,
                        price: product.price,
                        quantity: 1,
                        subtotal: product.price
                    }],
                    totalAmount: product.price + 7,
                    shippingAddress: {
                        recipientName: `Client Test ${i + 1}`,
                        street: `${i * 10} Rue Test`,
                        city: 'Tunis',
                        postalCode: '1000',
                        country: 'Tunisie',
                        phone: '20123456'
                    },
                    subtotal: product.price,
                    paymentMethod: 'cash_on_delivery',
                    status: statuses[i]
                }));
            }

            orders = await Promise.all(orderPromises);
        }

        const statuses = ['assigned_to_delivery', 'picked_up', 'delivered'];

        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            const status = statuses[i % statuses.length];

            order.livreurId = livreurUser._id;
            order.status = status;
            order.assignedToLivreurAt = new Date();

            // Generate delivery code if missing
            if (!order.deliveryCode) {
                order.deliveryCode = `LIV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            }

            if (status === 'picked_up' || status === 'delivered') {
                order.pickedUpAt = new Date(Date.now() - 3600000); // 1 hour ago
            }

            if (status === 'delivered') {
                order.deliveredAt = new Date();
                // Add to livreur profile history implicitly via stats, but good to remove from currentOrders
                // We only add assigned/picked_up to currentOrders
            } else {
                livreurProfile.currentOrders.push(order._id);
            }

            await order.save();
            console.log(`   📦 Commande ${order.orderNumber} (${order.deliveryCode}) -> ${status}`);
        }

        await livreurProfile.save();

        console.log('\n✅ ===== SUCCÈS =====\n');
        console.log(`Compte: livreur@test.com`);
        console.log(`Mot de passe: Password123!`);
        console.log(`Commandes assignées: ${orders.length}`);
        console.log(`\nPour tester le QR Code, utilisez les codes:`);
        orders.forEach(o => console.log(`- ${o.orderNumber}: ${o.deliveryCode}`));
        console.log('\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

seedLivreur();
