const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } = require('../config/env');

/**
 * Rate limiter global pour toutes les requêtes
 */
const globalRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: {
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Ne pas limiter les requêtes des admins
    return req.user && req.user.role === 'admin';
  }
});

/**
 * Rate limiter strict pour les routes d'authentification
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives maximum
  message: {
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes'
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter pour les routes de création (POST)
 */
const createRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 créations par minute
  message: {
    message: 'Trop de créations. Veuillez ralentir'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter pour les uploads de fichiers
 */
const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20, // 20 uploads par heure
  message: {
    message: 'Limite d\'upload atteinte. Réessayez dans une heure'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter pour les emails (réinitialisation mot de passe, etc.)
 */
const emailRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // 3 emails par heure
  message: {
    message: 'Trop de demandes d\'email. Veuillez réessayer dans une heure'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter pour les paiements
 */
const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives de paiement
  message: {
    message: 'Trop de tentatives de paiement. Veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  globalRateLimiter,
  authRateLimiter,
  createRateLimiter,
  uploadRateLimiter,
  emailRateLimiter,
  paymentRateLimiter
};
