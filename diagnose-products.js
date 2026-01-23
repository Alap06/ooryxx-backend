#!/usr/bin/env node
/**
 * Script pour diagnostiquer et réparer les produits dans la base
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function diagnoseProducts() {
    try {
        console.log('🔌 Connexion à MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à la base de données\n');

        // Récupérer tous les produits directement sans validation Mongoose
        const db = mongoose.connection.db;
        const productsCollection = db.collection('products');

        const allProducts = await productsCollection.find({}).toArray();

        console.log(`📦 Total de produits trouvés: ${allProducts.length}\n`);

        if (allProducts.length === 0) {
            console.log('ℹ️  Aucun produit dans la base de données');
            console.log('💡 Vous devez créer des produits d\'abord\n');
            await mongoose.connection.close();
            return;
        }

        // Analyser chaque produit
        for (let i = 0; i < allProducts.length; i++) {
            const product = allProducts[i];
            console.log(`\n${'='.repeat(60)}`);
            console.log(`📝 Produit #${i + 1}: ${product.title || 'Sans titre'}`);
            console.log(`${'='.repeat(60)}`);
            console.log(`   ID: ${product._id}`);
            console.log(`   Status: ${product.status}`);
            console.log(`   isPublished: ${product.isPublished}`);
            console.log(`   Stock: ${product.stock}`);
            console.log(`   Price: ${product.price}`);
            console.log(`   Rating: ${JSON.stringify(product.rating)}`);
            console.log(`   Category: ${product.category}`);
            console.log(`   VendorId: ${product.vendorId}`);
        }

        // Compter les produits par statut
        console.log(`\n\n${'='.repeat(60)}`);
        console.log('📊 STATISTIQUES DES PRODUITS');
        console.log(`${'='.repeat(60)}`);

        const statusCounts = await productsCollection.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]).toArray();

        console.log('\nPar statut:');
        statusCounts.forEach(stat => {
            console.log(`   ${stat._id || 'undefined'}: ${stat.count} produit(s)`);
        });

        const publishedCount = await productsCollection.countDocuments({ isPublished: true });
        const unpublishedCount = await productsCollection.countDocuments({ isPublished: false });

        console.log('\nPar publication:');
        console.log(`   Publiés: ${publishedCount}`);
        console.log(`   Non publiés: ${unpublishedCount}`);

        const inStockCount = await productsCollection.countDocuments({ stock: { $gt: 0 } });
        const outOfStockCount = await productsCollection.countDocuments({ stock: { $lte: 0 } });

        console.log('\nPar stock:');
        console.log(`   En stock: ${inStockCount}`);
        console.log(`   Épuisé: ${outOfStockCount}`);

        console.log(`\n${'='.repeat(60)}`);
        console.log('🔧 MISE À JOUR NÉCESSAIRE');
        console.log(`${'='.repeat(60)}`);

        // Mettre à jour directement avec la collection MongoDB (sans validation Mongoose)
        const updateResult = await productsCollection.updateMany(
            { status: 'published' },
            {
                $set: {
                    status: 'active',
                    isPublished: true
                }
            }
        );

        console.log(`\n✅ ${updateResult.modifiedCount} produit(s) mis à jour`);
        console.log('   Status: published → active');
        console.log('   isPublished: true');

        // Vérifier les résultats après mise à jour
        const activeCount = await productsCollection.countDocuments({ status: 'active' });
        const activePublishedInStock = await productsCollection.countDocuments({
            status: 'active',
            isPublished: true,
            stock: { $gt: 0 }
        });

        console.log(`\n${'='.repeat(60)}`);
        console.log('📊 RÉSULTATS APRÈS MISE À JOUR');
        console.log(`${'='.repeat(60)}`);
        console.log(`   Produits avec status='active': ${activeCount}`);
        console.log(`   Produits actifs + publiés + en stock: ${activePublishedInStock}`);
        console.log(`\n💡 L'API /api/products devrait maintenant retourner ${activePublishedInStock} produit(s)\n`);

        await mongoose.connection.close();
        console.log('✅ Déconnecté');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

diagnoseProducts();
