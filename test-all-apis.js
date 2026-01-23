#!/usr/bin/env node
/**
 * Script de test automatisé complet pour toutes les API
 * Teste tous les endpoints et génère un rapport détaillé
 */

const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Codes couleur pour le terminal
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    cyan: '\x1b[36m'
};

let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
};

let authTokens = {
    admin: null,
    vendor: null,
    customer: null
};

// Helper pour afficher les résultats
function logTest(method, endpoint, status, success, message = '') {
    testResults.total++;
    if (success) {
        testResults.passed++;
        console.log(`${colors.green}✓${colors.reset} ${method.padEnd(6)} ${endpoint.padEnd(50)} → ${status}`);
    } else {
        testResults.failed++;
        console.log(`${colors.red}✗${colors.reset} ${method.padEnd(6)} ${endpoint.padEnd(50)} → ${status} ${message}`);
        testResults.errors.push({ method, endpoint, status, message });
    }
}

// Helper pour faire des requêtes
async function testRequest(method, endpoint, options = {}) {
    try {
        const config = {
            method,
            url: `${API_BASE}${endpoint}`,
            ...options
        };

        const response = await axios(config);
        return { success: true, status: response.status, data: response.data };
    } catch (error) {
        return {
            success: false,
            status: error.response?.status || 'ERROR',
            message: error.response?.data?.message || error.message,
            data: error.response?.data
        };
    }
}

// Tests d'authentification
async function testAuth() {
    console.log(`\n${colors.cyan}═══ TESTS AUTHENTIFICATION${colors.reset}`);

    // Test login admin
    const loginData = {
        email: 'admin@ooryxx.com',
        password: 'Admin123!'
    };

    const loginRes = await testRequest('POST', '/auth/login', { data: loginData });
    logTest('POST', '/auth/login', loginRes.status, loginRes.success);

    if (loginRes.success && loginRes.data.token) {
        authTokens.admin = loginRes.data.token;
    }

    // Test profil avec token
    if (authTokens.admin) {
        const profileRes = await testRequest('GET', '/auth/profile', {
            headers: { Authorization: `Bearer ${authTokens.admin}` }
        });
        logTest('GET', '/auth/profile', profileRes.status, profileRes.success);
    }

    // Test refresh token
    if (loginRes.success && loginRes.data.refreshToken) {
        const refreshRes = await testRequest('POST', '/auth/refresh', {
            data: { refreshToken: loginRes.data.refreshToken }
        });
        logTest('POST', '/auth/refresh', refreshRes.status, refreshRes.success);
    }
}

// Tests produits publics
async function testProducts() {
    console.log(`\n${colors.cyan}═══ TESTS PRODUITS PUBLICS${colors.reset}`);

    const tests = [
        { method: 'GET', endpoint: '/products' },
        { method: 'GET', endpoint: '/products?page=1&limit=10' },
        { method: 'GET', endpoint: '/products/featured' },
        { method: 'GET', endpoint: '/products/sale' },
        { method: 'GET', endpoint: '/products/categories' },
        { method: 'GET', endpoint: '/products/search?q=phone' },
    ];

    for (const test of tests) {
        const res = await testRequest(test.method, test.endpoint);
        logTest(test.method, test.endpoint, res.status, res.success, res.message);
    }

    // Test détail produit (récupérer un ID depuis la liste)
    const productsRes = await testRequest('GET', '/products?limit=1');
    if (productsRes.success && productsRes.data?.data?.products?.length > 0) {
        const productId = productsRes.data.data.products[0]._id;
        const detailRes = await testRequest('GET', `/products/${productId}`);
        logTest('GET', `/products/${productId}`, detailRes.status, detailRes.success);

        const similarRes = await testRequest('GET', `/products/${productId}/similar`);
        logTest('GET', `/products/${productId}/similar`, similarRes.status, similarRes.success);
    }
}

// Tests utilisateur (nécessite auth)
async function testUsers() {
    if (!authTokens.admin) return;

    console.log(`\n${colors.cyan}═══ TESTS UTILISATEURS${colors.reset}`);

    const headers = { Authorization: `Bearer ${authTokens.admin}` };

    const tests = [
        { method: 'GET', endpoint: '/users/profile' },
        { method: 'GET', endpoint: '/users/addresses' },
        { method: 'GET', endpoint: '/users/cart' },
        { method: 'GET', endpoint: '/users/wishlist' },
        { method: 'GET', endpoint: '/users/orders' },
        { method: 'GET', endpoint: '/users/stats' },
    ];

    for (const test of tests) {
        const res = await testRequest(test.method, test.endpoint, { headers });
        logTest(test.method, test.endpoint, res.status, res.success, res.message);
    }
}

