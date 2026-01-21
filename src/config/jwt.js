const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRE, JWT_REFRESH_EXPIRE } = require('./env');

/**
 * Génère un access token JWT
 * @param {Object} payload - Données à inclure dans le token
 * @returns {String} - Token JWT
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

/**
 * Génère un refresh token JWT
 * @param {Object} payload - Données à inclure dans le token
 * @returns {String} - Refresh token JWT
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRE });
};

/**
 * Vérifie un access token JWT
 * @param {String} token - Token à vérifier
 * @returns {Object} - Payload décodé
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token invalide ou expiré');
  }
};

/**
 * Vérifie un refresh token JWT
 * @param {String} token - Refresh token à vérifier
 * @returns {Object} - Payload décodé
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Refresh token invalide ou expiré');
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
