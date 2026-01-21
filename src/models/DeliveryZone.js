const mongoose = require('mongoose');

const deliveryZoneSchema = new mongoose.Schema({
    // Identifiant unique de la zone
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },

    // Nom de la zone
    name: {
        type: String,
        required: true,
        trim: true
    },

    // Pays
    country: {
        type: String,
        required: true,
        default: 'TN' // Code ISO du pays
    },

    countryName: {
        type: String,
        required: true,
        default: 'Tunisie'
    },

    // Villes/Régions incluses dans la zone
    cities: [{
        name: {
            type: String,
            required: true
        },
        postalCodes: [String], // Codes postaux optionnels
        // Coordonnées géographiques pour la carte
        coordinates: {
            lat: Number,
            lng: Number
        }
    }],

    // Zone géographique (polygone pour la carte)
    geoPolygon: {
        type: {
            type: String,
            enum: ['Polygon'],
            default: 'Polygon'
        },
        coordinates: {
            type: [[[Number]]], // Array de points [longitude, latitude]
            default: undefined
        }
    },

    // Centre de la zone (pour affichage sur carte)
    center: {
        lat: { type: Number },
        lng: { type: Number }
    },

    // Rayon de couverture en km (alternative au polygone)
    coverageRadius: {
        type: Number,
        default: 50 // km
    },

    // Frais de livraison pour cette zone
    deliveryFee: {
        type: Number,
        default: 7 // En devise locale
    },

    // Frais de livraison express
    expressDeliveryFee: {
        type: Number,
        default: 15
    },

    // Délai de livraison estimé (en heures)
    estimatedDeliveryTime: {
        min: { type: Number, default: 24 },
        max: { type: Number, default: 48 }
    },

    // Livraison express disponible
    expressAvailable: {
        type: Boolean,
        default: true
    },

    // Zone active
    isActive: {
        type: Boolean,
        default: true
    },

    // Ordre d'affichage
    displayOrder: {
        type: Number,
        default: 0
    },

    // Couleur pour l'affichage sur carte
    color: {
        type: String,
        default: '#4F46E5'
    },

    // Statistiques
    stats: {
        totalDeliveries: { type: Number, default: 0 },
        activeOrders: { type: Number, default: 0 },
        averageDeliveryTime: { type: Number, default: 0 },
        activeLivreurs: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Index géospatial pour les requêtes de localisation
deliveryZoneSchema.index({ geoPolygon: '2dsphere' });
deliveryZoneSchema.index({ country: 1, isActive: 1 });
deliveryZoneSchema.index({ 'cities.name': 'text' });

// Méthode statique pour trouver la zone d'une ville
deliveryZoneSchema.statics.findZoneByCity = async function(cityName, countryCode = 'TN') {
    return this.findOne({
        country: countryCode,
        isActive: true,
        'cities.name': { $regex: new RegExp(cityName, 'i') }
    });
};

// Méthode statique pour trouver la zone par coordonnées
deliveryZoneSchema.statics.findZoneByCoordinates = async function(lat, lng) {
    return this.findOne({
        isActive: true,
        geoPolygon: {
            $geoIntersects: {
                $geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                }
            }
        }
    });
};

// Méthode pour vérifier si une ville est dans la zone
deliveryZoneSchema.methods.containsCity = function(cityName) {
    return this.cities.some(city => 
        city.name.toLowerCase().includes(cityName.toLowerCase()) ||
        cityName.toLowerCase().includes(city.name.toLowerCase())
    );
};

const DeliveryZone = mongoose.model('DeliveryZone', deliveryZoneSchema);

module.exports = DeliveryZone;
