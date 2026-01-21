const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const { generateAccessToken, generateRefreshToken: generateRefreshJWT, verifyRefreshToken } = require('../config/jwt');

/**
 * Générer un token JWT
 */
const generateToken = (userId, role) => {
  return generateAccessToken({ userId, role });
};

/**
 * Générer un refresh token
 */
const generateRefreshToken = (userId, role) => {
  return generateRefreshJWT({ userId, role });
};

/**
 * @desc    Inscription d'un nouvel utilisateur
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber, street, city, postalCode, role = 'customer' } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Le mot de passe sera hashé automatiquement par le middleware pre('save') du modèle User

    // Prepare initial address if provided
    const addresses = [];
    if (street || city || postalCode) {
      addresses.push({
        label: 'Principal',
        street: street || '',
        city: city || '',
        postalCode: postalCode || '',
        country: 'Tunisie',
        isDefault: true
      });
    }

    // Créer l'utilisateur (le password sera hashé par le middleware pre-save)
    const user = await User.create({
      email: email.toLowerCase(),
      password: password,
      firstName,
      lastName,
      phoneNumber: phoneNumber || null,
      addresses,
      role: ['customer', 'customer_vip', 'vendor', 'admin'].includes(role) ? role : 'customer',
      isActive: true,
      isEmailVerified: false
    });

    // Générer les tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    // Sauvegarder le refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Retourner les données utilisateur (sans le mot de passe)
    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      addresses: user.addresses,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    };

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      refreshToken,
      user: userResponse
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message
    });
  }
};

/**
 * @desc    Connexion utilisateur
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été désactivé'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Générer les tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    // Sauvegarder le refresh token
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // Retourner les données utilisateur
    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      phoneNumber: user.phoneNumber
    };

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      refreshToken,
      user: userResponse
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};

/**
 * @desc    Refresh token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token manquant'
      });
    }

    // Vérifier le refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Trouver l'utilisateur
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({
        success: false,
        message: 'Refresh token invalide'
      });
    }

    // Générer de nouveaux tokens
    const newToken = generateToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id, user.role);

    // Sauvegarder le nouveau refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    console.error('Erreur lors du refresh:', error);
    res.status(403).json({
      success: false,
      message: 'Refresh token invalide ou expiré'
    });
  }
};

/**
 * @desc    Déconnexion utilisateur
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion'
    });
  }
};

/**
 * @desc    Obtenir le profil utilisateur
 * @route   GET /api/auth/profile
 * @access  Private
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
};

/**
 * @desc    Mot de passe oublié
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Ne pas révéler si l'email existe ou non (sécurité)
      return res.json({
        success: true,
        message: 'Si cet email existe, un code de réinitialisation a été envoyé'
      });
    }

    // Générer un code à 6 chiffres
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hasher le code avant de le sauvegarder
    const crypto = require('crypto');
    const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');

    // Sauvegarder le code hashé et l'expiration (10 minutes)
    user.resetPasswordToken = hashedCode;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Envoyer l'email avec le code
    const emailService = require('../services/emailService');
    try {
      await emailService.sendPasswordResetCode(user, resetCode);

      res.json({
        success: true,
        message: 'Un code de vérification a été envoyé à votre email'
      });
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError);
      // Supprimer le token si l'email n'a pas pu être envoyé
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email'
      });
    }

  } catch (error) {
    console.error('Erreur mot de passe oublié:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la demande'
    });
  }
};

/**
 * @desc    Réinitialiser le mot de passe avec code
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    // Validation
    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, code et nouveau mot de passe requis'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Hasher le code fourni
    const crypto = require('crypto');
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    // Trouver l'utilisateur avec le code valide
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedCode,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Code invalide ou expiré'
      });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Erreur reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation'
    });
  }
};

/**
 * @desc    Connexion avec Google OAuth
 * @route   POST /api/auth/google
 * @access  Public
 */
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Token Google manquant'
      });
    }

    // Decode the Google JWT token
    const base64Url = credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString()
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const googleUser = JSON.parse(jsonPayload);

    // Verify the token issuer and audience
    if (!googleUser.email || !googleUser.sub) {
      return res.status(400).json({
        success: false,
        message: 'Token Google invalide'
      });
    }

    const { email, sub: googleId, given_name: firstName, family_name: lastName, picture: profileImage } = googleUser;

    // Check if user already exists with this Google ID or email
    let user = await User.findOne({
      $or: [
        { googleId: googleId },
        { email: email.toLowerCase() }
      ]
    });

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        if (profileImage && !user.profileImage) {
          user.profileImage = profileImage;
        }
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        email: email.toLowerCase(),
        googleId: googleId,
        firstName: firstName || email.split('@')[0],
        lastName: lastName || '',
        password: require('crypto').randomBytes(32).toString('hex'), // Random password for social users
        profileImage: profileImage,
        role: 'customer',
        isActive: true,
        isEmailVerified: true // Google accounts are verified
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été désactivé'
      });
    }

    // Generate tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    // Save refresh token and update last login
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // Return user data
    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      profileImage: user.profileImage
    };

    res.json({
      success: true,
      message: 'Connexion Google réussie',
      token,
      refreshToken,
      user: userResponse
    });

  } catch (error) {
    console.error('Erreur lors de la connexion Google:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion Google',
      error: error.message
    });
  }
};

module.exports = exports;
