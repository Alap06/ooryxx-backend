const Order = require('../models/Order');
const Livreur = require('../models/Livreur');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse, notFoundResponse } = require('../utils/responseHandler');

/**
 * @desc    Get available livreurs for assignment
 * @route   GET /api/assignment/livreurs
 * @access  Private/Admin/Vendor
 */
exports.getAvailableLivreurs = asyncHandler(async (req, res) => {
    const { zone, city } = req.query;

    const query = {
        status: 'approved',
        isAvailable: true
    };

    // Filter by zone if provided
    if (zone) {
        query.$or = [
            { zone: { $regex: zone, $options: 'i' } },
            { additionalZones: { $elemMatch: { $regex: zone, $options: 'i' } } }
        ];
    }

    const livreurs = await Livreur.find(query)
        .populate('userId', 'firstName lastName phoneNumber email profileImage')
        .select('vehicleType zone additionalZones stats currentOrders maxOrdersAtOnce isAvailable');

    // Filter livreurs who can still accept orders
    const availableLivreurs = livreurs.filter(l => l.canAcceptOrder());

    // Format response
    const formatted = availableLivreurs.map(l => ({
        _id: l._id,
        userId: l.userId._id,
        name: `${l.userId.firstName} ${l.userId.lastName}`,
        phone: l.userId.phoneNumber,
        email: l.userId.email,
        profileImage: l.userId.profileImage,
        vehicleType: l.vehicleType,
        zone: l.zone,
        additionalZones: l.additionalZones,
        currentOrdersCount: l.currentOrders?.length || 0,
        maxOrders: l.maxOrdersAtOnce,
        stats: {
            totalDeliveries: l.stats.totalDeliveries,
            successRate: l.successRate,
            rating: l.stats.rating,
            averageDeliveryTime: l.stats.averageDeliveryTime
        }
    }));

    successResponse(res, {
        livreurs: formatted,
        total: formatted.length
    }, 'Livreurs disponibles récupérés');
});

/**
 * @desc    Assign order to livreur
 * @route   PUT /api/assignment/orders/:orderId/assign
 * @access  Private/Admin/Vendor
 */
exports.assignOrderToLivreur = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { livreurId } = req.body;

    if (!livreurId) {
        return errorResponse(res, 'L\'ID du livreur est requis', 400);
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
        return notFoundResponse(res, 'Commande non trouvée');
    }

    // Check order status - must be ready_to_ship
    if (order.status !== 'ready_to_ship') {
        return errorResponse(res, `La commande doit être en statut "Prête à expédier" pour être assignée. Statut actuel: ${order.status}`, 400);
    }

    // Find the livreur
    const livreur = await Livreur.findOne({ userId: livreurId });
    if (!livreur) {
        return notFoundResponse(res, 'Livreur non trouvé');
    }

    // Check if livreur can accept more orders
    if (!livreur.canAcceptOrder()) {
        return errorResponse(res, 'Ce livreur ne peut pas accepter plus de commandes actuellement', 400);
    }

    // Assign the order
    order.livreurId = livreurId;
    order.assignedToLivreurAt = new Date();
    order.addStatusChange('assigned_to_delivery', 'Commande assignée au livreur', req.user._id);
    await order.save();

    // Add order to livreur's current orders
    livreur.currentOrders.push(order._id);
    await livreur.save();

    // Get livreur user info for notification
    const livreurUser = await User.findById(livreurId);

    // Notify the livreur
    await Notification.create({
        userId: livreurId,
        type: 'order_assigned',
        content: `Nouvelle livraison assignée: ${order.orderNumber} - ${order.shippingAddress?.city}`,
        data: {
            orderId: order._id,
            orderNumber: order.orderNumber,
            deliveryCode: order.deliveryCode
        }
    });

    // Notify the customer
    await Notification.create({
        userId: order.userId,
        type: 'order_status',
        content: `Votre commande ${order.orderNumber} a été assignée à un livreur. Livraison prévue bientôt!`
    });

    successResponse(res, {
        order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            deliveryCode: order.deliveryCode
        },
        livreur: {
            _id: livreur._id,
            name: `${livreurUser.firstName} ${livreurUser.lastName}`,
            phone: livreurUser.phoneNumber
        }
    }, 'Commande assignée au livreur avec succès');
});

/**
 * @desc    Unassign order from livreur
 * @route   PUT /api/assignment/orders/:orderId/unassign
 * @access  Private/Admin
 */
