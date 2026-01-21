/**
 * Script de seed pour les zones de livraison
 * Exécuter: node src/seeds/seed-delivery-zones.js
 */

const mongoose = require('mongoose');
const DeliveryZone = require('../models/DeliveryZone');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ooryxx';

// ========================================
// DONNÉES DES ZONES DE LIVRAISON
// ========================================

const deliveryZonesData = [
    // ==================== TUNISIE ====================
    {
        code: 'TN-TUNIS',
        name: 'Grand Tunis',
        country: 'TN',
        countryName: 'Tunisie',
        cities: [
            { name: 'Tunis', coordinates: { lat: 36.8065, lng: 10.1815 } },
            { name: 'Ariana', coordinates: { lat: 36.8663, lng: 10.1647 } },
            { name: 'Ben Arous', coordinates: { lat: 36.7531, lng: 10.2189 } },
            { name: 'Manouba', coordinates: { lat: 36.8101, lng: 10.0956 } },
            { name: 'La Marsa', coordinates: { lat: 36.8783, lng: 10.3247 } },
            { name: 'Carthage', coordinates: { lat: 36.8528, lng: 10.3233 } },
            { name: 'Le Bardo', coordinates: { lat: 36.8089, lng: 10.1406 } }
        ],
        center: { lat: 36.8065, lng: 10.1815 },
        deliveryFee: 7,
        expressDeliveryFee: 12,
        estimatedDeliveryTime: { min: 24, max: 48 },
        displayOrder: 1,
        color: '#EF4444'
    },
    {
        code: 'TN-NORD',
        name: 'Nord',
        country: 'TN',
        countryName: 'Tunisie',
        cities: [
            { name: 'Bizerte', coordinates: { lat: 37.2744, lng: 9.8739 } },
            { name: 'Béja', coordinates: { lat: 36.7333, lng: 9.1833 } },
            { name: 'Jendouba', coordinates: { lat: 36.5011, lng: 8.7803 } },
            { name: 'Le Kef', coordinates: { lat: 36.1742, lng: 8.7047 } },
            { name: 'Siliana', coordinates: { lat: 36.0847, lng: 9.3708 } },
            { name: 'Tabarka', coordinates: { lat: 36.9544, lng: 8.7578 } }
        ],
        center: { lat: 36.7333, lng: 9.1833 },
        deliveryFee: 9,
        expressDeliveryFee: 18,
        estimatedDeliveryTime: { min: 48, max: 72 },
        displayOrder: 2,
        color: '#F59E0B'
    },
    {
        code: 'TN-SAHEL',
        name: 'Sahel',
        country: 'TN',
        countryName: 'Tunisie',
        cities: [
            { name: 'Sousse', coordinates: { lat: 35.8288, lng: 10.6405 } },
            { name: 'Monastir', coordinates: { lat: 35.7643, lng: 10.8113 } },
            { name: 'Mahdia', coordinates: { lat: 35.5047, lng: 11.0622 } },
            { name: 'Hammamet', coordinates: { lat: 36.4000, lng: 10.6167 } },
            { name: 'Nabeul', coordinates: { lat: 36.4561, lng: 10.7376 } },
            { name: 'Moknine', coordinates: { lat: 35.6333, lng: 10.9000 } }
        ],
        center: { lat: 35.8288, lng: 10.6405 },
        deliveryFee: 8,
        expressDeliveryFee: 15,
        estimatedDeliveryTime: { min: 24, max: 48 },
        displayOrder: 3,
        color: '#10B981'
    },
    {
        code: 'TN-CENTRE',
        name: 'Centre',
        country: 'TN',
        countryName: 'Tunisie',
        cities: [
            { name: 'Kairouan', coordinates: { lat: 35.6781, lng: 10.0963 } },
            { name: 'Kasserine', coordinates: { lat: 35.1676, lng: 8.8365 } },
            { name: 'Sidi Bouzid', coordinates: { lat: 35.0382, lng: 9.4858 } }
        ],
        center: { lat: 35.6781, lng: 10.0963 },
        deliveryFee: 10,
        expressDeliveryFee: 20,
        estimatedDeliveryTime: { min: 48, max: 72 },
        displayOrder: 4,
        color: '#8B5CF6'
    },
    {
        code: 'TN-SFAX',
        name: 'Sfax',
        country: 'TN',
        countryName: 'Tunisie',
        cities: [
            { name: 'Sfax', coordinates: { lat: 34.7406, lng: 10.7603 } },
            { name: 'Sakiet Eddaïer', coordinates: { lat: 34.8000, lng: 10.7667 } },
            { name: 'Sakiet Ezzit', coordinates: { lat: 34.8167, lng: 10.7333 } }
        ],
        center: { lat: 34.7406, lng: 10.7603 },
        deliveryFee: 9,
        expressDeliveryFee: 17,
        estimatedDeliveryTime: { min: 24, max: 48 },
        displayOrder: 5,
        color: '#3B82F6'
    },
    {
        code: 'TN-SUD',
        name: 'Sud',
        country: 'TN',
        countryName: 'Tunisie',
        cities: [
            { name: 'Gabès', coordinates: { lat: 33.8814, lng: 10.0982 } },
            { name: 'Médenine', coordinates: { lat: 33.3547, lng: 10.5053 } },
            { name: 'Tataouine', coordinates: { lat: 32.9297, lng: 10.4517 } },
            { name: 'Tozeur', coordinates: { lat: 33.9197, lng: 8.1339 } },
            { name: 'Gafsa', coordinates: { lat: 34.4250, lng: 8.7842 } },
            { name: 'Kébili', coordinates: { lat: 33.7050, lng: 8.9650 } },
            { name: 'Djerba', coordinates: { lat: 33.8076, lng: 10.8451 } }
        ],
        center: { lat: 33.8814, lng: 10.0982 },
        deliveryFee: 12,
        expressDeliveryFee: 25,
        estimatedDeliveryTime: { min: 72, max: 120 },
        displayOrder: 6,
        color: '#EC4899'
    },

    // ==================== ALGÉRIE ====================
    {
        code: 'DZ-ALGER',
        name: 'Grand Alger',
        country: 'DZ',
        countryName: 'Algérie',
        cities: [
            { name: 'Alger', coordinates: { lat: 36.7538, lng: 3.0588 } },
            { name: 'Blida', coordinates: { lat: 36.4722, lng: 2.8278 } },
            { name: 'Boumerdès', coordinates: { lat: 36.7639, lng: 3.4722 } },
            { name: 'Tipaza', coordinates: { lat: 36.5897, lng: 2.4483 } }
        ],
        center: { lat: 36.7538, lng: 3.0588 },
        deliveryFee: 500,
        expressDeliveryFee: 1000,
        estimatedDeliveryTime: { min: 24, max: 48 },
        displayOrder: 1,
        color: '#059669'
    },
    {
        code: 'DZ-ORAN',
        name: 'Oran',
        country: 'DZ',
        countryName: 'Algérie',
        cities: [
            { name: 'Oran', coordinates: { lat: 35.6969, lng: -0.6331 } },
            { name: 'Aïn Témouchent', coordinates: { lat: 35.2972, lng: -1.1403 } },
            { name: 'Mostaganem', coordinates: { lat: 35.9311, lng: 0.0892 } }
        ],
        center: { lat: 35.6969, lng: -0.6331 },
        deliveryFee: 600,
        expressDeliveryFee: 1200,
        estimatedDeliveryTime: { min: 48, max: 72 },
        displayOrder: 2,
        color: '#0891B2'
    },
    {
        code: 'DZ-CONSTANTINE',
        name: 'Constantine',
        country: 'DZ',
        countryName: 'Algérie',
        cities: [
            { name: 'Constantine', coordinates: { lat: 36.3650, lng: 6.6147 } },
            { name: 'Annaba', coordinates: { lat: 36.9000, lng: 7.7667 } },
            { name: 'Sétif', coordinates: { lat: 36.1898, lng: 5.4108 } }
        ],
        center: { lat: 36.3650, lng: 6.6147 },
        deliveryFee: 600,
        expressDeliveryFee: 1200,
        estimatedDeliveryTime: { min: 48, max: 72 },
        displayOrder: 3,
        color: '#7C3AED'
    },

    // ==================== MAROC ====================
    {
        code: 'MA-CASABLANCA',
        name: 'Grand Casablanca',
        country: 'MA',
        countryName: 'Maroc',
        cities: [
            { name: 'Casablanca', coordinates: { lat: 33.5731, lng: -7.5898 } },
            { name: 'Mohammedia', coordinates: { lat: 33.6861, lng: -7.3828 } },
            { name: 'El Jadida', coordinates: { lat: 33.2316, lng: -8.5007 } }
        ],
        center: { lat: 33.5731, lng: -7.5898 },
        deliveryFee: 30,
        expressDeliveryFee: 60,
        estimatedDeliveryTime: { min: 24, max: 48 },
        displayOrder: 1,
        color: '#DC2626'
    },
    {
        code: 'MA-RABAT',
        name: 'Rabat-Salé',
        country: 'MA',
        countryName: 'Maroc',
        cities: [
            { name: 'Rabat', coordinates: { lat: 34.0209, lng: -6.8416 } },
            { name: 'Salé', coordinates: { lat: 34.0531, lng: -6.7986 } },
            { name: 'Témara', coordinates: { lat: 33.9269, lng: -6.9069 } },
            { name: 'Kénitra', coordinates: { lat: 34.2610, lng: -6.5802 } }
        ],
        center: { lat: 34.0209, lng: -6.8416 },
        deliveryFee: 30,
        expressDeliveryFee: 60,
        estimatedDeliveryTime: { min: 24, max: 48 },
        displayOrder: 2,
        color: '#2563EB'
    },
    {
        code: 'MA-MARRAKECH',
        name: 'Marrakech',
        country: 'MA',
        countryName: 'Maroc',
        cities: [
            { name: 'Marrakech', coordinates: { lat: 31.6295, lng: -7.9811 } },
            { name: 'Safi', coordinates: { lat: 32.2994, lng: -9.2372 } }
        ],
        center: { lat: 31.6295, lng: -7.9811 },
        deliveryFee: 35,
        expressDeliveryFee: 70,
        estimatedDeliveryTime: { min: 48, max: 72 },
        displayOrder: 3,
        color: '#CA8A04'
    },
    {
        code: 'MA-FES',
        name: 'Fès-Meknès',
        country: 'MA',
        countryName: 'Maroc',
        cities: [
            { name: 'Fès', coordinates: { lat: 34.0181, lng: -5.0078 } },
            { name: 'Meknès', coordinates: { lat: 33.8935, lng: -5.5473 } }
        ],
        center: { lat: 34.0181, lng: -5.0078 },
        deliveryFee: 35,
        expressDeliveryFee: 70,
        estimatedDeliveryTime: { min: 48, max: 72 },
        displayOrder: 4,
        color: '#16A34A'
    },
    {
        code: 'MA-TANGER',
        name: 'Tanger-Tétouan',
        country: 'MA',
        countryName: 'Maroc',
        cities: [
            { name: 'Tanger', coordinates: { lat: 35.7595, lng: -5.8340 } },
            { name: 'Tétouan', coordinates: { lat: 35.5785, lng: -5.3684 } }
        ],
        center: { lat: 35.7595, lng: -5.8340 },
        deliveryFee: 40,
        expressDeliveryFee: 80,
        estimatedDeliveryTime: { min: 48, max: 72 },
        displayOrder: 5,
        color: '#9333EA'
    },

    // ==================== LIBYE ====================
    {
        code: 'LY-TRIPOLI',
        name: 'Tripoli',
        country: 'LY',
        countryName: 'Libye',
        cities: [
            { name: 'Tripoli', coordinates: { lat: 32.8872, lng: 13.1913 } },
            { name: 'Misrata', coordinates: { lat: 32.3754, lng: 15.0925 } }
        ],
        center: { lat: 32.8872, lng: 13.1913 },
        deliveryFee: 20,
        expressDeliveryFee: 40,
        estimatedDeliveryTime: { min: 72, max: 120 },
        displayOrder: 1,
        color: '#0D9488'
    },
    {
        code: 'LY-BENGHAZI',
        name: 'Benghazi',
        country: 'LY',
        countryName: 'Libye',
        cities: [
            { name: 'Benghazi', coordinates: { lat: 32.1194, lng: 20.0867 } },
            { name: 'Tobrouk', coordinates: { lat: 32.0836, lng: 23.9764 } }
        ],
        center: { lat: 32.1194, lng: 20.0867 },
        deliveryFee: 25,
        expressDeliveryFee: 50,
        estimatedDeliveryTime: { min: 72, max: 120 },
        displayOrder: 2,
        color: '#4F46E5'
    }
];

// ========================================
// FONCTION DE SEED
// ========================================

async function seedDeliveryZones() {
    try {
        console.log('🔌 Connexion à MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        // Supprimer les zones existantes
        console.log('🗑️  Suppression des zones existantes...');
        await DeliveryZone.deleteMany({});

        // Insérer les nouvelles zones
        console.log('📝 Insertion des nouvelles zones...');
        const result = await DeliveryZone.insertMany(deliveryZonesData);

        console.log(`\n✅ ${result.length} zones de livraison créées avec succès!\n`);

        // Afficher un résumé par pays
        const summary = {};
        for (const zone of result) {
            if (!summary[zone.countryName]) {
                summary[zone.countryName] = [];
            }
            summary[zone.countryName].push(zone.name);
        }

        console.log('📊 Résumé des zones créées:');
        console.log('═'.repeat(50));
        for (const [country, zones] of Object.entries(summary)) {
            console.log(`\n🏳️  ${country}:`);
            zones.forEach(zone => console.log(`   • ${zone}`));
        }
        console.log('\n' + '═'.repeat(50));

    } catch (error) {
        console.error('❌ Erreur lors du seed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Déconnecté de MongoDB');
        process.exit(0);
    }
}

// Exécuter le seed
seedDeliveryZones();
