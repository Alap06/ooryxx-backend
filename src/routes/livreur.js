const express = require('express');
const router = express.Router();
const livreurController = require('../controllers/livreurController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and livreur role
router.use(authenticate);
router.use(authorize('livreur', 'admin'));

// Dashboard
router.get('/dashboard', livreurController.getDashboard);

// Orders
router.get('/orders', livreurController.getMyOrders);
router.get('/history', livreurController.getDeliveryHistory);

// QR Scan
router.get('/scan/:code', livreurController.scanQRCode);

// Status updates
router.put('/orders/:id/status', livreurController.updateOrderStatus);

// Availability
router.put('/availability', livreurController.updateAvailability);

module.exports = router;
