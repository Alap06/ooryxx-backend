const { verifyAccessToken } = require('../config/jwt');
const User = require('../models/User');

/**
 * Middleware d'authentification JWT
 */
const authenticate = async (req, res, next) => {
  try {
    // Récupérer le token depuis le header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Token d\'authentification manquant'
      });
    }

    const token = authHeader.substring(7);

    // Vérifier le token
    const decoded = verifyAccessToken(token);

    // Récupérer l'utilisateur
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si l'utilisateur est bloqué
    if (user.isBlocked) {
      return res.status(403).json({
        message: 'Compte bloqué. Contactez l\'administrateur'
      });
    }

    // Vérifier si le compte est verrouillé
    if (user.isLocked && user.isLocked()) {
      return res.status(403).json({
        message: 'Compte temporairement verrouillé suite à plusieurs tentatives échouées'
      });
    }

    // Attacher l'utilisateur à la requête (convert to plain object to allow adding properties)
    req.user = {
      ...user.toObject(),
      userId: user._id // Keep userId for compatibility
    };

    // Si l'utilisateur est un vendeur, récupérer ou créer son profil vendeur
    if (user.role === 'vendor') {
      const Vendor = require('../models/Vendor');
      let vendor = await Vendor.findOne({ userId: user._id });

      // Auto-create vendor profile if it doesn't exist
      if (!vendor) {
        vendor = await Vendor.create({
          userId: user._id,
          companyInfo: {
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Vendeur',
            email: user.email,
            phone: user.phoneNumber || ''
          },
          status: 'approved', // Auto-approve for now
          isActive: true,
          stats: {
            totalProducts: 0,
            totalOrders: 0,
            totalRevenue: 0,
            rating: 0,
            reviewCount: 0
          }
        });
        console.log(`✅ Auto-created vendor profile for user ${user._id}`);
      }

      if (vendor) {
        req.user.vendorId = vendor._id;
      }
    }

    next();

  } catch (error) {
    return res.status(401).json({
      message: 'Token invalide ou expiré',
      error: error.message
    });
  }
};

/**
 * Middleware pour vérifier le rôle de l'utilisateur
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentification requise'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Accès refusé. Permissions insuffisantes'
      });
    }

    next();
  };
};

/**
 * Middleware pour vérifier le niveau VIP
 */
const requireVIP = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Authentification requise'
    });
  }

  if (req.user.level !== 'VIP') {
    return res.status(403).json({
      message: 'Accès réservé aux membres VIP'
    });
  }

  next();
};

/**
 * Middleware optionnel (n'échoue pas si pas de token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password');

      if (user && !user.isBlocked) {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignorer les erreurs pour l'auth optionnelle
  }

  next();
};

/**
 * Middleware pour vérifier que l'utilisateur est un vendeur approuvé
 */
const requireApprovedVendor = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentification requise'
      });
    }

    if (req.user.role !== 'vendor') {
      return res.status(403).json({
        message: 'Accès réservé aux vendeurs'
      });
    }

    const Vendor = require('../models/Vendor');
    const vendor = await Vendor.findOne({ userId: req.user._id });

    if (!vendor) {
      return res.status(404).json({
        message: 'Profil vendeur non trouvé'
      });
    }

    if (vendor.status !== 'approved') {
      return res.status(403).json({
        message: 'Votre compte vendeur n\'est pas encore approuvé',
        status: vendor.status
      });
    }

    if (!vendor.isActive) {
      return res.status(403).json({
        message: 'Votre compte vendeur est désactivé'
      });
    }

    req.vendor = vendor;
    next();

  } catch (error) {
    return res.status(500).json({
      message: 'Erreur lors de la vérification du vendeur',
      error: error.message
    });
  }
};

module.exports = {
  authenticate,
  protect: authenticate, // Alias for backward compatibility
  authorize,
  requireVIP,
  optionalAuth,
  requireApprovedVendor
};