exports.unassignOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
        return notFoundResponse(res, 'Commande non trouvée');
    }

    if (!order.livreurId) {
        return errorResponse(res, 'Cette commande n\'est pas assignée à un livreur', 400);
    }

    // Only allow unassign if not yet picked up
    if (!['assigned_to_delivery'].includes(order.status)) {
        return errorResponse(res, 'Impossible de désassigner une commande déjà récupérée par le livreur', 400);
    }

    const previousLivreurId = order.livreurId;

    // Remove from livreur's current orders
    const livreur = await Livreur.findOne({ userId: previousLivreurId });
    if (livreur) {
        livreur.currentOrders = livreur.currentOrders.filter(o => o.toString() !== orderId);
        await livreur.save();
    }

    // Unassign
    order.livreurId = null;
    order.assignedToLivreurAt = null;
    order.addStatusChange('ready_to_ship', reason || 'Commande désassignée du livreur', req.user._id);
    await order.save();

    // Notify previous livreur
    await Notification.create({
        userId: previousLivreurId,
        type: 'order_unassigned',
        content: `La commande ${order.orderNumber} vous a été retirée.`
    });

    successResponse(res, order, 'Commande désassignée avec succès');
});

/**
 * @desc    Get orders ready for assignment
 * @route   GET /api/assignment/orders/ready
 * @access  Private/Admin/Vendor
 */
exports.getOrdersReadyForAssignment = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, city } = req.query;
    const skip = (page - 1) * limit;

    const query = { status: 'ready_to_ship' };

    // If vendor, only show their orders
    if (req.user.role === 'vendor' && req.user.vendorId) {
        query.vendorId = req.user.vendorId;
    }

    // Filter by city if provided
    if (city) {
        query['shippingAddress.city'] = { $regex: city, $options: 'i' };
    }

    const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'firstName lastName phoneNumber')
        .populate('vendorId', 'companyInfo.name');

    const total = await Order.countDocuments(query);

    successResponse(res, {
        orders,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            total
        }
    }, 'Commandes prêtes à assigner récupérées');
});

/**
 * @desc    Auto-assign order to best available livreur in zone
 * @route   POST /api/assignment/orders/:orderId/auto-assign
 * @access  Private/Admin/Vendor
 */
exports.autoAssignOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
        return notFoundResponse(res, 'Commande non trouvée');
    }

    if (order.status !== 'ready_to_ship') {
        return errorResponse(res, 'La commande doit être en statut "Prête à expédier"', 400);
    }

    const city = order.shippingAddress?.city;

    // Find available livreurs matching the zone
    const livreurs = await Livreur.find({
        status: 'approved',
        isAvailable: true,
        $or: [
            { zone: { $regex: city, $options: 'i' } },
            { additionalZones: { $elemMatch: { $regex: city, $options: 'i' } } }
        ]
    }).populate('userId', 'firstName lastName phoneNumber');

    // Filter livreurs who can accept orders and sort by:
    // 1. Fewest current orders
    // 2. Best rating
    const availableLivreurs = livreurs
        .filter(l => l.canAcceptOrder())
        .sort((a, b) => {
            // First by current orders count (ascending)
            const orderDiff = (a.currentOrders?.length || 0) - (b.currentOrders?.length || 0);
            if (orderDiff !== 0) return orderDiff;
            // Then by rating (descending)
            return (b.stats?.rating || 0) - (a.stats?.rating || 0);
        });

    if (availableLivreurs.length === 0) {
        return errorResponse(res, `Aucun livreur disponible dans la zone "${city}"`, 404);
    }

    const selectedLivreur = availableLivreurs[0];

    // Assign the order
    order.livreurId = selectedLivreur.userId._id;
    order.assignedToLivreurAt = new Date();
    order.addStatusChange('assigned_to_delivery', 'Commande auto-assignée au livreur', req.user._id);
    await order.save();

    // Add to livreur's current orders
    selectedLivreur.currentOrders.push(order._id);
    await selectedLivreur.save();

    // Notify
    await Notification.create({
        userId: selectedLivreur.userId._id,
        type: 'order_assigned',
        content: `Nouvelle livraison assignée: ${order.orderNumber} - ${city}`,
        data: { orderId: order._id, orderNumber: order.orderNumber }
    });

    successResponse(res, {
        order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            status: order.status
        },
        livreur: {
            name: `${selectedLivreur.userId.firstName} ${selectedLivreur.userId.lastName}`,
            phone: selectedLivreur.userId.phoneNumber,
            vehicleType: selectedLivreur.vehicleType
        }
    }, `Commande auto-assignée à ${selectedLivreur.userId.firstName} ${selectedLivreur.userId.lastName}`);
});
