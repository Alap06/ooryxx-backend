const mongoose = require('mongoose');
const Category = require('../src/models/Category');

const categories = [
    {
        name: 'Électronique',
        description: 'Produits électroniques et high-tech',
        isActive: true,
        displayOrder: 1
    },
    {
        name: 'Mode & Vêtements',
        description: 'Vêtements, chaussures et accessoires de mode',
        isActive: true,
        displayOrder: 2
    },
    {
        name: 'Maison & Jardin',
        description: 'Meubles, décoration et équipements pour la maison',
        isActive: true,
        displayOrder: 3
    },
    {
        name: 'Beauté & Santé',
        description: 'Produits de beauté, cosmétiques et santé',
        isActive: true,
        displayOrder: 4
    },
    {
        name: 'Sport & Loisirs',
        description: 'Équipements sportifs et articles de loisirs',
        isActive: true,
        displayOrder: 5
    }
];

async function seedCategories() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ooryxx';
        await mongoose.connect(mongoUri);
        console.log('✓ Connecté à MongoDB');

        // Check if categories already exist
        const existingCount = await Category.countDocuments();
        if (existingCount > 0) {
            console.log(`⚠ ${existingCount} catégories existent déjà. Voulez-vous continuer? (y/n)`);
            // For script execution, we'll skip if exists
            console.log('→ Ajout des catégories manquantes uniquement...');
        }

        // Insert categories (skip duplicates)
        let added = 0;
        let skipped = 0;

        for (const cat of categories) {
            const existing = await Category.findOne({ name: cat.name });
            if (!existing) {
                await Category.create(cat);
                console.log(`✓ Catégorie créée: ${cat.name}`);
                added++;
            } else {
                console.log(`⊘ Catégorie existe déjà: ${cat.name}`);
                skipped++;
            }
        }

        console.log('\n=== Résumé ===');
        console.log(`✓ ${added} catégories ajoutées`);
        console.log(`⊘ ${skipped} catégories ignorées (déjà existantes)`);

        // Display all categories
        const allCategories = await Category.find({}).sort({ displayOrder: 1 });
        console.log('\n=== Catégories dans la base ===');
        allCategories.forEach(cat => {
            console.log(`- ${cat.name} (ID: ${cat._id})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('✗ Erreur:', error.message);
        process.exit(1);
    }
}

seedCategories();
