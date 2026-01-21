const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require authentication
router.use(authenticate);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User Management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetail);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.put('/users/:id/status', adminController.updateUserStatus);
router.put('/users/:id/vip', adminController.toggleUserVIP);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/password', adminController.updateUserPassword);
router.put('/users/:id/email', adminController.updateUserEmail);
router.delete('/users/:id', adminController.deleteUser);


// Vendor Management
router.get('/vendors', adminController.getVendors);
router.get('/vendors/:id/products', adminController.getVendorWithProducts);
router.put('/vendors/:id/approve', adminController.approveVendor);
router.put('/vendors/:id/reject', adminController.rejectVendor);

// Analytics
router.get('/analytics', adminController.getAnalytics);

// Product Moderation
router.get('/products/pending', adminController.getPendingProducts);
router.put('/products/:id/approve', adminController.approveProduct);
router.put('/products/:id/reject', adminController.rejectProduct);

// Product Management (CRUD)
router.get('/products', adminController.getAllProducts);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Order Management
router.get('/orders', adminController.getAllOrders);
router.get('/orders/delivery', adminController.getDeliveryOrders);
router.put('/orders/:orderId/assign-livreur', adminController.assignLivreurToOrder);
router.put('/orders/:orderId/unassign-livreur', adminController.unassignLivreurFromOrder);
router.get('/delivery/stats', adminController.getDeliveryStats);

// Moderator Management
router.get('/moderators', adminController.getModerators);
router.get('/moderators/activities', adminController.getAllModeratorActivities);
router.get('/moderators/:id/activity', adminController.getModeratorActivity);
router.post('/moderators', adminController.createModerator);
router.put('/moderators/:id', adminController.updateModerator);
router.put('/moderators/:id/block', adminController.toggleModeratorBlock);
router.delete('/moderators/:id', adminController.revokeModerator);

// Category Management
router.get('/categories', adminController.getAllCategories);
router.get('/categories/:id', adminController.getCategoryById);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Coupon Management
router.get('/coupons', adminController.getAllCoupons);
router.get('/coupons/stats', adminController.getCouponStats);
router.get('/coupons/:id', adminController.getCouponById);
router.post('/coupons', adminController.createCoupon);
router.put('/coupons/:id', adminController.updateCoupon);
router.delete('/coupons/:id', adminController.deleteCoupon);
router.put('/coupons/:id/toggle', adminController.toggleCouponStatus);

// Newsletter Management
router.get('/newsletter/subscribers', adminController.getNewsletterSubscribers);
router.get('/newsletter/stats', adminController.getNewsletterStats);
router.post('/newsletter/subscribers', adminController.addNewsletterSubscriber);
router.delete('/newsletter/subscribers/:id', adminController.removeNewsletterSubscriber);
router.post('/newsletter/send', adminController.sendNewsletter);

// Livreur Management
router.get('/livreurs', adminController.getLivreurs);
router.get('/livreurs/:id', adminController.getLivreurDetails);
router.get('/livreurs/:id/stats', adminController.getLivreurStats);
router.post('/livreurs', adminController.createLivreurAccount);
router.put('/livreurs/:id/status', adminController.updateLivreurStatus);
router.delete('/livreurs/:id', adminController.deleteLivreur);

module.exports = router;

