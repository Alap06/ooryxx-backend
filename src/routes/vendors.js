const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { authenticate } = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Dashboard
router.get('/dashboard', vendorController.getDashboard);

// Gestion des produits
router.get('/products', vendorController.getProducts);
router.post('/products', vendorController.createProduct);
router.post('/products/bulk', vendorController.bulkImportProducts);
router.put('/products/:id', vendorController.updateProduct);
router.delete('/products/:id', vendorController.deleteProduct);

// Gestion des commandes
router.get('/orders', vendorController.getOrders);
router.get('/orders/:id', vendorController.getOrderDetails);
router.put('/orders/:id/confirm', vendorController.confirmOrder);
router.put('/orders/:id/cancel', vendorController.cancelOrder);
router.put('/orders/:id/ship', vendorController.shipOrder);

// Analytics
router.get('/analytics', vendorController.getAnalytics);

// Coupon Management (vendor-scoped)
router.get('/coupons', vendorController.getCoupons);
router.get('/coupons/:id', vendorController.getCouponById);
router.post('/coupons', vendorController.createCoupon);
router.put('/coupons/:id', vendorController.updateCoupon);
router.delete('/coupons/:id', vendorController.deleteCoupon);
router.put('/coupons/:id/toggle', vendorController.toggleCouponStatus);

module.exports = router;
