const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .sort({ displayOrder: 1, name: 1 })
            .select('name slug description image icon parentId');

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des catégories',
            error: error.message
        });
    }
});

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Catégorie non trouvée'
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
});

module.exports = router;
