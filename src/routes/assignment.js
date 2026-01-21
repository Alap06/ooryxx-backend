const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get available livreurs - accessible to admin and vendors
router.get('/livreurs',
    authorize('admin', 'vendor', 'moderator'),
    assignmentController.getAvailableLivreurs
);

// Get orders ready for assignment
router.get('/orders/ready',
    authorize('admin', 'vendor', 'moderator'),
    assignmentController.getOrdersReadyForAssignment
);

// Assign order to livreur
router.put('/orders/:orderId/assign',
    authorize('admin', 'vendor', 'moderator'),
    assignmentController.assignOrderToLivreur
);

// Auto-assign order to best available livreur
router.post('/orders/:orderId/auto-assign',
    authorize('admin', 'vendor', 'moderator'),
    assignmentController.autoAssignOrder
);

// Unassign order (admin only)
router.put('/orders/:orderId/unassign',
    authorize('admin'),
    assignmentController.unassignOrder
);

module.exports = router;
