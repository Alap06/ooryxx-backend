const express = require('express');
const router = express.Router();
const productQuestionController = require('../controllers/productQuestionController');
const { authenticate: authenticateUser, authorize: checkRole } = require('../middleware/auth');

/**
 * Routes pour les questions produits anonymes
 */

// ============== ROUTES PUBLIQUES (Auth requise) ==============

// Créer une question sur un produit (Client)
router.post(
    '/products/:productId/questions',
    authenticateUser,
    productQuestionController.createQuestion
);

// Obtenir les questions publiques d'un produit (Tout le monde)
router.get(
    '/products/:productId/questions',
    productQuestionController.getQuestionsByProduct
);

// ============== ROUTES QUESTIONS ==============

// Obtenir une question spécifique
router.get(
    '/product-questions/:questionId',
    authenticateUser,
    productQuestionController.getQuestion
);

// Répondre à une question
router.post(
    '/product-questions/:questionId/reply',
    authenticateUser,
    productQuestionController.addReply
);

// Fermer une question (Client seulement)
router.put(
    '/product-questions/:questionId/close',
    authenticateUser,
    productQuestionController.closeQuestion
);

// ============== ROUTES CLIENT ==============

// Obtenir mes questions (Client)
router.get(
    '/users/product-questions',
    authenticateUser,
    productQuestionController.getCustomerQuestions
);

// ============== ROUTES VENDEUR ==============

// Obtenir les questions pour le vendeur
router.get(
    '/vendor/product-questions',
    authenticateUser,
    checkRole('vendor'),
    productQuestionController.getVendorQuestions
);

// ============== ROUTES ADMIN/MODERATEUR ==============

// Obtenir les questions avec messages bloqués
router.get(
    '/admin/product-questions/blocked',
    authenticateUser,
    checkRole('admin', 'moderator'),
    productQuestionController.getBlockedQuestions
);

// Débloquer un message
router.put(
    '/admin/product-questions/:questionId/messages/:messageIndex/unblock',
    authenticateUser,
    checkRole('admin', 'moderator'),
    productQuestionController.unblockMessage
);

module.exports = router;
