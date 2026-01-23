#!/usr/bin/env node
/**
 * Script d'audit simple pour vérifier rapidement les problèmes
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function quickAudit() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;

        console.log('\n🔍 AUDIT RAPIDE DE LA BASE DE DONNÉES\n');
        console.log('='.repeat(60));

        const checks = [
            { collection: 'products', field: 'status', badValues: ['published'], goodValue: 'active' },
            { collection: 'users', field: 'status', badValues: ['published', 'enabled'], goodValue: 'active' },
            { collection: 'vendors', field: 'status', badValues: ['active', 'enabled'], goodValue: 'approved' },
        ];

        let totalProblems = 0;

        for (const check of checks) {
            const collections = await db.listCollections({ name: check.collection }).toArray();
            if (collections.length === 0) continue;

            const collection = db.collection(check.collection);

            for (const badValue of check.badValues) {
                const count = await collection.countDocuments({ [check.field]: badValue });
                if (count > 0) {
                    console.log(`❌ ${check.collection}: ${count} documents avec ${check.field}="${badValue}"`);
                    console.log(`   → Devrait être "${check.goodValue}"\n`);
                    totalProblems += count;
                }
            }
        }

        if (totalProblems === 0) {
            console.log('\n✅ Aucun problème détecté!\n');
        } else {
            console.log(`\n⚠️  Total: ${totalProblems} document(s) à corriger\n`);
        }

        console.log('='.repeat(60));

        // Vérification détaillée des produits
        const productsCollection = db.collection('products');
        const productStats = await productsCollection.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]).toArray();

        console.log('\n📦 PRODUITS - Distribution des status:');
        productStats.forEach(s => console.log(`   ${s._id}: ${s.count}`));

        const activePublished = await productsCollection.countDocuments({
            status: 'active',
            isPublished: true,
            stock: { $gt: 0 }
        });
        console.log(`\n   ✓ Produits visibles via API: ${activePublished}`);

        // Vérification des utilisateurs
        const usersCollection = db.collection('users');
        const userStats = await usersCollection.aggregate([
            { $group: { _id: { status: '$status', role: '$role' }, count: { $sum: 1 } } }
        ]).toArray();

        console.log('\n👥 UTILISATEURS - Distribution:');
        userStats.forEach(s => {
            const status = s._id.status || 'undefined';
            const role = s._id.role || 'undefined';
            console.log(`   ${role} (${status}): ${s.count}`);
        });

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

quickAudit();
