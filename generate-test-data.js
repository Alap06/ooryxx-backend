const mongoose = require('mongoose');
require('dotenv').config();

// Import des modèles
const User = require('./src/models/User');
const Vendor = require('./src/models/Vendor');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');
const Category = require('./src/models/Category');

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ooryxx')
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => {
    console.error('❌ Erreur connexion MongoDB:', err);
    process.exit(1);
  });

async function generateTestData() {
  try {
    console.log('\n🔄 Génération des données de test...\n');

    // 1. Créer des catégories
    console.log('1️⃣  Création des catégories...');
    await Category.deleteMany({});
    
    // Supprimer les validateurs de schéma MongoDB s'ils existent
    const collections = ['categories', 'users', 'vendors', 'products', 'orders'];
    for (const collName of collections) {
      try {
        await mongoose.connection.db.command({
          collMod: collName,
          validator: {},
          validationLevel: 'off'
        });
      } catch (e) {
        // Collection n'existe peut-être pas encore
      }
    }
    
    const categories = await Category.create([
      { name: 'Électronique', description: 'Produits électroniques' },
      { name: 'Vêtements', description: 'Mode et vêtements' },
      { name: 'Maison', description: 'Articles pour la maison' },
      { name: 'Sports', description: 'Équipements sportifs' },
      { name: 'Livres', description: 'Livres et magazines' },
      { name: 'Beauté', description: 'Produits de beauté' }
    ]);
    console.log(`   ✅ ${categories.length} catégories créées`);

    // 2. Créer un utilisateur vendeur
    console.log('\n2️⃣  Création utilisateur vendeur...');
    await User.deleteMany({ email: 'vendeur@test.com' });
    
    const vendorUser = await User.create({
      email: 'vendeur@test.com',
      password: 'Password123!',
      firstName: 'Ahmed',
      lastName: 'Vendeur',
      role: 'vendor',
      phoneNumber: '+21620123456',
      isEmailVerified: true
    });
    console.log(`   ✅ Utilisateur vendeur créé: ${vendorUser.email}`);

    // 3. Créer le profil vendeur
    console.log('\n3️⃣  Création profil vendeur...');
    await Vendor.deleteMany({});
    
    const vendor = await Vendor.create({
      userId: vendorUser._id,
      companyInfo: {
        name: 'Tech Store Tunisia',
        description: 'Votre magasin d\'électronique de confiance en Tunisie',
        address: {
          street: '123 Avenue Habib Bourguiba',
          city: 'Tunis',
          postalCode: '1000',
          country: 'Tunisie'
        },
        phone: '+216 71 123 456',
        email: 'contact@techstore.tn',
        website: 'https://techstore.tn'
      },
      status: 'approved',
      isActive: true,
      stats: {
        totalSales: 0,
        totalOrders: 0,
        totalProducts: 0,
        rating: 4.8,
        reviewCount: 42
      }
    });
    console.log(`   ✅ Profil vendeur créé: ${vendor.companyInfo.name}`);

    // 4. Créer des produits
    console.log('\n4️⃣  Création des produits...');
    await Product.deleteMany({});
    
    const products = [];
    const productData = [
      {
        title: 'Smartphone Samsung Galaxy S23',
        description: 'Dernier smartphone Samsung avec écran AMOLED, 128GB',
        price: 2499,
        stock: 25,
        category: categories[0]._id,
        totalSales: 145
      },
      {
        title: 'Laptop HP Pavilion 15',
        description: 'Ordinateur portable Intel i5, 8GB RAM, 512GB SSD',
        price: 2999,
        stock: 15,
        category: categories[0]._id,
        totalSales: 87
      },
      {
        title: 'T-Shirt Nike Sport',
        description: 'T-shirt de sport respirant, plusieurs tailles disponibles',
        price: 89,
        stock: 150,
        category: categories[1]._id,
        totalSales: 234
      },
      {
        title: 'Casque Audio Sony WH-1000XM5',
        description: 'Casque sans fil avec réduction de bruit active',
        price: 1299,
        stock: 30,
        category: categories[0]._id,
        totalSales: 98
      },
      {
        title: 'Montre Connectée Apple Watch',
        description: 'Apple Watch Series 8, GPS, boîtier aluminium',
        price: 1899,
        stock: 12,
        category: categories[0]._id,
        totalSales: 76
      },
      {
        title: 'Chaussures Running Adidas',
        description: 'Chaussures de course légères et confortables',
        price: 349,
        stock: 45,
        category: categories[3]._id,
        totalSales: 156
      },
      {
        title: 'Caméra Canon EOS R6',
        description: 'Appareil photo mirrorless 20MP, 4K vidéo',
        price: 8999,
        stock: 5,
        category: categories[0]._id,
        totalSales: 23
      },
      {
        title: 'Machine à Café Nespresso',
        description: 'Machine à café automatique avec système de capsules',
        price: 699,
        stock: 20,
        category: categories[2]._id,
        totalSales: 112
      },
      {
        title: 'Sac à Dos North Face',
        description: 'Sac à dos de randonnée 30L, résistant à l\'eau',
        price: 449,
        stock: 35,
        category: categories[3]._id,
        totalSales: 89
      },
      {
        title: 'Parfum Chanel N°5',
        description: 'Eau de parfum 100ml, flacon classique',
        price: 599,
        stock: 28,
        category: categories[5]._id,
        totalSales: 67
      }
    ];

    for (const data of productData) {
      const product = await Product.create({
        ...data,
        vendorId: vendor._id,
        images: [
          {
            url: `https://picsum.photos/seed/${Math.random()}/800/600`,
            alt: data.title,
            isPrimary: true
          }
        ],
        status: 'active',
        isPublished: true,
        rating: 4.2 + Math.random() * 0.8,
        reviewCount: Math.floor(Math.random() * 50) + 10
      });
      products.push(product);
    }
    console.log(`   ✅ ${products.length} produits créés`);

    // 5. Créer un utilisateur client pour les commandes
    console.log('\n5️⃣  Création utilisateur client...');
    await User.deleteMany({ email: 'client@test.com' });
    
    const clientUser = await User.create({
      email: 'client@test.com',
      password: 'Password123!',
      firstName: 'Fatma',
      lastName: 'Client',
      role: 'customer',
      phoneNumber: '+21622987654',
      isEmailVerified: true
    });
    console.log(`   ✅ Utilisateur client créé: ${clientUser.email}`);

    // 6. Créer des commandes
    console.log('\n6️⃣  Création des commandes...');
    await Order.deleteMany({ vendorId: vendor._id });
    
    const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const orders = [];

    for (let i = 0; i < 15; i++) {
      const randomProducts = products
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1);

      const items = randomProducts.map(p => ({
        productId: p._id,
        title: p.title,
        image: p.images[0]?.url,
        price: p.price,
        quantity: Math.floor(Math.random() * 3) + 1,
        discount: 0,
        subtotal: p.price * (Math.floor(Math.random() * 3) + 1),
        vendorId: vendor._id
      }));

      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const shippingCost = 7;
      const totalAmount = subtotal + shippingCost;

      const daysAgo = Math.floor(Math.random() * 30);
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);

      const order = await Order.create({
        userId: clientUser._id,
        vendorId: vendor._id,
        items,
        shippingAddress: {
          recipientName: 'Fatma Client',
          phone: '+21622987654',
          street: '45 Rue de la République',
          city: 'Tunis',
          postalCode: '1001',
          country: 'Tunisie'
        },
        subtotal,
        shippingCost,
        totalAmount,
        paymentMethod: 'stripe',
        paymentStatus: 'completed',
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createdAt: orderDate
      });
      orders.push(order);
    }
    console.log(`   ✅ ${orders.length} commandes créées`);

    // 7. Mettre à jour les statistiques du vendeur
    console.log('\n7️⃣  Mise à jour statistiques vendeur...');
    const totalOrders = orders.length;
    const totalProducts = products.length;
    const totalSales = orders
      .filter(o => ['delivered', 'shipped'].includes(o.status))
      .reduce((sum, o) => sum + o.totalAmount, 0);

    await Vendor.findByIdAndUpdate(vendor._id, {
      'stats.totalSales': totalSales,
      'stats.totalOrders': totalOrders,
      'stats.totalProducts': totalProducts
    });
    console.log(`   ✅ Statistiques mises à jour`);

    // Résumé
    console.log('\n✅ ===== DONNÉES DE TEST CRÉÉES =====\n');
    console.log(`📧 Vendeur: vendeur@test.com / Password123!`);
    console.log(`📧 Client:  client@test.com / Password123!`);
    console.log(`\n📊 Statistiques:`);
    console.log(`   • ${categories.length} catégories`);
    console.log(`   • ${products.length} produits`);
    console.log(`   • ${orders.length} commandes`);
    console.log(`   • ${totalSales.toFixed(2)} TND de revenus`);
    console.log(`\n🎯 Pour tester:`);
    console.log(`   1. Se connecter avec vendeur@test.com`);
    console.log(`   2. Aller sur /vendor`);
    console.log(`   3. Voir les statistiques réelles\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  }
}

// Exécuter
generateTestData();
