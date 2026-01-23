const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Assurez-vous que bcryptjs est installé
require('dotenv').config();

// Chargement des modèles
const User = require('./src/models/User'); // Adaptez le chemin si nécessaire
const Product = require('./src/models/Product');
const Vendor = require('./src/models/Vendor');
const Order = require('./src/models/Order'); // Si besoin

// --- MINI-FAKER (Générateur de données aléatoires) ---
const TITLES_ADJS = ['Super', 'Ultra', 'Mega', 'Hyper', 'Pro', 'Max', 'Eco', 'Smart', 'Luxury', 'Premium'];
const TITLES_NOUNS = ['Phone', 'Laptop', 'Watch', 'Headphones', 'Camera', 'Speaker', 'Tablet', 'Monitor', 'Keyboard', 'Mouse'];
const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Toys', 'Books', 'Automotive'];
const FIRST_NAMES = ['Ali', 'Sara', 'Mohamed', 'Fatma', 'Omar', 'Hiba', 'Youssef', 'Amira', 'Karim', 'Nour'];
const LAST_NAMES = ['Ben Ali', 'Trabelsi', 'Gharbi', 'Jaziri', 'Mabrouk', 'Hammami', 'Dridi', 'Sassi', 'Bouaziz', 'Mejri'];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomBool = () => Math.random() < 0.5;

function generateProduct() {
    const price = randomInt(50, 2000);
    const hasDiscount = Math.random() < 0.3; // 30% de chance d'avoir une promo

    return {
        title: `${randomItem(TITLES_ADJS)} ${randomItem(TITLES_NOUNS)} ${randomInt(100, 999)}`,
        description: `Un produit ${randomItem(TITLES_ADJS).toLowerCase()} de haute qualité. Idéal pour votre quotidien.`,
        price: price,
        discount: {
            percentage: hasDiscount ? randomInt(5, 50) : 0,
            validUntil: new Date(Date.now() + 86400000 * 30) // +30 jours
        },
        category: randomItem(CATEGORIES),
        stock: randomInt(0, 100), // Peut être 0 (Out of stock)
        images: [{ url: `https://picsum.photos/400?random=${randomInt(1, 1000)}`, alt: 'Product Image' }],
        status: Math.random() < 0.8 ? 'active' : (Math.random() < 0.5 ? 'draft' : 'out_of_stock'), // 80% active
        isPublished: true,
        featured: Math.random() < 0.2, // 20% featured
        rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 à 5.0
        reviewCount: randomInt(0, 50)
    };
}

function generateUser(role, index) {
    const firstName = randomItem(FIRST_NAMES);
    const lastName = randomItem(LAST_NAMES);
    return {
        firstName,
        lastName,
        email: `${role}${index + 1}_${randomInt(1000, 9999)}@test.com`,
        password: 'Password123!', // Sera hashé
        role: role,
        isActive: true,
        isEmailVerified: true,
        phoneNumber: `+216${randomInt(20, 99)}${randomInt(100, 999)}${randomInt(100, 999)}`
    };
}

