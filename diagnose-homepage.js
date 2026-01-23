#!/usr/bin/env node
/**
 * Script de diagnostic pour la visibilité des produits sur la page d'accueil
 * Vérifie les endpoints probables utilisés par la home page
 */

const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

async function checkHomepageData() {
    console.log('🔍 DIAGNOSTIC VISIBILITÉ FRONTEND (HOMEPAGE)\n');

    try {
        // 1. Vérifier /api/products/featured
        console.log('1️⃣  Test GET /api/products/featured');
        try {
            const res = await axios.get(`${BASE_URL}/products/featured`);
            const products = res.data.data.products;
            console.log(`   Status: ${res.status}`);
            console.log(`   Produits retournés: ${products.length}`);
            if (products.length === 0) {
                console.log('   ⚠️  AUCUN PRODUIT VEDETTE (FEATURED) !');
                console.log('      La page d\'accueil affiche souvent cette section.');
            } else {
                console.log('   ✅ Produits vedettes disponibles');
            }
        } catch (e) {
            console.log(`   ❌ Erreur: ${e.response?.status || e.message}`);
        }

        // 2. Vérifier /api/products/sale
        console.log('\n2️⃣  Test GET /api/products/sale');
        try {
            const res = await axios.get(`${BASE_URL}/products/sale`);
            const products = res.data.data.products;
            console.log(`   Status: ${res.status}`);
            console.log(`   Produits retournés: ${products.length}`);
            if (products.length === 0) {
                console.log('   ⚠️  AUCUN PRODUIT EN PROMO (SALE) !');
                console.log('      Si la page d\'accueil affiche les promos, cette section sera vide.');
            } else {
                console.log('   ✅ Produits en promo disponibles');
            }
        } catch (e) {
            console.log(`   ❌ Erreur: ${e.response?.status || e.message}`);
        }

        // 3. Vérifier les données brutes en base
        console.log('\n3️⃣  Analyse des données en base (MongoDB)');
        await mongoose.connect(process.env.MONGODB_URI);
        const Product = require('./src/models/Product');

        const totalActive = await Product.countDocuments({ status: 'active', isPublished: true, stock: { $gt: 0 } });
        const totalFeatured = await Product.countDocuments({ status: 'active', isPublished: true, stock: { $gt: 0 }, featured: true });
        const totalSale = await Product.countDocuments({
            status: 'active',
            isPublished: true,
            stock: { $gt: 0 },
            'discount.percentage': { $gt: 0 }
        });

        console.log(`   Produits Actifs et Publiés (Total): ${totalActive}`);
        console.log(`   Produits Marqués 'Featured':        ${totalFeatured}`);
        console.log(`   Produits avec Remise (>0%):         ${totalSale}`);

        if (totalFeatured === 0 && totalSale === 0) {
            console.log('\n🚨 CAUSE PROBABLE IDENTIFIÉE :');
            console.log('   Aucun produit n\'est marqué comme "Featured" ni "En promotion".');
            console.log('   La page d\'accueil filtre probablement ces attributs.');
        }

        await mongoose.connection.close();

    } catch (error) {
        console.error('Erreur script:', error);
        if (mongoose.connection.readyState === 1) await mongoose.connection.close();
    }
}

checkHomepageData();
