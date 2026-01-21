// utils/encryption.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class EncryptionService {
  // Hacher le mot de passe
  static async hashPassword(password) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return await bcrypt.hash(password, rounds);
  }
  
  // Vérifier le mot de passe
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }
  
  // Générer un token sécurisé
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
  
  // Chiffrer des données sensibles
  static encrypt(text, key = process.env.ENCRYPTION_KEY) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }
  
  // Déchiffrer des données
  static decrypt(text, key = process.env.ENCRYPTION_KEY) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = textParts.join(':');
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

module.exports = EncryptionService;