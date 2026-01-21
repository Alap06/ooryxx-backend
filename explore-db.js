#!/usr/bin/env node
/**
 * Script pour explorer la base de données MongoDB
 * Usage: node explore-db.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ooryxx';

async function exploreDatabase() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à:', MONGODB_URI);
    console.log('📦 Base de données:', mongoose.connection.name);
    console.log('');

    // Lister toutes les collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Collections disponibles:');
    console.log('='.repeat(50));
    
    for (const collection of collections) {
      const collName = collection.name;
      const count = await mongoose.connection.db.collection(collName).countDocuments();
      console.log(`  📁 ${collName.padEnd(20)} → ${count} document(s)`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n💡 Utilisez les commandes ci-dessous pour explorer:\n');
    console.log('  node explore-db.js users       → Voir tous les utilisateurs');
    console.log('  node explore-db.js products    → Voir tous les produits');
    console.log('  node explore-db.js orders      → Voir toutes les commandes');
    console.log('  node explore-db.js carts       → Voir tous les paniers');
    console.log('');

    // Si un argument est fourni, afficher les données de cette collection
    const collectionName = process.argv[2];
    if (collectionName) {
      console.log(`\n📋 Contenu de la collection "${collectionName}":\n`);
      const docs = await mongoose.connection.db.collection(collectionName).find().limit(10).toArray();
      
      if (docs.length === 0) {
        console.log('   ⚠️  Aucun document trouvé');
      } else {
        docs.forEach((doc, index) => {
          console.log(`\n--- Document #${index + 1} ---`);
          console.log(JSON.stringify(doc, null, 2));
        });
        
        if (docs.length === 10) {
          const total = await mongoose.connection.db.collection(collectionName).countDocuments();
          console.log(`\n... et ${total - 10} autre(s) document(s)`);
        }
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Déconnecté');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

exploreDatabase();
