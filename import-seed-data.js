const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://ooryxx_db:ooryxx_ala06@ooryxxdb.bf7e27f.mongodb.net/ooryxx';

// Fonction pour convertir les $oid en ObjectId
function convertObjectIds(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertObjectIds(item));
  }
  
  if (typeof obj === 'object') {
    // Convertir $oid en ObjectId
    if (obj.$oid) {
      return new mongoose.Types.ObjectId(obj.$oid);
    }
    // Convertir $date en Date
    if (obj.$date) {
      return new Date(obj.$date);
    }
    
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = convertObjectIds(value);
    }
    return result;
  }
  
  return obj;
}

async function importData() {
  try {
    console.log('🔗 Connexion à MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB Atlas!\n');

    const db = mongoose.connection.db;
    
    // Lire le fichier JSON
    const dataPath = path.join(__dirname, '..', 'mongodb-seed-data.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);

    // Supprimer les anciennes données et importer les nouvelles
    for (const [collectionName, documents] of Object.entries(data)) {
      if (!Array.isArray(documents)) {
        console.log(`⏭️  Skipping ${collectionName} (not an array)`);
        continue;
      }

      try {
        // Convertir les ObjectIds
        const convertedDocs = convertObjectIds(documents);
        
        // Supprimer les anciennes données
        await db.collection(collectionName).deleteMany({});
        
        // Insérer les nouvelles données
        const result = await db.collection(collectionName).insertMany(convertedDocs);
        console.log(`✅ ${collectionName}: ${result.insertedCount} documents importés`);
      } catch (error) {
        console.error(`❌ Erreur pour ${collectionName}:`, error.message);
      }
    }

    console.log('\n🎉 Import terminé avec succès!');
    console.log('\n📋 Comptes de test:');
    console.log('   Admin: admin@ooryxx.com / password123');
    console.log('   Moderator: moderator@ooryxx.com / password123');
    console.log('   Vendor: vendor1@ooryxx.com / password123');
    console.log('   Livreur: livreur@ooryxx.com / password123');
    console.log('   Client: client1@gmail.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    process.exit(1);
  }
}

importData();
