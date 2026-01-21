// middleware/validation.js
const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array()
    });
  }
  next();
};

// Validation utilisateur
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Mot de passe faible'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-ZàâäéèêëïîôöùûüÿñçÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÑÇ\s-]+$/)
    .withMessage('Prénom invalide'),
  body('phone')
    .optional()
    .isMobilePhone(['fr-FR', 'en-US'])
    .withMessage('Numéro invalide'),
  handleValidationErrors
];

// Validation produit
const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Nom produit invalide'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description invalide'),
  body('price')
    .isFloat({ min: 0.01, max: 999999.99 })
    .withMessage('Prix invalide'),
  body('category')
    .isMongoId()
    .withMessage('Catégorie invalide'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock invalide'),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateProduct,
  handleValidationErrors
};