/**
 * Database Seed Script for Ooryxx E-commerce Platform
 * Run with: node src/seeds/seedDatabase.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Category = require('../models/Category');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ooryxx_db:5qYCF7KHBlxAM97y@ooryxxdb.bf7e27f.mongodb.net/ooryxx?retryWrites=true&w=majority&appName=ooryxxdb';

// =================== SAMPLE DATA ===================

// Users - Extended list
const usersData = [
    // Admin
    { firstName: 'Admin', lastName: 'System', email: 'admin@ooryxx.tn', password: 'Admin123!', role: 'admin', isEmailVerified: true, phoneNumber: '+21671000001' },

    // VIP Customers
    { firstName: 'Ahmed', lastName: 'Ben Ali', email: 'ahmed@example.com', password: 'User123!', role: 'customer_vip', isEmailVerified: true, phoneNumber: '+21698123456' },
    { firstName: 'Fatma', lastName: 'Trabelsi', email: 'fatma@example.com', password: 'User123!', role: 'customer_vip', isEmailVerified: true, phoneNumber: '+21655789012' },
    { firstName: 'Youssef', lastName: 'Mansouri', email: 'youssef@example.com', password: 'User123!', role: 'customer_vip', isEmailVerified: true, phoneNumber: '+21699111222' },

    // Regular Customers (30+)
    { firstName: 'Mohamed', lastName: 'Sahli', email: 'mohamed@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21622345678' },
    { firstName: 'Sara', lastName: 'Hamdi', email: 'sara.h@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21699567890' },
    { firstName: 'Karim', lastName: 'Jebali', email: 'karim.j@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21650234567' },
    { firstName: 'Nadia', lastName: 'Cherif', email: 'nadia.c@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21696890123' },
    { firstName: 'Amine', lastName: 'Bouazizi', email: 'amine.b@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21627456789' },
    { firstName: 'Leila', lastName: 'Khelifi', email: 'leila.k@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21654012345' },
    { firstName: 'Hedi', lastName: 'Messaoudi', email: 'hedi.m@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21691678901' },
    { firstName: 'Salma', lastName: 'Riahi', email: 'salma.r@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21628234567' },
    { firstName: 'Rached', lastName: 'Gharbi', email: 'rached.g@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21655890123' },
    { firstName: 'Ines', lastName: 'Laabidi', email: 'ines.l@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21692456789' },
    { firstName: 'Bilel', lastName: 'Hosni', email: 'bilel.h@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21629012345' },
    { firstName: 'Rim', lastName: 'Ayari', email: 'rim.a@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21656678901' },
    { firstName: 'Wael', lastName: 'Dridi', email: 'wael.d@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21693234567' },
    { firstName: 'Dorra', lastName: 'Sassi', email: 'dorra.s@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21620890123' },
    { firstName: 'Fares', lastName: 'Bouzid', email: 'fares.b@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21657456789' },
    { firstName: 'Marwa', lastName: 'Hajji', email: 'marwa.h@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21694012345' },
    { firstName: 'Sofien', lastName: 'Tlili', email: 'sofien.t@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21621678901' },
    { firstName: 'Olfa', lastName: 'Mejri', email: 'olfa.m@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21658234567' },
    { firstName: 'Hamza', lastName: 'Nasri', email: 'hamza.n@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21695890123' },
    { firstName: 'Asma', lastName: 'Brahmi', email: 'asma.b@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21622456789' },
    { firstName: 'Mehdi', lastName: 'Chaabane', email: 'mehdi.c@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21659012345' },
    { firstName: 'Sarra', lastName: 'Ferchichi', email: 'sarra.f@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21696678901' },
    { firstName: 'Anis', lastName: 'Guesmi', email: 'anis.g@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21623234567' },
    { firstName: 'Hela', lastName: 'Hammami', email: 'hela.h@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21650890123' },
    { firstName: 'Tarek', lastName: 'Issa', email: 'tarek.i@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21697456789' },
    { firstName: 'Emna', lastName: 'Jouini', email: 'emna.j@example.com', password: 'User123!', role: 'customer', isEmailVerified: true, phoneNumber: '+21624012345' },

    // Vendors
    { firstName: 'Vendor', lastName: 'TechStore', email: 'vendor@techstore.tn', password: 'Vendor123!', role: 'vendor', isEmailVerified: true, phoneNumber: '+21671234567' },
    { firstName: 'Vendor', lastName: 'FashionHouse', email: 'vendor@fashionhouse.tn', password: 'Vendor123!', role: 'vendor', isEmailVerified: true, phoneNumber: '+21672345678' },
    { firstName: 'Vendor', lastName: 'BeautyCorner', email: 'vendor@beautycorner.tn', password: 'Vendor123!', role: 'vendor', isEmailVerified: true, phoneNumber: '+21673456789' },
    { firstName: 'Vendor', lastName: 'SportZone', email: 'vendor@sportzone.tn', password: 'Vendor123!', role: 'vendor', isEmailVerified: true, phoneNumber: '+21674567890' },
    { firstName: 'Vendor', lastName: 'HomeDecor', email: 'vendor@homedecor.tn', password: 'Vendor123!', role: 'vendor', isEmailVerified: true, phoneNumber: '+21675678901' },
    { firstName: 'Vendor', lastName: 'BookWorld', email: 'vendor@bookworld.tn', password: 'Vendor123!', role: 'vendor', isEmailVerified: true, phoneNumber: '+21676789012' },
    { firstName: 'Vendor', lastName: 'GourmetFood', email: 'vendor@gourmetfood.tn', password: 'Vendor123!', role: 'vendor', isEmailVerified: true, phoneNumber: '+21677890123' },
    { firstName: 'Vendor', lastName: 'KidsParadise', email: 'vendor@kidsparadise.tn', password: 'Vendor123!', role: 'vendor', isEmailVerified: true, phoneNumber: '+21678901234' }
];

// Categories - Extended
const categoriesData = [
    { name: 'Électronique', slug: 'electronique', description: 'Smartphones, tablettes et gadgets', icon: 'device-mobile' },
    { name: 'Informatique', slug: 'informatique', description: 'Ordinateurs et accessoires', icon: 'computer-desktop' },
    { name: 'Mode Femme', slug: 'mode-femme', description: 'Vêtements et accessoires femme', icon: 'sparkles' },
    { name: 'Mode Homme', slug: 'mode-homme', description: 'Vêtements et accessoires homme', icon: 'user' },
    { name: 'Beauté & Soins', slug: 'beaute', description: 'Cosmétiques et soins personnels', icon: 'heart' },
    { name: 'Sport & Fitness', slug: 'sport', description: 'Équipement sportif', icon: 'fire' },
    { name: 'Maison & Déco', slug: 'maison', description: 'Décoration et meubles', icon: 'home' },
    { name: 'Livres & Culture', slug: 'livres', description: 'Livres, magazines et culture', icon: 'book-open' },
    { name: 'Alimentation', slug: 'alimentation', description: 'Produits alimentaires gourmet', icon: 'cake' },
    { name: 'Enfants & Bébés', slug: 'enfants', description: 'Jouets et articles bébé', icon: 'puzzle-piece' },
    { name: 'Montres & Bijoux', slug: 'montres-bijoux', description: 'Montres et bijoux de luxe', icon: 'clock' },
    { name: 'Auto & Moto', slug: 'auto-moto', description: 'Accessoires automobile', icon: 'truck' }
];

// Vendors data - with complete companyInfo
const vendorsData = [
    {
        storeName: 'Tech Store TN',
        description: 'Leader en électronique et high-tech',
        category: 'Électronique',
        status: 'approved',
        commission: 10,
        rating: 4.8,
        totalSales: 1892,
        revenue: 425680,
        companyInfo: {
            name: 'Tech Store SARL',
            description: 'Leader en électronique et high-tech en Tunisie',
            phone: '+21671234567',
            email: 'contact@techstore.tn',
            address: { street: '15 Avenue Habib Bourguiba', city: 'Tunis', postalCode: '1000', country: 'Tunisie' }
        }
    },
    {
        storeName: 'Fashion House',
        description: 'Mode tendance pour tous',
        category: 'Mode Femme',
        status: 'approved',
        commission: 12,
        rating: 4.6,
        totalSales: 1567,
        revenue: 189540,
        companyInfo: {
            name: 'Fashion House & Co',
            description: 'Mode tendance pour toute la famille',
            phone: '+21672345678',
            email: 'contact@fashionhouse.tn',
            address: { street: '48 Rue de Marseille', city: 'Tunis', postalCode: '1002', country: 'Tunisie' }
        }
    },
    {
        storeName: 'Beauty Corner',
        description: 'Cosmétiques naturels et bio',
        category: 'Beauté & Soins',
        status: 'approved',
        commission: 15,
        rating: 4.7,
        totalSales: 2340,
        revenue: 156890,
        companyInfo: {
            name: 'Beauty Corner Tunisia',
            description: 'Cosmétiques naturels et bio certifiés',
            phone: '+21673456789',
            email: 'contact@beautycorner.tn',
            address: { street: '22 Avenue de la Liberté', city: 'Sousse', postalCode: '4000', country: 'Tunisie' }
        }
    },
    {
        storeName: 'Sport Zone',
        description: 'Tout pour le sport',
        category: 'Sport & Fitness',
        status: 'approved',
        commission: 10,
        rating: 4.5,
        totalSales: 890,
        revenue: 134560,
        companyInfo: {
            name: 'Sport Zone SARL',
            description: 'Équipement sportif professionnel',
            phone: '+21674567890',
            email: 'contact@sportzone.tn',
            address: { street: '5 Rue du Sport', city: 'Sfax', postalCode: '3000', country: 'Tunisie' }
        }
    },
    {
        storeName: 'Home Decor Plus',
        description: 'Décoration intérieure moderne',
        category: 'Maison & Déco',
        status: 'approved',
        commission: 12,
        rating: 4.4,
        totalSales: 456,
        revenue: 98760,
        companyInfo: {
            name: 'Home Decor Plus',
            description: 'Décoration intérieure moderne et élégante',
            phone: '+21675678901',
            email: 'contact@homedecor.tn',
            address: { street: '78 Avenue de Carthage', city: 'La Marsa', postalCode: '2078', country: 'Tunisie' }
        }
    },
    {
        storeName: 'Book World',
        description: 'Librairie en ligne',
        category: 'Livres & Culture',
        status: 'approved',
        commission: 8,
        rating: 4.9,
        totalSales: 3456,
        revenue: 67890,
        companyInfo: {
            name: 'Book World Tunisia',
            description: 'La plus grande librairie en ligne de Tunisie',
            phone: '+21676789012',
            email: 'contact@bookworld.tn',
            address: { street: '12 Rue Ibn Khaldoun', city: 'Tunis', postalCode: '1001', country: 'Tunisie' }
        }
    },
    {
        storeName: 'Gourmet Food TN',
        description: 'Produits alimentaires premium',
        category: 'Alimentation',
        status: 'pending',
        commission: 10,
        rating: 0,
        totalSales: 0,
        revenue: 0,
        companyInfo: {
            name: 'Gourmet Food Tunisia',
            description: 'Produits alimentaires premium et gourmet',
            phone: '+21677890123',
            email: 'contact@gourmetfood.tn',
            address: { street: '33 Rue Ali Belhouane', city: 'Monastir', postalCode: '5000', country: 'Tunisie' }
        }
    },
    {
        storeName: 'Kids Paradise',
        description: 'Jouets et articles enfants',
        category: 'Enfants & Bébés',
        status: 'pending',
        commission: 12,
        rating: 0,
        totalSales: 0,
        revenue: 0,
        companyInfo: {
            name: 'Kids Paradise SARL',
            description: 'Jouets et articles pour enfants de qualité',
            phone: '+21678901234',
            email: 'contact@kidsparadise.tn',
            address: { street: '8 Avenue Farhat Hached', city: 'Bizerte', postalCode: '7000', country: 'Tunisie' }
        }
    }
];

// Products - 100+ products
const productsData = [
    // ===== TECH STORE (Vendor 0) =====
    { title: 'iPhone 15 Pro Max 256GB Titane', description: 'Apple iPhone 15 Pro Max avec puce A17 Pro, écran Super Retina XDR 6.7", caméra 48MP.', price: 3999, originalPrice: 4299, category: 'Électronique', stock: 25, vendorIndex: 0, images: ['https://picsum.photos/seed/iphone15/600'], isFeatured: true },
    { title: 'iPhone 15 Pro 128GB Bleu', description: 'iPhone 15 Pro avec titane, Action button et USB-C.', price: 3499, originalPrice: 3799, category: 'Électronique', stock: 18, vendorIndex: 0, images: ['https://picsum.photos/seed/iphone15pro/600'], isFeatured: true },
    { title: 'iPhone 15 128GB Rose', description: 'iPhone 15 avec Dynamic Island et caméra 48MP.', price: 2799, originalPrice: 2999, category: 'Électronique', stock: 30, vendorIndex: 0, images: ['https://picsum.photos/seed/iphone15rose/600'], isFeatured: false },
    { title: 'Samsung Galaxy S24 Ultra 256GB', description: 'Galaxy S24 Ultra avec S Pen, caméra 200MP et Galaxy AI.', price: 3599, originalPrice: 3899, category: 'Électronique', stock: 20, vendorIndex: 0, images: ['https://picsum.photos/seed/s24ultra/600'], isFeatured: true },
    { title: 'Samsung Galaxy S24+ 256GB', description: 'Galaxy S24+ avec écran 6.7" et triple caméra.', price: 2899, originalPrice: 3199, category: 'Électronique', stock: 22, vendorIndex: 0, images: ['https://picsum.photos/seed/s24plus/600'], isFeatured: false },
    { title: 'Samsung Galaxy Z Fold5', description: 'Smartphone pliable premium avec Flex Mode.', price: 4999, originalPrice: 5499, category: 'Électronique', stock: 8, vendorIndex: 0, images: ['https://picsum.photos/seed/zfold5/600'], isFeatured: true },
    { title: 'MacBook Air M3 15"', description: 'MacBook Air avec puce M3, 15.3" Liquid Retina, 18h autonomie.', price: 4299, originalPrice: 4599, category: 'Informatique', stock: 15, vendorIndex: 0, images: ['https://picsum.photos/seed/macm3/600'], isFeatured: true },
    { title: 'MacBook Pro 14" M3 Pro', description: 'MacBook Pro avec puce M3 Pro, 18GB RAM, 512GB SSD.', price: 6499, originalPrice: 6999, category: 'Informatique', stock: 10, vendorIndex: 0, images: ['https://picsum.photos/seed/mbprom3/600'], isFeatured: true },
    { title: 'MacBook Pro 16" M3 Max', description: 'Le Mac portable le plus puissant avec M3 Max.', price: 9999, originalPrice: 10499, category: 'Informatique', stock: 5, vendorIndex: 0, images: ['https://picsum.photos/seed/mbprom3max/600'], isFeatured: false },
    { title: 'iPad Pro M2 12.9"', description: 'iPad Pro avec puce M2, Liquid Retina XDR.', price: 3499, originalPrice: 3799, category: 'Informatique', stock: 12, vendorIndex: 0, images: ['https://picsum.photos/seed/ipadpro/600'], isFeatured: true },
    { title: 'iPad Air M1 10.9"', description: 'iPad Air avec puce M1 et Touch ID.', price: 1999, originalPrice: 2199, category: 'Informatique', stock: 25, vendorIndex: 0, images: ['https://picsum.photos/seed/ipadair/600'], isFeatured: false },
    { title: 'Apple Watch Ultra 2', description: 'Montre connectée robuste pour les aventuriers.', price: 2499, originalPrice: 2699, category: 'Électronique', stock: 18, vendorIndex: 0, images: ['https://picsum.photos/seed/watchultra/600'], isFeatured: true },
    { title: 'Apple Watch Series 9', description: 'Apple Watch avec puce S9 et double tap.', price: 1299, originalPrice: 1449, category: 'Électronique', stock: 35, vendorIndex: 0, images: ['https://picsum.photos/seed/watch9/600'], isFeatured: false },
    { title: 'AirPods Pro 2 USB-C', description: 'AirPods Pro avec réduction active du bruit.', price: 749, originalPrice: 849, category: 'Électronique', stock: 50, vendorIndex: 0, images: ['https://picsum.photos/seed/airpodspro/600'], isFeatured: true },
    { title: 'AirPods Max Argent', description: 'Casque audio premium avec spatial audio.', price: 1799, originalPrice: 1999, category: 'Électronique', stock: 12, vendorIndex: 0, images: ['https://picsum.photos/seed/airpodsmax/600'], isFeatured: false },
    { title: 'Sony WH-1000XM5', description: 'Casque sans fil premium avec ANC leader.', price: 999, originalPrice: 1199, category: 'Électronique', stock: 28, vendorIndex: 0, images: ['https://picsum.photos/seed/sonyxm5/600'], isFeatured: true },
    { title: 'PlayStation 5 Slim', description: 'Console PS5 version slim avec SSD 1TB.', price: 1499, originalPrice: 1699, category: 'Électronique', stock: 15, vendorIndex: 0, images: ['https://picsum.photos/seed/ps5slim/600'], isFeatured: true },
    { title: 'Nintendo Switch OLED', description: 'Console hybride avec écran OLED 7".', price: 999, originalPrice: 1099, category: 'Électronique', stock: 22, vendorIndex: 0, images: ['https://picsum.photos/seed/switcholed/600'], isFeatured: false },
    { title: 'DJI Mini 4 Pro', description: 'Drone compact 4K avec évitement obstacles.', price: 2599, originalPrice: 2899, category: 'Électronique', stock: 8, vendorIndex: 0, images: ['https://picsum.photos/seed/djimini4/600'], isFeatured: true },
    { title: 'GoPro Hero 12 Black', description: 'Caméra action 5.3K avec stabilisation HyperSmooth.', price: 1199, originalPrice: 1399, category: 'Électronique', stock: 20, vendorIndex: 0, images: ['https://picsum.photos/seed/gopro12/600'], isFeatured: false },

    // ===== FASHION HOUSE (Vendor 1) =====
    { title: 'Robe d\'été florale', description: 'Robe légère 100% coton bio, motif floral exclusif.', price: 89, originalPrice: 129, category: 'Mode Femme', stock: 60, vendorIndex: 1, images: ['https://picsum.photos/seed/robe1/600'], isFeatured: true },
    { title: 'Robe de soirée noire', description: 'Robe élégante pour occasions spéciales.', price: 199, originalPrice: 279, category: 'Mode Femme', stock: 25, vendorIndex: 1, images: ['https://picsum.photos/seed/robesoiree/600'], isFeatured: true },
    { title: 'Ensemble tailleur femme', description: 'Tailleur pantalon chic pour le bureau.', price: 299, originalPrice: 399, category: 'Mode Femme', stock: 18, vendorIndex: 1, images: ['https://picsum.photos/seed/tailleur/600'], isFeatured: false },
    { title: 'Jean slim taille haute', description: 'Jean stretch confortable, coupe flatteuse.', price: 79, originalPrice: 99, category: 'Mode Femme', stock: 80, vendorIndex: 1, images: ['https://picsum.photos/seed/jeanfemme/600'], isFeatured: true },
    { title: 'Blouse en soie', description: 'Blouse légère 100% soie naturelle.', price: 149, originalPrice: 189, category: 'Mode Femme', stock: 35, vendorIndex: 1, images: ['https://picsum.photos/seed/blouse/600'], isFeatured: false },
    { title: 'Manteau laine camel', description: 'Manteau classique en laine mélangée.', price: 349, originalPrice: 449, category: 'Mode Femme', stock: 15, vendorIndex: 1, images: ['https://picsum.photos/seed/manteau/600'], isFeatured: true },
    { title: 'Blazer homme marine', description: 'Blazer coupe slim pour le bureau.', price: 249, originalPrice: 299, category: 'Mode Homme', stock: 40, vendorIndex: 1, images: ['https://picsum.photos/seed/blazer/600'], isFeatured: true },
    { title: 'Costume 3 pièces gris', description: 'Costume complet avec gilet, coupe moderne.', price: 499, originalPrice: 649, category: 'Mode Homme', stock: 12, vendorIndex: 1, images: ['https://picsum.photos/seed/costume/600'], isFeatured: true },
    { title: 'Chemise Oxford blanche', description: 'Chemise classique en coton Oxford.', price: 69, originalPrice: 89, category: 'Mode Homme', stock: 100, vendorIndex: 1, images: ['https://picsum.photos/seed/chemise/600'], isFeatured: false },
    { title: 'Polo Ralph Lauren', description: 'Polo premium coupe regular.', price: 129, originalPrice: 159, category: 'Mode Homme', stock: 55, vendorIndex: 1, images: ['https://picsum.photos/seed/polo/600'], isFeatured: true },
    { title: 'Jean homme straight', description: 'Jean coupe droite classique.', price: 89, originalPrice: 119, category: 'Mode Homme', stock: 70, vendorIndex: 1, images: ['https://picsum.photos/seed/jeanhomme/600'], isFeatured: false },
    { title: 'Sneakers blanches cuir', description: 'Sneakers minimalistes en cuir.', price: 159, originalPrice: 199, category: 'Mode Homme', stock: 65, vendorIndex: 1, images: ['https://picsum.photos/seed/sneakers/600'], isFeatured: true },
    { title: 'Sac à main cuir noir', description: 'Sac besace en cuir véritable.', price: 299, originalPrice: 399, category: 'Mode Femme', stock: 25, vendorIndex: 1, images: ['https://picsum.photos/seed/sacmain/600'], isFeatured: true },
    { title: 'Ceinture cuir homme', description: 'Ceinture en cuir italien.', price: 79, originalPrice: 99, category: 'Mode Homme', stock: 45, vendorIndex: 1, images: ['https://picsum.photos/seed/ceinture/600'], isFeatured: false },
    { title: 'Écharpe cachemire', description: 'Écharpe douce en cachemire.', price: 149, originalPrice: 199, category: 'Mode Femme', stock: 30, vendorIndex: 1, images: ['https://picsum.photos/seed/echarpe/600'], isFeatured: false },

    // ===== BEAUTY CORNER (Vendor 2) =====
    { title: 'Sérum Vitamine C 20%', description: 'Sérum anti-âge éclaircissant naturel.', price: 89, originalPrice: 119, category: 'Beauté & Soins', stock: 120, vendorIndex: 2, images: ['https://picsum.photos/seed/serumc/600'], isFeatured: true },
    { title: 'Crème hydratante bio', description: 'Crème visage aux ingrédients naturels.', price: 59, originalPrice: 79, category: 'Beauté & Soins', stock: 150, vendorIndex: 2, images: ['https://picsum.photos/seed/cremebio/600'], isFeatured: true },
    { title: 'Huile argan pure', description: 'Huile d\'argan marocaine 100% pure.', price: 49, originalPrice: 69, category: 'Beauté & Soins', stock: 200, vendorIndex: 2, images: ['https://picsum.photos/seed/argan/600'], isFeatured: false },
    { title: 'Masque visage purifiant', description: 'Masque à l\'argile verte détox.', price: 29, originalPrice: 39, category: 'Beauté & Soins', stock: 180, vendorIndex: 2, images: ['https://picsum.photos/seed/masque/600'], isFeatured: true },
    { title: 'Palette maquillage nude', description: 'Palette 12 teintes nude naturelles.', price: 79, originalPrice: 99, category: 'Beauté & Soins', stock: 85, vendorIndex: 2, images: ['https://picsum.photos/seed/palette/600'], isFeatured: true },
    { title: 'Rouge à lèvres mat', description: 'Rouge à lèvres longue tenue sans transfert.', price: 35, originalPrice: 45, category: 'Beauté & Soins', stock: 220, vendorIndex: 2, images: ['https://picsum.photos/seed/rouge/600'], isFeatured: false },
    { title: 'Parfum femme floral', description: 'Eau de parfum notes florales 100ml.', price: 149, originalPrice: 189, category: 'Beauté & Soins', stock: 60, vendorIndex: 2, images: ['https://picsum.photos/seed/parfumf/600'], isFeatured: true },
    { title: 'Parfum homme boisé', description: 'Eau de toilette notes boisées 100ml.', price: 129, originalPrice: 169, category: 'Beauté & Soins', stock: 55, vendorIndex: 2, images: ['https://picsum.photos/seed/parfumh/600'], isFeatured: false },
    { title: 'Brosse à cheveux ionique', description: 'Brosse démêlante anti-frisottis.', price: 45, originalPrice: 59, category: 'Beauté & Soins', stock: 100, vendorIndex: 2, images: ['https://picsum.photos/seed/brosse/600'], isFeatured: false },
    { title: 'Set soins complet', description: 'Coffret routine beauté 5 produits.', price: 199, originalPrice: 279, category: 'Beauté & Soins', stock: 40, vendorIndex: 2, images: ['https://picsum.photos/seed/coffret/600'], isFeatured: true },

    // ===== SPORT ZONE (Vendor 3) =====
    { title: 'Tapis de yoga premium', description: 'Tapis antidérapant 6mm éco-responsable.', price: 69, originalPrice: 89, category: 'Sport & Fitness', stock: 80, vendorIndex: 3, images: ['https://picsum.photos/seed/tapisyoga/600'], isFeatured: true },
    { title: 'Haltères ajustables 24kg', description: 'Paire d\'haltères réglables 2-24kg.', price: 299, originalPrice: 399, category: 'Sport & Fitness', stock: 25, vendorIndex: 3, images: ['https://picsum.photos/seed/halteres/600'], isFeatured: true },
    { title: 'Vélo d\'appartement', description: 'Vélo spinning écran LCD.', price: 499, originalPrice: 699, category: 'Sport & Fitness', stock: 15, vendorIndex: 3, images: ['https://picsum.photos/seed/velo/600'], isFeatured: true },
    { title: 'Tapis de course pliable', description: 'Tapis roulant motorisé 12km/h.', price: 799, originalPrice: 999, category: 'Sport & Fitness', stock: 10, vendorIndex: 3, images: ['https://picsum.photos/seed/tapiscourse/600'], isFeatured: false },
    { title: 'Bandes de résistance set', description: 'Kit 5 élastiques multi-résistance.', price: 39, originalPrice: 49, category: 'Sport & Fitness', stock: 150, vendorIndex: 3, images: ['https://picsum.photos/seed/bandes/600'], isFeatured: false },
    { title: 'Raquette tennis Wilson', description: 'Raquette pro en graphite.', price: 149, originalPrice: 189, category: 'Sport & Fitness', stock: 35, vendorIndex: 3, images: ['https://picsum.photos/seed/raquette/600'], isFeatured: true },
    { title: 'Ballon football officiel', description: 'Ballon taille 5 match quality.', price: 45, originalPrice: 59, category: 'Sport & Fitness', stock: 100, vendorIndex: 3, images: ['https://picsum.photos/seed/ballon/600'], isFeatured: false },
    { title: 'Running shoes Nike', description: 'Chaussures course légères.', price: 179, originalPrice: 219, category: 'Sport & Fitness', stock: 60, vendorIndex: 3, images: ['https://picsum.photos/seed/running/600'], isFeatured: true },
    { title: 'Montre GPS Garmin', description: 'Montre running avec GPS intégré.', price: 349, originalPrice: 449, category: 'Sport & Fitness', stock: 22, vendorIndex: 3, images: ['https://picsum.photos/seed/garmin/600'], isFeatured: true },
    { title: 'Sac de sport Nike', description: 'Sac training grande capacité 60L.', price: 79, originalPrice: 99, category: 'Sport & Fitness', stock: 70, vendorIndex: 3, images: ['https://picsum.photos/seed/sacsport/600'], isFeatured: false },

    // ===== HOME DECOR (Vendor 4) =====
    { title: 'Canapé 3 places gris', description: 'Canapé moderne tissu doux.', price: 899, originalPrice: 1199, category: 'Maison & Déco', stock: 8, vendorIndex: 4, images: ['https://picsum.photos/seed/canape/600'], isFeatured: true },
    { title: 'Table basse scandinave', description: 'Table bois chêne naturel.', price: 249, originalPrice: 349, category: 'Maison & Déco', stock: 15, vendorIndex: 4, images: ['https://picsum.photos/seed/table/600'], isFeatured: true },
    { title: 'Lampe design LED', description: 'Lampadaire moderne dimmable.', price: 149, originalPrice: 199, category: 'Maison & Déco', stock: 30, vendorIndex: 4, images: ['https://picsum.photos/seed/lampe/600'], isFeatured: false },
    { title: 'Miroir rond doré', description: 'Miroir mural cadre laiton 80cm.', price: 129, originalPrice: 169, category: 'Maison & Déco', stock: 25, vendorIndex: 4, images: ['https://picsum.photos/seed/miroir/600'], isFeatured: true },
    { title: 'Tapis berbère', description: 'Tapis fait main 200x300cm.', price: 399, originalPrice: 549, category: 'Maison & Déco', stock: 12, vendorIndex: 4, images: ['https://picsum.photos/seed/tapis/600'], isFeatured: true },
    { title: 'Coussin velours', description: 'Lot de 2 coussins 45x45cm.', price: 49, originalPrice: 69, category: 'Maison & Déco', stock: 80, vendorIndex: 4, images: ['https://picsum.photos/seed/coussin/600'], isFeatured: false },
    { title: 'Vase céramique artisanal', description: 'Vase fait main style méditerranéen.', price: 79, originalPrice: 99, category: 'Maison & Déco', stock: 40, vendorIndex: 4, images: ['https://picsum.photos/seed/vase/600'], isFeatured: false },
    { title: 'Étagère murale bois', description: 'Étagère flottante chêne 120cm.', price: 89, originalPrice: 119, category: 'Maison & Déco', stock: 35, vendorIndex: 4, images: ['https://picsum.photos/seed/etagere/600'], isFeatured: true },
    { title: 'Parure de lit premium', description: 'Housse de couette + taies 240x220.', price: 129, originalPrice: 169, category: 'Maison & Déco', stock: 45, vendorIndex: 4, images: ['https://picsum.photos/seed/parure/600'], isFeatured: false },
    { title: 'Plante artificielle', description: 'Ficus artificiel 150cm avec pot.', price: 99, originalPrice: 129, category: 'Maison & Déco', stock: 50, vendorIndex: 4, images: ['https://picsum.photos/seed/plante/600'], isFeatured: false },

    // ===== BOOK WORLD (Vendor 5) =====
    { title: 'Coffret Harry Potter', description: 'Intégrale 7 tomes édition collector.', price: 149, originalPrice: 189, category: 'Livres & Culture', stock: 30, vendorIndex: 5, images: ['https://picsum.photos/seed/harrypotter/600'], isFeatured: true },
    { title: 'Le Petit Prince illustré', description: 'Édition de luxe illustrée.', price: 39, originalPrice: 49, category: 'Livres & Culture', stock: 80, vendorIndex: 5, images: ['https://picsum.photos/seed/petitprince/600'], isFeatured: true },
    { title: 'Développement personnel', description: 'Best-seller motivation et succès.', price: 29, originalPrice: 35, category: 'Livres & Culture', stock: 120, vendorIndex: 5, images: ['https://picsum.photos/seed/devperso/600'], isFeatured: false },
    { title: 'Roman policier thriller', description: 'Dernier thriller de l\'année.', price: 25, originalPrice: 32, category: 'Livres & Culture', stock: 100, vendorIndex: 5, images: ['https://picsum.photos/seed/thriller/600'], isFeatured: true },
    { title: 'Livre de cuisine', description: 'Recettes méditerranéennes.', price: 45, originalPrice: 59, category: 'Livres & Culture', stock: 55, vendorIndex: 5, images: ['https://picsum.photos/seed/cuisine/600'], isFeatured: false },
    { title: 'BD manga One Piece', description: 'Tome 1 édition originale.', price: 15, originalPrice: 19, category: 'Livres & Culture', stock: 200, vendorIndex: 5, images: ['https://picsum.photos/seed/manga/600'], isFeatured: true },
    { title: 'Album enfant illustré', description: 'Livre interactif 3-6 ans.', price: 19, originalPrice: 25, category: 'Livres & Culture', stock: 90, vendorIndex: 5, images: ['https://picsum.photos/seed/albumenfant/600'], isFeatured: false },
    { title: 'Dictionnaire français', description: 'Édition 2024 complète.', price: 35, originalPrice: 45, category: 'Livres & Culture', stock: 65, vendorIndex: 5, images: ['https://picsum.photos/seed/dico/600'], isFeatured: false },

    // ===== ADDITIONAL PRODUCTS FOR VARIETY =====
    { title: 'Montre luxe homme', description: 'Montre automatique acier inoxydable.', price: 599, originalPrice: 799, category: 'Montres & Bijoux', stock: 10, vendorIndex: 1, images: ['https://picsum.photos/seed/montreluxe/600'], isFeatured: true },
    { title: 'Collier or 18 carats', description: 'Collier pendentif or jaune.', price: 449, originalPrice: 599, category: 'Montres & Bijoux', stock: 8, vendorIndex: 1, images: ['https://picsum.photos/seed/collier/600'], isFeatured: true },
    { title: 'Bracelet argent femme', description: 'Bracelet jonc argent 925.', price: 89, originalPrice: 119, category: 'Montres & Bijoux', stock: 35, vendorIndex: 1, images: ['https://picsum.photos/seed/bracelet/600'], isFeatured: false },
    { title: 'Boucles d\'oreilles perles', description: 'Boucles perles eau douce.', price: 129, originalPrice: 169, category: 'Montres & Bijoux', stock: 25, vendorIndex: 1, images: ['https://picsum.photos/seed/boucles/600'], isFeatured: false }
];

// =================== SEED FUNCTION ===================

async function seedDatabase() {
    try {
        console.log('🔌 Connexion à MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB\n');

        // Clear existing data
        console.log('🗑️  Suppression des données existantes...');
        await Promise.all([
            User.deleteMany({}),
            Vendor.deleteMany({}),
            Product.deleteMany({}),
            Category.deleteMany({})
        ]);
        console.log('✅ Données supprimées\n');

        // Create categories
        console.log('📁 Création des catégories...');
        const categories = await Category.insertMany(categoriesData);
        console.log(`   ✅ ${categories.length} catégories créées`);

        // Create users (using create() to trigger pre-save hook for password hashing)
        console.log('👥 Création des utilisateurs...');
        const createdUsers = [];
        for (const userData of usersData) {
            const user = await User.create(userData);
            createdUsers.push(user);
        }
        console.log(`   ✅ ${createdUsers.length} utilisateurs créés`);

        // Create vendors
        console.log('🏪 Création des vendeurs...');
        const vendorUsers = createdUsers.filter(u => u.role === 'vendor');
        const createdVendors = [];

        for (let i = 0; i < vendorsData.length; i++) {
            const vendorData = vendorsData[i];
            const vendorUser = vendorUsers[i];
            const category = categories.find(c => c.name === vendorData.category);

            const vendor = await Vendor.create({
                userId: vendorUser._id,
                companyInfo: vendorData.companyInfo,
                status: vendorData.status,
                stats: {
                    totalSales: vendorData.revenue || 0,
                    totalOrders: vendorData.totalSales || 0,
                    totalProducts: 0,
                    rating: vendorData.rating || 0,
                    reviewCount: Math.floor(Math.random() * 500)
                },
                commission: {
                    rate: vendorData.commission || 10,
                    type: 'percentage'
                },
                allowedCategories: category ? [category._id] : [],
                isActive: true
            });
            createdVendors.push(vendor);
        }
        console.log(`   ✅ ${createdVendors.length} vendeurs créés`);

        // Create products
        console.log('📦 Création des produits...');
        let productCount = 0;

        for (const productData of productsData) {
            const vendor = createdVendors[productData.vendorIndex];
            const category = categories.find(c => c.name === productData.category);

            if (vendor && vendor.status === 'approved') {
                const discountPercent = Math.round(((productData.originalPrice - productData.price) / productData.originalPrice) * 100);

                await Product.create({
                    vendorId: vendor._id,
                    title: productData.title,
                    description: productData.description,
                    images: productData.images.map((url, idx) => ({
                        url,
                        alt: productData.title,
                        isPrimary: idx === 0
                    })),
                    category: category?._id,
                    price: productData.price,
                    discount: {
                        percentage: discountPercent,
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                    },
                    stock: productData.stock,
                    status: 'active',
                    isPublished: true,
                    publishedAt: new Date(),
                    featured: productData.isFeatured || false,
                    rating: Math.random() * 2 + 3, // 3-5 rating
                    reviewCount: Math.floor(Math.random() * 100),
                    views: Math.floor(Math.random() * 1000),
                    totalSales: Math.floor(Math.random() * 200)
                });
                productCount++;
            }
        }
        console.log(`   ✅ ${productCount} produits créés`);

        // Get all products for orders and carts
        const allProducts = await Product.find({});
        const customerUsers = createdUsers.filter(u => u.role === 'customer' || u.role === 'customer_vip');

        // =================== CREATE ORDERS (500+) ===================
        console.log('🛒 Création des commandes...');
        const Order = require('../models/Order');
        await Order.deleteMany({});

        const orderStatuses = ['pending', 'confirmed', 'processing', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
        const paymentMethods = ['stripe', 'paypal', 'cash_on_delivery', 'poste_tunisienne'];
        const paymentStatuses = ['pending', 'processing', 'completed', 'failed'];
        const cities = ['Tunis', 'Sousse', 'Sfax', 'Bizerte', 'Monastir', 'Gabès', 'Kairouan', 'Nabeul', 'Ariana', 'Ben Arous'];

        let orderCount = 0;
        const ordersToCreate = [];

        // Create 500+ orders
        for (let i = 0; i < 500; i++) {
            const customer = customerUsers[Math.floor(Math.random() * customerUsers.length)];
            const numItems = Math.floor(Math.random() * 4) + 1; // 1-4 items per order
            const items = [];
            let subtotal = 0;

            for (let j = 0; j < numItems; j++) {
                const product = allProducts[Math.floor(Math.random() * allProducts.length)];
                const quantity = Math.floor(Math.random() * 3) + 1;
                const itemPrice = product.price;
                const itemSubtotal = itemPrice * quantity;
                subtotal += itemSubtotal;

                items.push({
                    productId: product._id,
                    title: product.title,
                    image: product.images[0]?.url || 'https://picsum.photos/seed/product/300',
                    price: itemPrice,
                    quantity,
                    discount: 0,
                    subtotal: itemSubtotal,
                    vendorId: product.vendorId
                });
            }

            const shippingCost = Math.random() > 0.3 ? 7 : 0; // 70% have shipping
            const city = cities[Math.floor(Math.random() * cities.length)];
            const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
            const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
            const paymentStatus = status === 'delivered' ? 'completed' : paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];

            // Random date in the past 90 days
            const createdAt = new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000));

            // Generate unique codes
            const timestamp = Date.now().toString(36).toUpperCase();
            const random1 = Math.random().toString(36).substring(2, 6).toUpperCase();
            const random2 = Math.random().toString(36).substring(2, 6).toUpperCase();
            const random3 = Math.random().toString(36).substring(2, 8).toUpperCase();

            ordersToCreate.push({
                userId: customer._id,
                vendorId: items[0].vendorId,
                orderNumber: `ORD-${timestamp}-${random1}-${i}`,
                clientCode: `CLT-${random2}`,
                deliveryCode: `LIV-${random3}`,
                items,
                shippingAddress: {
                    recipientName: `${customer.firstName} ${customer.lastName}`,
                    phone: customer.phoneNumber || '+21698000000',
                    street: `${Math.floor(Math.random() * 100) + 1} Rue ${['de la Liberté', 'Habib Bourguiba', 'Ibn Khaldoun', 'de Marseille', 'Ali Belhouane'][Math.floor(Math.random() * 5)]}`,
                    city,
                    postalCode: String(1000 + Math.floor(Math.random() * 8000)),
                    country: 'Tunisie'
                },
                subtotal,
                shippingCost,
                tax: 0,
                discount: Math.random() > 0.7 ? Math.floor(subtotal * 0.1) : 0, // 30% have discount
                totalAmount: subtotal + shippingCost,
                paymentMethod,
                paymentStatus,
                status,
                statusHistory: [{
                    status: 'pending',
                    date: createdAt,
                    note: 'Commande créée'
                }],
                createdAt,
                updatedAt: createdAt
            });
            orderCount++;
        }

        await Order.insertMany(ordersToCreate);
        console.log(`   ✅ ${orderCount} commandes créées`);

        // =================== CREATE CARTS (50+) ===================
        console.log('🛍️  Création des paniers...');
        const Cart = require('../models/Cart');
        await Cart.deleteMany({});

        const cartsToCreate = [];
        const usersWithCarts = customerUsers.slice(0, 50); // First 50 customers get carts

        for (const user of usersWithCarts) {
            const numItems = Math.floor(Math.random() * 5) + 1; // 1-5 items
            const items = [];
            let estimatedTotal = 0;

            const usedProducts = new Set();
            for (let j = 0; j < numItems; j++) {
                let product;
                do {
                    product = allProducts[Math.floor(Math.random() * allProducts.length)];
                } while (usedProducts.has(product._id.toString()) && usedProducts.size < allProducts.length);

                usedProducts.add(product._id.toString());
                const quantity = Math.floor(Math.random() * 3) + 1;
                const price = product.finalPrice || product.price;
                estimatedTotal += price * quantity;

                items.push({
                    productId: product._id,
                    quantity,
                    price,
                    addedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000))
                });
            }

            cartsToCreate.push({
                userId: user._id,
                items,
                estimatedTotal
            });
        }

        await Cart.insertMany(cartsToCreate);
        console.log(`   ✅ ${cartsToCreate.length} paniers créés\n`);

        // Summary
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🎉 BASE DE DONNÉES PEUPLÉE AVEC SUCCÈS!');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log('📊 RÉSUMÉ:');
        console.log(`   👥 ${createdUsers.length} utilisateurs`);
        console.log(`   🏪 ${createdVendors.length} vendeurs`);
        console.log(`   📦 ${productCount} produits`);
        console.log(`   📁 ${categories.length} catégories`);
        console.log(`   🛒 ${orderCount} commandes`);
        console.log(`   🛍️  ${cartsToCreate.length} paniers\n`);

        console.log('🔐 COMPTES DE TEST:');
        console.log('   ┌─────────────────────────────────────────────┐');
        console.log('   │ Admin:    admin@ooryxx.tn / Admin123!      │');
        console.log('   │ VIP:      ahmed@example.com / User123!     │');
        console.log('   │ Customer: mohamed@example.com / User123!   │');
        console.log('   │ Vendor:   vendor@techstore.tn / Vendor123! │');
        console.log('   └─────────────────────────────────────────────┘\n');

        await mongoose.connection.close();
        console.log('🔌 Connexion fermée');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error(error);
        process.exit(1);
    }
}

seedDatabase();

