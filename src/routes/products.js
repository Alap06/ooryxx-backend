const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Public routes - no authentication required
router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/sale', productController.getSaleProducts);
router.get('/categories', productController.getCategories);
router.get('/search', productController.searchProducts);
router.get('/:id', productController.getProductById);
router.get('/:id/similar', productController.getSimilarProducts);
router.get('/:id/reviews', productController.getProductReviews);

module.exports = router;
