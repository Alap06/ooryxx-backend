const express = require('express');
const router = express.Router();
const {
  getFeaturedProducts,
  getAllFeaturedProducts,
  getFeaturedProductById,
  createFeaturedProduct,
  updateFeaturedProduct,
  deleteFeaturedProduct,
  reorderFeaturedProducts,
  toggleFeaturedProduct
} = require('../controllers/featuredProductController');
const { protect, authorize } = require('../middleware/auth');

// Routes publiques
router.get('/', getFeaturedProducts);

// Routes admin
router.get('/admin', protect, authorize('admin', 'moderator'), getAllFeaturedProducts);
router.get('/admin/:id', protect, authorize('admin', 'moderator'), getFeaturedProductById);
router.post('/admin', protect, authorize('admin', 'moderator'), createFeaturedProduct);
router.put('/admin/reorder', protect, authorize('admin', 'moderator'), reorderFeaturedProducts);
router.put('/admin/:id', protect, authorize('admin', 'moderator'), updateFeaturedProduct);
router.patch('/admin/:id/toggle', protect, authorize('admin', 'moderator'), toggleFeaturedProduct);
router.delete('/admin/:id', protect, authorize('admin', 'moderator'), deleteFeaturedProduct);

module.exports = router;
