require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.FRONTEND_URL ? 
  process.env.FRONTEND_URL.replace('3000', '5000') : 
  'http://localhost:5000';

const testEmail = process.env.EMAIL_USER || 'amara.ala404@gmail.com';

console.log('🧪 Test du système de réinitialisation de mot de passe\n');
console.log(`📍 API URL: ${API_URL}/api/auth/forgot-password`);
console.log(`📧 Email de test: ${testEmail}\n`);

async function testForgotPassword() {
  try {
    console.log('📨 Envoi de la demande de réinitialisation...\n');
    
    const response = await axios.post(`${API_URL}/api/auth/forgot-password`, {
      email: testEmail
    });

    console.log('✅ Réponse du serveur:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n📬 Vérifiez votre boîte email:', testEmail);
    console.log('⏰ Le code expire dans 10 minutes\n');
    console.log('🎉 Test réussi ! Le code devrait être envoyé par email.\n');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('❌ Pas de réponse du serveur');
      console.error('Assurez-vous que le backend est démarré sur le port 5000');
      console.error('Commande: cd ooryxx-backend && npm start');
    } else {
      console.error('Erreur:', error.message);
    }
    
    process.exit(1);
  }
}

// Vérifier si le serveur est accessible
async function checkServerHealth() {
  try {
    console.log('🔍 Vérification du serveur...');
    await axios.get(`${API_URL}/api/auth/health`).catch(() => {
      // Essayer une route alternative
      return axios.get(`${API_URL}/`);
    });
    console.log('✅ Serveur accessible\n');
    return true;
  } catch (error) {
    console.log('⚠️  Serveur non accessible');
    console.log('Assurez-vous que le backend est démarré:');
    console.log('  cd ooryxx-backend');
    console.log('  npm start\n');
    return false;
  }
}

async function main() {
  const serverUp = await checkServerHealth();
  
  if (!serverUp) {
    console.log('💡 Démarrez le serveur puis réessayez ce test.');
    process.exit(1);
  }
  
  await testForgotPassword();
}

main();
