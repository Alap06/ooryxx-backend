const express = require('express');
const router = express.Router();
const DeliveryZone = require('../models/DeliveryZone');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse, notFoundResponse } = require('../utils/responseHandler');

// ========================================
// ROUTES PUBLIQUES
// ========================================

// @desc    Get all active delivery zones
// @route   GET /api/delivery-zones
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
    const { country, active } = req.query;

    const query = {};
    if (country) query.country = country.toUpperCase();
    if (active !== 'false') query.isActive = true;

    const zones = await DeliveryZone.find(query)
        .sort({ displayOrder: 1, name: 1 })
        .select('-geoPolygon'); // Exclure le polygone pour alléger la réponse

    successResponse(res, { zones }, 'Zones de livraison récupérées');
}));

// @desc    Get zone by city name
// @route   GET /api/delivery-zones/by-city/:cityName
// @access  Public
router.get('/by-city/:cityName', asyncHandler(async (req, res) => {
    const { cityName } = req.params;
    const { country } = req.query;

    const zone = await DeliveryZone.findZoneByCity(cityName, country || 'TN');

    if (!zone) {
        return notFoundResponse(res, 'Aucune zone de livraison trouvée pour cette ville');
    }

    successResponse(res, { zone }, 'Zone trouvée');
}));

// @desc    Get zone by coordinates
// @route   GET /api/delivery-zones/by-location
// @access  Public
router.get('/by-location', asyncHandler(async (req, res) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
        return errorResponse(res, 'Latitude et longitude requises', 400);
    }

    const zone = await DeliveryZone.findZoneByCoordinates(
        parseFloat(lat), 
        parseFloat(lng)
    );

    if (!zone) {
        return notFoundResponse(res, 'Aucune zone de livraison pour cette localisation');
    }

    successResponse(res, { zone }, 'Zone trouvée');
}));

// @desc    Get available countries
// @route   GET /api/delivery-zones/countries
// @access  Public
router.get('/countries', asyncHandler(async (req, res) => {
    const countries = await DeliveryZone.aggregate([
        { $match: { isActive: true } },
        { 
            $group: { 
                _id: '$country', 
                name: { $first: '$countryName' },
                zonesCount: { $sum: 1 }
            } 
        },
        { $sort: { name: 1 } }
    ]);

    successResponse(res, { 
        countries: countries.map(c => ({
            code: c._id,
            name: c.name,
            zonesCount: c.zonesCount
        }))
    }, 'Pays disponibles récupérés');
}));

// @desc    Calculate delivery fee for an address
// @route   POST /api/delivery-zones/calculate-fee
// @access  Public
router.post('/calculate-fee', asyncHandler(async (req, res) => {
    const { city, country, express } = req.body;

    const zone = await DeliveryZone.findZoneByCity(city, country || 'TN');

    if (!zone) {
        return errorResponse(res, 'Livraison non disponible dans cette zone', 400);
    }

    const fee = express && zone.expressAvailable 
        ? zone.expressDeliveryFee 
        : zone.deliveryFee;

    const estimatedTime = express 
        ? { min: 2, max: 6 } 
        : zone.estimatedDeliveryTime;

    successResponse(res, {
        zone: {
            id: zone._id,
            code: zone.code,
            name: zone.name
        },
        deliveryFee: fee,
        estimatedDeliveryTime: estimatedTime,
        expressAvailable: zone.expressAvailable
    }, 'Frais de livraison calculés');
}));

// ========================================
// ROUTES ADMIN
// ========================================

// @desc    Get all zones (admin)
// @route   GET /api/delivery-zones/admin
// @access  Private/Admin
router.get('/admin', authenticate, asyncHandler(async (req, res) => {
    const { country, search, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (country) query.country = country.toUpperCase();
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { code: { $regex: search, $options: 'i' } },
            { 'cities.name': { $regex: search, $options: 'i' } }
        ];
    }

    const [zones, total] = await Promise.all([
        DeliveryZone.find(query)
            .sort({ country: 1, displayOrder: 1 })
            .skip(skip)
            .limit(parseInt(limit)),
        DeliveryZone.countDocuments(query)
    ]);

    successResponse(res, {
        zones,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total
        }
    }, 'Zones récupérées');
}));

// @desc    Get single zone
// @route   GET /api/delivery-zones/:id
// @access  Private/Admin
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
    const zone = await DeliveryZone.findById(req.params.id);

    if (!zone) {
        return notFoundResponse(res, 'Zone non trouvée');
    }

    successResponse(res, { zone }, 'Zone récupérée');
}));

