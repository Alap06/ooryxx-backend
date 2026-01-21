/**
 * Script de génération de données de test
 * - 100 utilisateurs (50 vendeurs, 45 clients, 3 admins, 2 modérateurs)
 * - Chaque vendeur a minimum 20 produits
 * - Total: ~1000+ produits
 * 
 * Usage: node src/scripts/seedData.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');

// Configuration
const CONFIG = {
    TOTAL_USERS: 100,
    VENDORS: 50,
    CUSTOMERS: 45,
    ADMINS: 3,
    MODERATORS: 2,
    PRODUCTS_PER_VENDOR: 20,
    DEFAULT_PASSWORD: 'password123'
};

// Données de génération
const FIRST_NAMES = [
    'Mohamed', 'Ahmed', 'Ali', 'Omar', 'Youssef', 'Karim', 'Sami', 'Nabil', 'Fares', 'Amine',
    'Fatma', 'Mariem', 'Salma', 'Ines', 'Amira', 'Nesrine', 'Rania', 'Yasmine', 'Nour', 'Sara',
    'Bilel', 'Wael', 'Khalil', 'Rami', 'Anis', 'Sofien', 'Hatem', 'Walid', 'Mehdi', 'Hedi',
    'Aicha', 'Hana', 'Khadija', 'Olfa', 'Rim', 'Sonia', 'Leila', 'Maha', 'Dorra', 'Raja'
];

const LAST_NAMES = [
    'Ben Ali', 'Trabelsi', 'Bouzid', 'Hamdi', 'Jebali', 'Karoui', 'Maatoug', 'Gharbi', 'Sassi', 'Rezgui',
    'Chaouch', 'Ferchichi', 'Hammami', 'Kchaou', 'Mejri', 'Nasr', 'Saidi', 'Souissi', 'Yahia', 'Zouari',
    'Ammar', 'Belhadj', 'Chatti', 'Dridi', 'Essid', 'Fehri', 'Gueddiche', 'Haddad', 'Ibrahim', 'Jomaa'
];

const COMPANY_NAMES = [
    'TechnoTunis', 'MedMarket', 'SaharaBoutique', 'CarthageShop', 'TunisiaElectro',
    'BazarBled', 'ModeTunisie', 'JasmineStore', 'OliveTreeMart', 'SidiBoushop',
    'KairouanGoods', 'SousseMall', 'DjerbaDeals', 'MonastirMarket', 'SfaxStyle',
    'GabèsGallery', 'TozeurTrends', 'BizerteBoutique', 'NabeulNiche', 'HammametHub',
    'ElectroMaghreb', 'FashionMed', 'HomeDecorTN', 'BeautyPalace', 'SportZoneTN',
    'KidsParadise', 'AutoPartsTN', 'GourmetTunis', 'PetShopMed', 'GardenCenterTN',
    'BookStoreTN', 'MusicWorldTN', 'GameZoneTN', 'ArtGalleryTN', 'JewelryBoxTN',
    'WatchHouseTN', 'BagBoutiqueTN', 'ShoeStoreTN', 'PerfumeShopTN', 'GlassesStoreTN',
    'FurnitureTN', 'AppliancesTN', 'ToolsShopTN', 'CraftCornerTN', 'FabricWorldTN',
    'YarnShopTN', 'OfficeSupplyTN', 'SchoolStoreTN', 'MedicalShopTN', 'PharmaPlusTN'
];

const PRODUCT_TEMPLATES = {
    'Électronique': [
        { base: 'Smartphone', variants: ['Pro', 'Plus', 'Max', 'Lite', 'Ultra'] },
        { base: 'Tablette', variants: ['10"', '12"', 'Mini', 'Pro', 'Air'] },
        { base: 'Ordinateur Portable', variants: ['15"', '17"', 'Gaming', 'Pro', 'Ultra'] },
        { base: 'Écouteurs', variants: ['Bluetooth', 'Sans fil', 'Pro', 'Sport', 'Studio'] },
        { base: 'Montre Connectée', variants: ['Sport', 'Classic', 'Pro', 'Ultra', 'Lite'] },
        { base: 'Télévision', variants: ['32"', '43"', '55"', '65"', '75"'] },
        { base: 'Enceinte', variants: ['Bluetooth', 'Portable', 'Home', 'Mini', 'Pro'] },
        { base: 'Caméra', variants: ['Pro', 'Action', 'Sécurité', 'Web', 'Sport'] }
    ],
    'Mode & Vêtements': [
        { base: 'T-Shirt', variants: ['Basic', 'Premium', 'Sport', 'Vintage', 'Graphique'] },
        { base: 'Jean', variants: ['Slim', 'Regular', 'Skinny', 'Baggy', 'Straight'] },
        { base: 'Veste', variants: ['Cuir', 'Jean', 'Sport', 'Classique', 'Bomber'] },
        { base: 'Robe', variants: ['Été', 'Soirée', 'Casual', 'Maxi', 'Mini'] },
        { base: 'Chemise', variants: ['Classique', 'Casual', 'Lin', 'Oxford', 'Slim'] },
        { base: 'Pull', variants: ['Laine', 'Coton', 'Cachemire', 'Col V', 'Col Rond'] },
        { base: 'Short', variants: ['Sport', 'Casual', 'Jean', 'Cargo', 'Plage'] },
        { base: 'Pantalon', variants: ['Chino', 'Cargo', 'Jogging', 'Habillé', 'Lin'] }
    ],
    'Maison & Déco': [
        { base: 'Lampe', variants: ['de Table', 'de Sol', 'Murale', 'LED', 'Design'] },
        { base: 'Coussin', variants: ['Déco', 'Velours', 'Lin', 'Brodé', 'Géométrique'] },
        { base: 'Tapis', variants: ['Berbère', 'Moderne', 'Rond', 'Shaggy', 'Kilim'] },
        { base: 'Cadre Photo', variants: ['Bois', 'Métal', 'Moderne', 'Vintage', 'Multi'] },
        { base: 'Vase', variants: ['Céramique', 'Verre', 'Moderne', 'Artisanal', 'Design'] },
        { base: 'Miroir', variants: ['Mural', 'Sur Pied', 'Rond', 'Vintage', 'LED'] },
        { base: 'Bougie', variants: ['Parfumée', 'Déco', 'LED', 'Pilier', 'Flottante'] },
        { base: 'Horloge', variants: ['Murale', 'de Table', 'Design', 'Vintage', 'Digital'] }
    ],
    'Beauté & Santé': [
        { base: 'Crème Visage', variants: ['Hydratante', 'Anti-âge', 'Nuit', 'Jour', 'Bio'] },
        { base: 'Parfum', variants: ['Femme', 'Homme', 'Unisexe', 'Intense', 'Light'] },
        { base: 'Rouge à Lèvres', variants: ['Mat', 'Brillant', 'Nude', 'Rouge', 'Rose'] },
        { base: 'Shampoing', variants: ['Normal', 'Sec', 'Gras', 'Anti-pelliculaire', 'Volume'] },
        { base: 'Sérum', variants: ['Visage', 'Cheveux', 'Anti-âge', 'Vitamine C', 'Hydratant'] },
        { base: 'Masque', variants: ['Visage', 'Cheveux', 'Argile', 'Hydratant', 'Purifiant'] },
        { base: 'Huile', variants: ['Argan', 'Coco', 'Olive', 'Essentielle', 'Massage'] },
        { base: 'Brosse', variants: ['Cheveux', 'Visage', 'Corps', 'Électrique', 'Bambou'] }
    ],
    'Sport & Loisirs': [
        { base: 'Ballon', variants: ['Football', 'Basketball', 'Volleyball', 'Rugby', 'Tennis'] },
        { base: 'Raquette', variants: ['Tennis', 'Badminton', 'Squash', 'Ping-pong', 'Padel'] },
        { base: 'Sac Sport', variants: ['Gym', 'Voyage', 'Randonnée', 'Football', 'Yoga'] },
        { base: 'Chaussures', variants: ['Running', 'Football', 'Basketball', 'Fitness', 'Trail'] },
        { base: 'Tapis', variants: ['Yoga', 'Fitness', 'Pilates', 'Stretching', 'Gym'] },
        { base: 'Haltère', variants: ['2kg', '5kg', '10kg', 'Ajustable', 'Set'] },
        { base: 'Vélo', variants: ['Route', 'VTT', 'Ville', 'Électrique', 'Pliable'] },
        { base: 'Gants', variants: ['Boxe', 'Fitness', 'Cyclisme', 'Musculation', 'Gardien'] }
    ],
    'Alimentation': [
        { base: 'Huile d\'Olive', variants: ['Extra Vierge', 'Bio', 'Tunisienne', 'Premium', 'Aromatisée'] },
        { base: 'Miel', variants: ['Romarin', 'Eucalyptus', 'Orange', 'Montagne', 'Bio'] },
        { base: 'Dattes', variants: ['Deglet Nour', 'Allig', 'Khouat', 'Bio', 'Premium'] },
        { base: 'Harissa', variants: ['Traditionnelle', 'Extra Fort', 'Douce', 'Bio', 'Beldi'] },
        { base: 'Café', variants: ['Turc', 'Expresso', 'Bio', 'Décaféiné', 'Aromatisé'] },
        { base: 'Thé', variants: ['Vert', 'Menthe', 'Noir', 'Fruits Rouges', 'Détox'] },
        { base: 'Épices', variants: ['Cumin', 'Coriandre', 'Paprika', 'Ras el Hanout', 'Curry'] },
        { base: 'Confiture', variants: ['Figue', 'Orange', 'Abricot', 'Fraise', 'Rose'] }
    ]
};

const COLORS = ['Rouge', 'Bleu', 'Noir', 'Blanc', 'Vert', 'Gris', 'Rose', 'Beige', 'Marron', 'Orange'];

const PLACEHOLDER_IMAGES = [
    'https://placehold.co/600x600/e2e8f0/475569?text=Produit',
    'https://placehold.co/600x600/fef3c7/92400e?text=Produit',
    'https://placehold.co/600x600/dbeafe/1e40af?text=Produit',
    'https://placehold.co/600x600/dcfce7/166534?text=Produit',
    'https://placehold.co/600x600/fce7f3/9d174d?text=Produit',
    'https://placehold.co/600x600/f3e8ff/7c3aed?text=Produit'
];

// Helpers
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomPrice = () => parseFloat((Math.random() * 500 + 10).toFixed(2));

const generateEmail = (firstName, lastName, index) => {
    const domains = ['gmail.com', 'yahoo.fr', 'outlook.com', 'mail.tn', 'hotmail.com'];
    return `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(' ', '')}${index}@${getRandomElement(domains)}`;
};

const generatePhone = () => {
    const prefixes = ['20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59'];
    return `+216${getRandomElement(prefixes)}${getRandomNumber(100, 999)}${getRandomNumber(100, 999)}`;
};

// Main seed function
async function seedDatabase() {
    try {
        // Connect to MongoDB
        console.log('🔌 Connexion à MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        // Demander confirmation
        console.log('\n⚠️  ATTENTION: Ce script va SUPPRIMER toutes les données existantes!');
        console.log(`📊 Données à créer:`);
        console.log(`   - ${CONFIG.ADMINS} administrateurs`);
        console.log(`   - ${CONFIG.MODERATORS} modérateurs`);
        console.log(`   - ${CONFIG.VENDORS} vendeurs`);
        console.log(`   - ${CONFIG.CUSTOMERS} clients`);
        console.log(`   - ~${CONFIG.VENDORS * CONFIG.PRODUCTS_PER_VENDOR} produits`);
        console.log('\n📝 Démarrage du seed...\n');

        // Clear existing data
        console.log('🗑️  Suppression des données existantes...');
        await Promise.all([
            User.deleteMany({}),
            Vendor.deleteMany({}),
            Product.deleteMany({}),
            Category.deleteMany({}),
            Order.deleteMany({})
        ]);
        console.log('✅ Données supprimées\n');

        // Create categories
        console.log('📁 Création des catégories...');
        const categoryNames = Object.keys(PRODUCT_TEMPLATES);
        const categories = [];

        for (const name of categoryNames) {
            const category = await Category.create({
                name,
                slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                description: `Catégorie ${name}`,
                isActive: true,
                productCount: 0
            });
            categories.push(category);
        }
        console.log(`✅ ${categories.length} catégories créées\n`);

        // Create users
        const users = [];
        const vendors = [];
        let userIndex = 0;

        // Admins
        console.log('👑 Création des administrateurs...');
        for (let i = 0; i < CONFIG.ADMINS; i++) {
            const firstName = getRandomElement(FIRST_NAMES);
            const lastName = getRandomElement(LAST_NAMES);
            const user = await User.create({
                firstName,
                lastName,
                email: i === 0 ? 'admin@ooryxx.com' : generateEmail(firstName, lastName, userIndex),
                password: CONFIG.DEFAULT_PASSWORD,
                phoneNumber: generatePhone(),
                role: 'admin',
                status: 'active',
                isEmailVerified: true
            });
            users.push(user);
            userIndex++;
        }
        console.log(`✅ ${CONFIG.ADMINS} admins créés`);

        // Moderators
        console.log('🛡️  Création des modérateurs...');
        for (let i = 0; i < CONFIG.MODERATORS; i++) {
            const firstName = getRandomElement(FIRST_NAMES);
            const lastName = getRandomElement(LAST_NAMES);
            const user = await User.create({
                firstName,
                lastName,
                email: i === 0 ? 'moderator@ooryxx.com' : generateEmail(firstName, lastName, userIndex),
                password: CONFIG.DEFAULT_PASSWORD,
                phoneNumber: generatePhone(),
                role: 'moderator',
                status: 'active',
                isEmailVerified: true
            });
            users.push(user);
            userIndex++;
        }
        console.log(`✅ ${CONFIG.MODERATORS} modérateurs créés`);

        // Vendors
        console.log('🏪 Création des vendeurs...');
        for (let i = 0; i < CONFIG.VENDORS; i++) {
            const firstName = getRandomElement(FIRST_NAMES);
            const lastName = getRandomElement(LAST_NAMES);
            const companyName = COMPANY_NAMES[i] || `Shop${i + 1}`;

            const user = await User.create({
                firstName,
                lastName,
                email: i === 0 ? 'vendeur@ooryxx.com' : generateEmail(firstName, lastName, userIndex),
                password: CONFIG.DEFAULT_PASSWORD,
                phoneNumber: generatePhone(),
                role: 'vendor',
                status: 'active',
                isEmailVerified: true
            });
            const vendor = await Vendor.create({
                userId: user._id,
                companyInfo: {
                    name: companyName,
                    email: user.email,
                    phone: user.phoneNumber,
                    description: `Bienvenue chez ${companyName}! Découvrez nos produits de qualité.`,
                    address: {
                        street: `${getRandomNumber(1, 100)} Rue de la République`,
                        city: getRandomElement(['Tunis', 'Sfax', 'Sousse', 'Gabès', 'Bizerte', 'Ariana', 'Kairouan', 'Gafsa']),
                        postalCode: `${getRandomNumber(1000, 9000)}`,
                        country: 'Tunisie'
                    }
                },
                status: 'approved',
                isActive: true,
                stats: {
                    totalProducts: 0,
                    totalOrders: 0,
                    totalRevenue: 0,
                    rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
                    reviewCount: getRandomNumber(0, 100)
                }
            });
            vendors.push(vendor);
            userIndex++;

            if ((i + 1) % 10 === 0) {
                console.log(`   📦 ${i + 1}/${CONFIG.VENDORS} vendeurs créés...`);
            }
        }
        console.log(`✅ ${CONFIG.VENDORS} vendeurs créés\n`);

        // Customers
        console.log('👤 Création des clients...');
        for (let i = 0; i < CONFIG.CUSTOMERS; i++) {
            const firstName = getRandomElement(FIRST_NAMES);
            const lastName = getRandomElement(LAST_NAMES);
            const user = await User.create({
                firstName,
                lastName,
                email: i === 0 ? 'client@ooryxx.com' : generateEmail(firstName, lastName, userIndex),
                password: CONFIG.DEFAULT_PASSWORD,
                phoneNumber: generatePhone(),
                role: 'customer',
                status: 'active',
                isEmailVerified: true,
                isVIP: i < 5 // 5 premiers sont VIP
            });
            users.push(user);
            userIndex++;
        }
        console.log(`✅ ${CONFIG.CUSTOMERS} clients créés (dont 5 VIP)\n`);

        // Create products
        console.log('📦 Création des produits...');
        let totalProducts = 0;

        for (const vendor of vendors) {
            const category = getRandomElement(categories);
            const categoryName = category.name;
            const templates = PRODUCT_TEMPLATES[categoryName] || PRODUCT_TEMPLATES['Électronique'];

            for (let p = 0; p < CONFIG.PRODUCTS_PER_VENDOR; p++) {
                const template = getRandomElement(templates);
                const variant = getRandomElement(template.variants);
                const color = getRandomElement(COLORS);

                const title = `${template.base} ${variant} ${color} ${Date.now().toString().slice(-4)}${getRandomNumber(100, 999)}`;
                const price = getRandomPrice();
                const discount = Math.random() > 0.7 ? getRandomNumber(5, 30) : 0;

                await Product.create({
                    vendorId: vendor._id,
                    title,
                    description: `${title} de haute qualité. Livraison rapide partout en Tunisie. Garantie satisfaction.`,
                    price,
                    finalPrice: discount > 0 ? parseFloat((price * (1 - discount / 100)).toFixed(2)) : price,
                    stock: getRandomNumber(0, 100),
                    category: category._id,
                    images: [{
                        url: getRandomElement(PLACEHOLDER_IMAGES),
                        isPrimary: true
                    }],
                    status: 'active',
                    isPublished: true,
                    discount: {
                        percentage: discount,
                        validUntil: discount > 0 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
                    },
                    rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
                    reviewCount: getRandomNumber(0, 50),
                    currency: getRandomElement(['TND', 'EUR', 'USD'])
                });

                totalProducts++;
            }

            // Update vendor stats
            await Vendor.findByIdAndUpdate(vendor._id, {
                'stats.totalProducts': CONFIG.PRODUCTS_PER_VENDOR
            });

            if (totalProducts % 100 === 0) {
                console.log(`   📦 ${totalProducts} produits créés...`);
            }
        }
        console.log(`✅ ${totalProducts} produits créés\n`);

        // Update category product counts
        console.log('📊 Mise à jour des compteurs de catégories...');
        for (const category of categories) {
            const count = await Product.countDocuments({ category: category._id });
            await Category.findByIdAndUpdate(category._id, { productCount: count });
        }
        console.log('✅ Compteurs mis à jour\n');

        // Summary
        console.log('═══════════════════════════════════════════════════');
        console.log('                 ✅ SEED TERMINÉ');
        console.log('═══════════════════════════════════════════════════');
        console.log(`📊 Résumé:`);
        console.log(`   👑 Admins:       ${CONFIG.ADMINS}`);
        console.log(`   🛡️  Modérateurs: ${CONFIG.MODERATORS}`);
        console.log(`   🏪 Vendeurs:     ${CONFIG.VENDORS}`);
        console.log(`   👤 Clients:      ${CONFIG.CUSTOMERS} (dont 5 VIP)`);
        console.log(`   📦 Produits:     ${totalProducts}`);
        console.log(`   📁 Catégories:   ${categories.length}`);
        console.log('───────────────────────────────────────────────────');
        console.log('🔑 Comptes de test:');
        console.log('   📧 admin@ooryxx.com / password123');
        console.log('   📧 moderator@ooryxx.com / password123');
        console.log('   📧 vendeur@ooryxx.com / password123');
        console.log('   📧 client@ooryxx.com / password123');
        console.log('═══════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Connexion MongoDB fermée');
        process.exit(0);
    }
}

// Run
seedDatabase();
