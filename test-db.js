const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('🔄 Test de connexion à MongoDB Atlas...\n');
    console.log('URI:', process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@'));
    
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('\n✅ Connexion réussie!');
    console.log('📍 Host:', conn.connection.host);
    console.log('📦 Database:', conn.connection.name);
    console.log('🔌 État:', conn.connection.readyState === 1 ? 'Connecté' : 'Déconnecté');
    
    // Tester une opération simple
    console.log('\n🔄 Test d\'une opération sur la base...');
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('📚 Collections trouvées:', collections.length);
    if (collections.length > 0) {
      console.log('   Collections:', collections.map(c => c.name).join(', '));
    } else {
      console.log('   Aucune collection (base vide)');
    }
    
    // Stats de la base
    const stats = await conn.connection.db.stats();
    console.log('\n📊 Statistiques de la base:');
    console.log('   Taille des données:', (stats.dataSize / 1024).toFixed(2), 'KB');
    console.log('   Nombre de documents:', stats.objects);
    console.log('   Nombre de collections:', stats.collections);
    
    await mongoose.connection.close();
    console.log('\n✅ Test terminé avec succès!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Erreur de connexion:');
    console.error('Message:', error.message);
    
    if (error.message.includes('IP')) {
      console.error('\n💡 Solution:');
      console.error('   1. Allez sur https://cloud.mongodb.com/');
      console.error('   2. Network Access → Add IP Address');
      console.error('   3. Ajoutez 0.0.0.0/0 (tous les IPs) pour le dev');
    }
    
    if (error.message.includes('authentication')) {
      console.error('\n💡 Solution:');
      console.error('   Vérifiez votre mot de passe dans le fichier .env');
      console.error('   MONGODB_URI=mongodb+srv://username:PASSWORD@...');
    }
    
    process.exit(1);
  }
};

testConnection();