// Tests admin
async function testAdmin() {
    if (!authTokens.admin) return;

    console.log(`\n${colors.cyan}═══ TESTS ADMIN${colors.reset}`);

    const headers = { Authorization: `Bearer ${authTokens.admin}` };

    const tests = [
        { method: 'GET', endpoint: '/admin/users' },
        { method: 'GET', endpoint: '/admin/vendors' },
        { method: 'GET', endpoint: '/admin/dashboard' },
        { method: 'GET', endpoint: '/admin/analytics' },
        { method: 'GET', endpoint: '/admin/products' },
        { method: 'GET', endpoint: '/admin/orders' },
        { method: 'GET', endpoint: '/admin/categories' },
    ];

    for (const test of tests) {
        const res = await testRequest(test.method, test.endpoint, { headers });
        logTest(test.method, test.endpoint, res.status, res.success, res.message);
    }
}

// Tests catégories
async function testCategories() {
    console.log(`\n${colors.cyan}═══ TESTS CATÉGORIES${colors.reset}`);

    const res = await testRequest('GET', '/categories');
    logTest('GET', '/categories', res.status, res.success, res.message);

    if (res.success && res.data?.data?.categories?.length > 0) {
        const categoryId = res.data.data.categories[0]._id;
        const detailRes = await testRequest('GET', `/categories/${categoryId}`);
        logTest('GET', `/categories/${categoryId}`, detailRes.status, detailRes.success);
    }
}

// Tests réclamations
async function testReclamations() {
    if (!authTokens.admin) return;

    console.log(`\n${colors.cyan}═══ TESTS RÉCLAMATIONS${colors.reset}`);

    const headers = { Authorization: `Bearer ${authTokens.admin}` };

    const tests = [
        { method: 'GET', endpoint: '/reclamations/my', headers },
        { method: 'GET', endpoint: '/reclamations', headers },
    ];

    for (const test of tests) {
        const res = await testRequest(test.method, test.endpoint, { headers: test.headers });
        logTest(test.method, test.endpoint, res.status, res.success, res.message);
    }
}

// Tests zones de livraison
async function testDeliveryZones() {
    console.log(`\n${colors.cyan}═══ TESTS ZONES DE LIVRAISON${colors.reset}`);

    const res = await testRequest('GET', '/delivery-zones');
    logTest('GET', '/delivery-zones', res.status, res.success, res.message);
}

// Tests commandes
async function testOrders() {
    if (!authTokens.admin) return;

    console.log(`\n${colors.cyan}═══ TESTS COMMANDES${colors.reset}`);

    const headers = { Authorization: `Bearer ${authTokens.admin}` };

    const tests = [
        { method: 'GET', endpoint: '/users/orders' },
    ];

    for (const test of tests) {
        const res = await testRequest(test.method, test.endpoint, { headers });
        logTest(test.method, test.endpoint, res.status, res.success, res.message);
    }
}

// Fonction principale
async function runAllTests() {
    console.log(`${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.blue}║     TEST COMPLET DE L'API BACKEND OORYXX                   ║${colors.reset}`);
    console.log(`${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
    console.log(`\n📍 URL de base: ${BASE_URL}`);
    console.log(`⏰ Début des tests: ${new Date().toLocaleTimeString()}\n`);

    try {
        await testAuth();
        await testProducts();
        await testCategories();
        await testUsers();
        await testOrders();
        await testReclamations();
        await testDeliveryZones();
        await testAdmin();

    } catch (error) {
        console.error(`\n${colors.red}❌ Erreur fatale:${colors.reset}`, error.message);
    }

    // Rapport final
    console.log(`\n${colors.blue}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.blue}📊 RAPPORT FINAL${colors.reset}`);
    console.log(`${colors.blue}${'═'.repeat(60)}${colors.reset}`);
    console.log(`Total de tests: ${testResults.total}`);
    console.log(`${colors.green}✓ Réussis: ${testResults.passed}${colors.reset}`);
    console.log(`${colors.red}✗ Échoués: ${testResults.failed}${colors.reset}`);

    const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
    console.log(`\nTaux de réussite: ${successRate}%`);

    if (testResults.errors.length > 0) {
        console.log(`\n${colors.yellow}📋 ERREURS DÉTAILLÉES:${colors.reset}`);
        testResults.errors.forEach((error, index) => {
            console.log(`\n${index + 1}. ${error.method} ${error.endpoint}`);
            console.log(`   Status: ${error.status}`);
            console.log(`   Message: ${error.message}`);
        });
    }

    console.log(`\n⏰ Fin des tests: ${new Date().toLocaleTimeString()}`);
    console.log('');

    process.exit(testResults.failed > 0 ? 1 : 0);
}

runAllTests();
