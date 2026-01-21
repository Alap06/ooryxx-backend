const express = require('express');
const router = express.Router();
const reclamationController = require('../controllers/reclamationController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

// Public route for anonymous reclamations (with optional auth to capture user if logged in)
router.post('/', optionalAuth, reclamationController.createReclamation);

// Protected routes (requires authentication)
router.use(authenticate);

// User routes
router.get('/my', reclamationController.getMyReclamations);
router.put('/my/:id', reclamationController.updateMyReclamation);

// Admin routes
router.get('/', authorize('admin'), reclamationController.getReclamations);
router.get('/:id', authorize('admin'), reclamationController.getReclamation);
router.put('/:id/status', authorize('admin'), reclamationController.updateReclamationStatus);
router.delete('/:id', authorize('admin'), reclamationController.deleteReclamation);

module.exports = router;
