const Order = require('../models/Order');
const Livreur = require('../models/Livreur');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse, notFoundResponse } = require('../utils/responseHandler');

// @desc    Get livreur dashboard stats
// @route   GET /api/livreur/dashboard
// @access  Private/Livreur
exports.getDashboard = asyncHandler(async (req, res) => {
    const livreur = await Livreur.findOne({ userId: req.user.id });

    if (!livreur) {
        return notFoundResponse(res, 'Profil livreur non trouvé');
    }

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDeliveries = await Order.countDocuments({
        livreurId: req.user.id,
        status: 'delivered',
        deliveredAt: { $gte: today }
    });

    const pendingOrders = await Order.countDocuments({
        livreurId: req.user.id,
        status: { $in: ['assigned_to_delivery', 'picked_up', 'out_for_delivery'] }
    });

    successResponse(res, {
        livreur,
        todayStats: {
            delivered: todayDeliveries,
            pending: pendingOrders
        }
    }, 'Dashboard récupéré');
});

// @desc    Get assigned orders for livreur
// @route   GET /api/livreur/orders
// @access  Private/Livreur
exports.getMyOrders = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = { livreurId: req.user.id };

    if (status) {
        query.status = status;
    } else {
        // Default: show active deliveries
        query.status = { $in: ['assigned_to_delivery', 'picked_up', 'out_for_delivery'] };
    }

    const orders = await Order.find(query)
        .sort({ assignedToLivreurAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'firstName lastName phoneNumber')
        .populate('vendorId', 'companyInfo.name companyInfo.address');

    const total = await Order.countDocuments(query);

    successResponse(res, {
        orders,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            total
        }
    }, 'Commandes récupérées');
});

// @desc    Scan QR code and get order details
// @route   GET /api/livreur/scan/:code
// @access  Private/Livreur
exports.scanQRCode = asyncHandler(async (req, res) => {
    const { code } = req.params;

    // deliveryCode is in format LIV-XXXXXX
    const order = await Order.findOne({ deliveryCode: code })
        .populate('userId', 'firstName lastName phoneNumber')
        .populate('vendorId', 'companyInfo.name companyInfo.address companyInfo.phone')
        .populate('items.productId', 'title images');

    if (!order) {
        return notFoundResponse(res, 'Commande non trouvée');
    }

    // Check if order is assigned to this livreur
    if (order.livreurId && order.livreurId.toString() !== req.user.id) {
        return errorResponse(res, 'Cette commande est assignée à un autre livreur', 403);
    }

    // Return delivery-relevant info
    successResponse(res, {
        order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            deliveryCode: order.deliveryCode,
            status: order.status,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            items: order.items,
            shippingAddress: order.shippingAddress,
            customer: {
                name: order.shippingAddress?.recipientName || `${order.userId?.firstName} ${order.userId?.lastName}`,
                phone: order.shippingAddress?.phone || order.userId?.phoneNumber
            },
            vendor: order.vendorId,
            customerNotes: order.customerNotes,
            createdAt: order.createdAt
        }
    }, 'Commande scannée');
});

// @desc    Update order status
// @route   PUT /api/livreur/orders/:id/status
// @access  Private/Livreur
exports.updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, note, photo, signature, location, refusalReason, refusalDetails } = req.body;

    const order = await Order.findById(id);

    if (!order) {
        return notFoundResponse(res, 'Commande non trouvée');
    }

    // Verify livreur is assigned
    if (order.livreurId?.toString() !== req.user.id) {
        return errorResponse(res, 'Non autorisé à modifier cette commande', 403);
    }

    // Validate status transitions
    const validTransitions = {
        'assigned_to_delivery': ['picked_up'],
        'picked_up': ['out_for_delivery'],
        'out_for_delivery': ['delivered', 'delivery_attempted', 'refused'],
        'delivery_attempted': ['out_for_delivery', 'returned'],
        'refused': ['returned']
    };

    if (!validTransitions[order.status]?.includes(status)) {
        return errorResponse(res, `Transition de statut invalide: ${order.status} → ${status}`, 400);
    }

    // Update status
    order.addStatusChange(status, note || `Statut mis à jour: ${status}`, req.user.id);

    // Update timestamps based on status
    switch (status) {
        case 'picked_up':
            order.pickedUpAt = new Date();
            break;
        case 'delivered':
            order.deliveredAt = new Date();
            order.shipping.actualDelivery = new Date();
            order.deliveryProof = {
                photo,
                signature,
                notes: note,
                location,
                timestamp: new Date()
            };
            break;
        case 'delivery_attempted':
            order.shipping.deliveryAttempts += 1;
            break;
        case 'refused':
            order.refusalInfo = {
                reason: refusalReason,
                details: refusalDetails,
                photo,
                timestamp: new Date()
            };
            break;
    }

    await order.save();

    // Update livreur stats
    if (status === 'delivered') {
        const livreur = await Livreur.findOne({ userId: req.user.id });
        if (livreur) {
            const deliveryTime = Math.round((new Date() - order.pickedUpAt) / 60000); // minutes
            await livreur.recordDelivery(true, deliveryTime);
            // Remove from current orders
            livreur.currentOrders = livreur.currentOrders.filter(o => o.toString() !== id);
            await livreur.save();
        }
    }

    // Notify customer
    await Notification.create({
        userId: order.userId,
        type: 'order_status',
        content: getStatusNotificationMessage(status, order.orderNumber)
    });

    successResponse(res, order, 'Statut mis à jour');
});

// @desc    Get order history for livreur
// @route   GET /api/livreur/history
// @access  Private/Livreur
exports.getDeliveryHistory = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const query = {
        livreurId: req.user.id,
        status: { $in: ['delivered', 'refused', 'returned'] }
    };

    if (startDate && endDate) {
        query.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    const orders = await Order.find(query)
        .sort({ deliveredAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('orderNumber status totalAmount deliveredAt shippingAddress.city');

    const total = await Order.countDocuments(query);

    successResponse(res, {
        orders,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            total
        }
    }, 'Historique récupéré');
});

// @desc    Update livreur availability
// @route   PUT /api/livreur/availability
// @access  Private/Livreur
exports.updateAvailability = asyncHandler(async (req, res) => {
    const { isAvailable } = req.body;

    const livreur = await Livreur.findOneAndUpdate(
        { userId: req.user.id },
        { isAvailable },
        { new: true }
    );

    if (!livreur) {
        return notFoundResponse(res, 'Profil livreur non trouvé');
    }

    successResponse(res, livreur, `Disponibilité: ${isAvailable ? 'Disponible' : 'Indisponible'}`);
});

// Helper function for notification messages
function getStatusNotificationMessage(status, orderNumber) {
    const messages = {
        'picked_up': `Votre commande ${orderNumber} a été récupérée par le livreur.`,
        'out_for_delivery': `Votre commande ${orderNumber} est en route ! Le livreur arrive bientôt.`,
        'delivered': `Votre commande ${orderNumber} a été livrée. Merci pour votre confiance !`,
        'delivery_attempted': `Tentative de livraison pour ${orderNumber}. Le livreur réessaiera bientôt.`,
        'refused': `La commande ${orderNumber} a été refusée. Veuillez nous contacter.`,
        'returned': `La commande ${orderNumber} est en cours de retour.`
    };
    return messages[status] || `Statut de votre commande ${orderNumber} mis à jour.`;
}
