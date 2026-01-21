const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, notFoundResponse, errorResponse } = require('../utils/responseHandler');

// =====================================
// ROUTE PUBLIQUE POUR SCAN QR LIVREUR
// =====================================

/**
 * @desc    Récupérer les infos de livraison par code (pour QR code scan)
 * @route   GET /api/orders/delivery/:deliveryCode
 * @access  Public (avec le code de livraison)
 */
router.get('/delivery/:deliveryCode', asyncHandler(async (req, res) => {
    const { deliveryCode } = req.params;
    
    if (!deliveryCode) {
        return errorResponse(res, 'Code de livraison requis', 400);
    }

    // Rechercher la commande par code de livraison
    const order = await Order.findOne({ deliveryCode })
        .populate('userId', 'firstName lastName')
        .populate('items.productId', 'title');

    if (!order) {
        return notFoundResponse(res, 'Commande non trouvée avec ce code de livraison');
    }

    // Retourner uniquement les informations nécessaires pour la livraison
    // (Pas d'informations sensibles sur le client ou le vendeur)
    const deliveryInfo = {
        // Identifiants
        deliveryCode: order.deliveryCode,
        orderNumber: order.orderNumber,
        orderId: order._id,
        
        // Informations destinataire (nécessaires pour la livraison)
        recipient: {
            name: order.shippingAddress?.recipientName,
            phone: order.shippingAddress?.phone,
            address: order.shippingAddress?.street,
            city: order.shippingAddress?.city,
            postalCode: order.shippingAddress?.postalCode,
            country: order.shippingAddress?.country || 'Tunisie',
            instructions: order.shippingAddress?.instructions || ''
        },
        
        // Détails commande
        order: {
            itemsCount: order.items?.length || 0,
            totalAmount: order.totalAmount?.toFixed(2),
            currency: 'TND',
            paymentMethod: order.paymentMethod,
            isPaid: order.paymentMethod !== 'cash_on_delivery',
            amountToCollect: order.paymentMethod === 'cash_on_delivery' ? order.totalAmount?.toFixed(2) : '0.00',
            status: order.status
        },
        
        // Liste simplifiée des articles
        items: order.items?.map(item => ({
            name: item.productId?.title || item.title,
            quantity: item.quantity,
            variant: item.variant || null
        })),
        
        // Métadonnées
        platform: 'OORYXX',
        generatedAt: new Date().toISOString()
    };

    successResponse(res, deliveryInfo, 'Informations de livraison récupérées');
}));

// Route test
router.get('/test', (req, res) => {
    res.json({ message: 'Order routes OK' });
});

module.exports = router;
