const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/google', authController.googleLogin);

// Routes protégées
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);

// Route de test
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes OK' });
});

module.exports = router;