async function seedLargeData() {
    console.log('🌱 Démarrage du SEEDING MASSIF...');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        // BCRYPT HASH
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Password123!', salt);

        // --- PRÉPARATION CATÉGORIES ---
        console.log('📦 Vérification des catégories...');
        const Category = require('./src/models/Category');
        let categoryDocs = [];

        for (const catName of CATEGORIES) {
            let cat = await Category.findOne({ name: catName });
            if (!cat) {
                cat = await Category.create({
                    name: catName,
                    description: `Catégorie ${catName}`,
                    isActive: true
                });
            }
            categoryDocs.push(cat);
        }

        // --- GÉNÉRATION UTILISATEURS ---

        // 1. Admins (Target: 5+)
        const existingAdmins = await User.countDocuments({ role: 'admin' });
        const adminsNeeded = Math.max(0, 6 - existingAdmins);
        if (adminsNeeded > 0) {
            console.log(`🔨 Création de ${adminsNeeded} Admins...`);
            const admins = Array.from({ length: adminsNeeded }).map((_, i) => ({
                ...generateUser('admin', i + existingAdmins),
                password: hashedPassword
            }));
            await User.insertMany(admins);
        }

        // 2. Moderators (Target: 3+)
        const existingMods = await User.countDocuments({ role: 'moderator' });
        const modsNeeded = Math.max(0, 4 - existingMods);
        if (modsNeeded > 0) {
            console.log(`🔨 Création de ${modsNeeded} Modérateurs...`);
            const mods = Array.from({ length: modsNeeded }).map((_, i) => ({
                ...generateUser('moderator', i + existingMods),
                password: hashedPassword
            }));
            await User.insertMany(mods);
        }

        // 3. Livreurs/Drivers (Target: 15+)
        const existingDrivers = await User.countDocuments({ role: 'livreur' }); // Verifiez le nom exact du rôle (livreur ou driver)
        const driversNeeded = Math.max(0, 16 - existingDrivers);
        if (driversNeeded > 0) {
            console.log(`🔨 Création de ${driversNeeded} Livreurs...`);
            const drivers = Array.from({ length: driversNeeded }).map((_, i) => ({
                ...generateUser('livreur', i + existingDrivers),
                password: hashedPassword
            }));
            // Note: Il faudrait peut-être créer aussi des entrées dans une collection 'Livreur' spécifique si elle existe
            await User.insertMany(drivers);
        }

        // --- GÉNÉRATION VENDEURS ET PRODUITS ---

        // 4. Vendeurs (Target: 20+)
        // On crée des Users role='vendor' ET des documents Vendor associés
        const existingVendors = await User.countDocuments({ role: 'vendor' });
        const vendorsNeeded = Math.max(0, 25 - existingVendors);

        if (vendorsNeeded > 0) {
            console.log(`🔨 Création de ${vendorsNeeded} Vendeurs et leurs produits...`);

            for (let i = 0; i < vendorsNeeded; i++) {
                // Créer User Vendeur
                const vendorUserPayload = {
                    ...generateUser('vendor', i + existingVendors),
                    password: hashedPassword
                };
                const user = await User.create(vendorUserPayload);

                // Créer Profil Vendor
                const vendorProfile = await Vendor.create({
                    userId: user._id,
                    companyInfo: {
                        name: `${vendorUserPayload.lastName} Store`,
                        description: `La boutique officielle de ${vendorUserPayload.lastName}.`,
                        address: {
                            street: `${randomInt(1, 100)} Rue de la République`,
                            city: 'Tunis',
                            postalCode: '1000',
                            country: 'Tunisie'
                        },
                        phone: `+216${randomInt(20, 99)}${randomInt(100, 999)}${randomInt(100, 999)}`,
                        email: `contact@${vendorUserPayload.lastName.toLowerCase().replace(/\s/g, '')}store.com`
                    },
                    status: Math.random() < 0.8 ? 'approved' : (Math.random() < 0.5 ? 'pending' : 'rejected')
                });

                // --- GÉNÉRATION PRODUITS POUR CE VENDEUR ---
                // Chaque vendeur a entre 5 et 10 produits
                if (vendorProfile.status === 'approved') {
                    const productsCount = randomInt(5, 10);
                    const products = Array.from({ length: productsCount }).map(() => ({
                        ...generateProduct(),
                        vendorId: vendorProfile._id,
                        category: randomItem(categoryDocs)._id
                    }));
                    await Product.insertMany(products);
                }
            }
        } else {
            // Si assez de vendeurs, on ajoute juste des produits
            const existingProducts = await Product.countDocuments();
            const productsNeeded = Math.max(0, 100 - existingProducts);
            if (productsNeeded > 0) {
                console.log(`🔨 Ajout de ${productsNeeded} Produits supplémentaires...`);
                // On récupère un vendeur approuvé au hasard
                const vendor = await Vendor.findOne({ status: 'approved' });
                if (vendor) {
                    const products = Array.from({ length: productsNeeded }).map(() => ({
                        ...generateProduct(),
                        vendorId: vendor._id,
                        category: randomItem(categoryDocs)._id
                    }));
                    await Product.insertMany(products);
                }
            }
        }

        console.log('✅ GÉNÉRATION TERMINÉE AVEC SUCCÈS !');

    } catch (error) {
        console.error('❌ Erreur seed:', error);
    } finally {
        await mongoose.connection.close();
    }
}

seedLargeData();
