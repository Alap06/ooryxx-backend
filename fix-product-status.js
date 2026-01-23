#!/usr/bin/env node
/**
 * Script pour corriger les statuts des produits
 * Convertit 'published' en 'active' pour correspondre au modèle
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./src/models/Product');

async function fixProductStatuses() {
    try {
        console.log('🔌 Connexion à MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à la base de données\n');

        // Trouver tous les produits avec status = 'published'
        const productsToUpdate = await Product.find({ status: 'published' });

        console.log(`📦 Produits trouvés avec status='published': ${productsToUpdate.length}`);

        if (productsToUpdate.length === 0) {
            console.log('✅ Aucun produit à mettre à jour');
            await mongoose.connection.close();
            return;
        }

        console.log('\n🔧 Mise à jour des statuts...\n');

        // Mettre à jour chaque produit
        for (const product of productsToUpdate) {
            console.log(`  📝 Mise à jour: ${product.title}`);
            console.log(`     - Ancien status: ${product.status}`);
            console.log(`     - isPublished: ${product.isPublished}`);
            console.log(`     - stock: ${product.stock}`);

            product.status = 'active';

            // S'assurer que isPublished est true
            if (!product.isPublished) {
                product.isPublished = true;
                console.log(`     ✓ isPublished mis à true`);
            }

            await product.save();
            console.log(`     ✓ Nouveau status: ${product.status}\n`);
        }

        console.log('='.repeat(60));
        console.log(`✅ ${productsToUpdate.length} produit(s) mis à jour avec succès!`);
        console.log('='.repeat(60));

        // Afficher un résumé
        const activeProducts = await Product.find({
            status: 'active',
            isPublished: true,
            stock: { $gt: 0 }
        });

        console.log(`\n📊 Résumé:`);
        console.log(`   ✓ Produits actifs, publiés et en stock: ${activeProducts.length}`);

        await mongoose.connection.close();
        console.log('\n✅ Déconnecté');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error(error);
        process.exit(1);
    }
}

fixProductStatuses();
