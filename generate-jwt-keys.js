#!/usr/bin/env node

/**
 * Générateur de clés JWT sécurisées
 * Utilisation: node generate-jwt-keys.js
 */

const crypto = require('crypto');

/**
 * Génère une clé aléatoire sécurisée
 * @param {number} length - Longueur de la clé (défaut: 64)
 * @returns {string} Clé générée
 */
function generateSecureKey(length = 64) {
  // Méthode 1: Hexadécimal (recommandée)
  return crypto.randomBytes(length).toString('hex').substring(0, length);
}

/**
 * Génère une clé avec caractères spéciaux
 * @param {number} length - Longueur de la clé
 * @returns {string} Clé générée
 */
function generateComplexKey(length = 64) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?~';
  let key = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    key += chars[randomIndex];
  }
  
  return key;
}

/**
 * Affiche les clés générées
 */
function displayKeys() {
  console.log('\n🔐 Générateur de Clés JWT Sécurisées\n');
  console.log('═'.repeat(70));
  
  // Méthode Hexadécimale
  console.log('\n📍 Méthode 1: Hexadécimal (Recommandée)\n');
  console.log('JWT_SECRET=' + generateSecureKey(64));
  console.log('JWT_REFRESH_SECRET=' + generateSecureKey(64));
  
  // Méthode Complexe
  console.log('\n📍 Méthode 2: Caractères Complexes\n');
  console.log('JWT_SECRET=' + generateComplexKey(64));
  console.log('JWT_REFRESH_SECRET=' + generateComplexKey(64));
  
  // Méthode Base64
  console.log('\n📍 Méthode 3: Base64\n');
  console.log('JWT_SECRET=' + crypto.randomBytes(48).toString('base64'));
  console.log('JWT_REFRESH_SECRET=' + crypto.randomBytes(48).toString('base64'));
  
  console.log('\n═'.repeat(70));
  console.log('\n✅ Copiez les clés ci-dessus dans votre fichier .env');
  console.log('⚠️  Ne partagez JAMAIS ces clés publiquement!');
  console.log('🔒 Utilisez des clés différentes pour chaque environnement\n');
}

// Exécution
displayKeys();