// @desc    Create delivery zone
// @route   POST /api/delivery-zones
// @access  Private/Admin
router.post('/', authenticate, asyncHandler(async (req, res) => {
    const { code, name, country, countryName, cities, center, deliveryFee, expressDeliveryFee, estimatedDeliveryTime, color } = req.body;

    // Vérifier si le code existe déjà
    const existingZone = await DeliveryZone.findOne({ code: code.toUpperCase() });
    if (existingZone) {
        return errorResponse(res, 'Une zone avec ce code existe déjà', 400);
    }

    const zone = await DeliveryZone.create({
        code: code.toUpperCase(),
        name,
        country: country?.toUpperCase() || 'TN',
        countryName: countryName || 'Tunisie',
        cities: cities || [],
        center,
        deliveryFee: deliveryFee || 7,
        expressDeliveryFee: expressDeliveryFee || 15,
        estimatedDeliveryTime: estimatedDeliveryTime || { min: 24, max: 48 },
        color: color || '#4F46E5'
    });

    successResponse(res, { zone }, 'Zone créée avec succès', 201);
}));

// @desc    Update delivery zone
// @route   PUT /api/delivery-zones/:id
// @access  Private/Admin
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
    const zone = await DeliveryZone.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
    );

    if (!zone) {
        return notFoundResponse(res, 'Zone non trouvée');
    }

    successResponse(res, { zone }, 'Zone mise à jour');
}));

// @desc    Add city to zone
// @route   POST /api/delivery-zones/:id/cities
// @access  Private/Admin
router.post('/:id/cities', authenticate, asyncHandler(async (req, res) => {
    const { name, postalCodes, coordinates } = req.body;

    const zone = await DeliveryZone.findByIdAndUpdate(
        req.params.id,
        { 
            $push: { 
                cities: { name, postalCodes, coordinates } 
            } 
        },
        { new: true }
    );

    if (!zone) {
        return notFoundResponse(res, 'Zone non trouvée');
    }

    successResponse(res, { zone }, 'Ville ajoutée à la zone');
}));

// @desc    Remove city from zone
// @route   DELETE /api/delivery-zones/:id/cities/:cityName
// @access  Private/Admin
router.delete('/:id/cities/:cityName', authenticate, asyncHandler(async (req, res) => {
    const zone = await DeliveryZone.findByIdAndUpdate(
        req.params.id,
        { 
            $pull: { 
                cities: { name: req.params.cityName } 
            } 
        },
        { new: true }
    );

    if (!zone) {
        return notFoundResponse(res, 'Zone non trouvée');
    }

    successResponse(res, { zone }, 'Ville retirée de la zone');
}));

// @desc    Toggle zone active status
// @route   PUT /api/delivery-zones/:id/toggle
// @access  Private/Admin
router.put('/:id/toggle', authenticate, asyncHandler(async (req, res) => {
    const zone = await DeliveryZone.findById(req.params.id);

    if (!zone) {
        return notFoundResponse(res, 'Zone non trouvée');
    }

    zone.isActive = !zone.isActive;
    await zone.save();

    successResponse(res, { zone }, `Zone ${zone.isActive ? 'activée' : 'désactivée'}`);
}));

// @desc    Delete delivery zone
// @route   DELETE /api/delivery-zones/:id
// @access  Private/Admin
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
    const zone = await DeliveryZone.findByIdAndDelete(req.params.id);

    if (!zone) {
        return notFoundResponse(res, 'Zone non trouvée');
    }

    successResponse(res, null, 'Zone supprimée');
}));

// @desc    Get zone statistics
// @route   GET /api/delivery-zones/:id/stats
// @access  Private/Admin
router.get('/:id/stats', authenticate, asyncHandler(async (req, res) => {
    const Order = require('../models/Order');
    const Livreur = require('../models/Livreur');

    const zone = await DeliveryZone.findById(req.params.id);
    if (!zone) {
        return notFoundResponse(res, 'Zone non trouvée');
    }

    // Compter les commandes dans cette zone
    const cityNames = zone.cities.map(c => c.name);
    const cityRegex = cityNames.map(name => new RegExp(name, 'i'));

    const [totalOrders, pendingOrders, deliveredToday, livreurs] = await Promise.all([
        Order.countDocuments({ 'shippingAddress.city': { $in: cityRegex } }),
        Order.countDocuments({ 
            'shippingAddress.city': { $in: cityRegex },
            status: { $in: ['shipped', 'assigned_to_delivery', 'out_for_delivery'] }
        }),
        Order.countDocuments({
            'shippingAddress.city': { $in: cityRegex },
            status: 'delivered',
            deliveredAt: { $gte: new Date().setHours(0, 0, 0, 0) }
        }),
        Livreur.countDocuments({
            $or: [
                { zone: zone.code },
                { additionalZones: zone.code }
            ],
            isActive: true
        })
    ]);

    successResponse(res, {
        zone: { _id: zone._id, code: zone.code, name: zone.name },
        stats: {
            totalOrders,
            pendingOrders,
            deliveredToday,
            activeLivreurs: livreurs
        }
    }, 'Statistiques de la zone');
}));

module.exports = router;
