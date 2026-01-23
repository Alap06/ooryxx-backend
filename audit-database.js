#!/usr/bin/env node
/**
 * Script d'audit complet de la base de données
 * Détecte les incohérences dans les champs status, isActive, isPublished, etc.
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function auditDatabase() {
    try {
        console.log('🔌 Connexion à MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à la base de données\n');

        const db = mongoose.connection.db;

        // Liste des collections à auditer avec leurs champs critiques
        const collectionsToAudit = [
            {
                name: 'products',
                statusField: 'status',
                expectedValues: ['draft', 'active', 'inactive', 'out_of_stock', 'discontinued'],
                booleanFields: ['isPublished', 'featured']
            },
            {
                name: 'users',
                statusField: 'status',
                expectedValues: ['active', 'inactive', 'suspended'],
                booleanFields: ['isActive', 'isEmailVerified']
            },
            {
                name: 'vendors',
                statusField: 'status',
                expectedValues: ['pending', 'approved', 'suspended', 'rejected'],
                booleanFields: ['isActive', 'isVerified']
            },
            {
                name: 'orders',
                statusField: 'status',
                expectedValues: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
                booleanFields: []
            },
            {
                name: 'categories',
                statusField: null,
                expectedValues: [],
                booleanFields: ['isActive']
            },
            {
                name: 'coupons',
                statusField: 'status',
                expectedValues: ['active', 'inactive', 'expired'],
                booleanFields: ['isActive']
            },
            {
                name: 'reclamations',
                statusField: 'status',
                expectedValues: ['pending', 'in_progress', 'resolved', 'closed'],
                booleanFields: []
            },
            {
                name: 'livreurs',
                statusField: 'status',
                expectedValues: ['active', 'inactive', 'suspended'],
                booleanFields: ['isActive', 'isAvailable']
            }
        ];

        console.log('📊 AUDIT DE LA BASE DE DONNÉES');
        console.log('='.repeat(70));

        let totalIssues = 0;
        const issuesFound = [];

        for (const collectionConfig of collectionsToAudit) {
            const { name, statusField, expectedValues, booleanFields } = collectionConfig;

            // Vérifier si la collection existe
            const collections = await db.listCollections({ name }).toArray();
            if (collections.length === 0) {
                console.log(`\n⚠️  Collection "${name}" n'existe pas - Ignorée\n`);
                continue;
            }

            const collection = db.collection(name);
            const totalDocs = await collection.countDocuments();

            console.log(`\n📁 Collection: ${name}`);
            console.log(`   Documents: ${totalDocs}`);

            if (totalDocs === 0) {
                console.log('   ℹ️  Collection vide - Aucun audit nécessaire');
                continue;
            }

            // Audit du champ status
            if (statusField) {
                const statusDistribution = await collection.aggregate([
                    { $group: { _id: `$${statusField}`, count: { $sum: 1 } } }
                ]).toArray();

                console.log(`\n   Status Distribution (${statusField}):`);
                statusDistribution.forEach(stat => {
                    const value = stat._id || 'undefined';
                    const isExpected = expectedValues.includes(value);
                    const symbol = isExpected ? '✓' : '⚠️';
                    console.log(`     ${symbol} ${value}: ${stat.count} document(s)`);

                    if (!isExpected && value !== 'undefined') {
                        totalIssues++;
                        issuesFound.push({
                            collection: name,
                            field: statusField,
                            unexpectedValue: value,
                            count: stat.count,
                            expectedValues
                        });
                    }
                });
            }

            // Audit des champs booléens
            for (const boolField of booleanFields) {
                const boolDistribution = await collection.aggregate([
                    { $group: { _id: `$${boolField}`, count: { $sum: 1 } } }
                ]).toArray();

                console.log(`\n   ${boolField} Distribution:`);
                boolDistribution.forEach(stat => {
                    const value = stat._id;
                    const symbol = typeof value === 'boolean' ? '✓' : '⚠️';
                    console.log(`     ${symbol} ${value}: ${stat.count} document(s)`);

                    if (typeof value !== 'boolean' && value !== null && value !== undefined) {
                        totalIssues++;
                        issuesFound.push({
                            collection: name,
                            field: boolField,
                            unexpectedValue: value,
                            count: stat.count,
                            expectedType: 'boolean'
                        });
                    }
                });
            }

            console.log('   ' + '-'.repeat(60));
        }

        // Résumé
        console.log('\n\n' + '='.repeat(70));
        console.log('📋 RÉSUMÉ DE L\'AUDIT');
        console.log('='.repeat(70));

        if (totalIssues === 0) {
            console.log('\n✅ Aucun problème détecté ! Toutes les collections sont cohérentes.\n');
        } else {
            console.log(`\n⚠️  ${totalIssues} problème(s) détecté(s):\n`);

            issuesFound.forEach((issue, index) => {
                console.log(`${index + 1}. Collection "${issue.collection}", champ "${issue.field}":`);
                console.log(`   Valeur inattendue: "${issue.unexpectedValue}" (${issue.count} document(s))`);
                if (issue.expectedValues) {
                    console.log(`   Valeurs attendues: ${issue.expectedValues.join(', ')}`);
                } else if (issue.expectedType) {
                    console.log(`   Type attendu: ${issue.expectedType}`);
                }
                console.log('');
            });

            console.log('💡 Recommandation: Créez des scripts de migration pour corriger ces incohérences.\n');
        }

        await mongoose.connection.close();
        console.log('✅ Déconnecté');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

auditDatabase();
