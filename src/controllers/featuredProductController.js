const FeaturedProduct = require('../models/FeaturedProduct');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Récupérer tous les produits en vedette (public)
// @route   GET /api/featured-products
// @access  Public
exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await FeaturedProduct.getActiveProducts();
  
  successResponse(res, { products }, 'Produits en vedette récupérés avec succès');
});

// @desc    Récupérer tous les produits en vedette (admin)
// @route   GET /api/admin/featured-products
// @access  Private/Admin
exports.getAllFeaturedProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, isActive } = req.query;
  
  const filter = {};
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  const products = await FeaturedProduct.find(filter)
    .sort({ displayOrder: 1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  const total = await FeaturedProduct.countDocuments(filter);

  successResponse(res, {
    products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  }, 'Produits en vedette récupérés avec succès');
});

// @desc    Récupérer un produit en vedette par ID
// @route   GET /api/admin/featured-products/:id
// @access  Private/Admin
exports.getFeaturedProductById = asyncHandler(async (req, res) => {
  const product = await FeaturedProduct.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!product) {
    return errorResponse(res, 'Produit en vedette non trouvé', 404);
  }

  successResponse(res, { product }, 'Produit en vedette récupéré avec succès');
});

// @desc    Créer un produit en vedette
// @route   POST /api/admin/featured-products
// @access  Private/Admin
exports.createFeaturedProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    originalPrice,
    currency,
    image,
    badge,
    rating,
    reviewsCount,
    productLink,
    productId,
    displayOrder,
    isActive,
    startDate,
    endDate
  } = req.body;

  // Validation
  if (!name || !price || !image) {
    return errorResponse(res, 'Le nom, le prix et l\'image sont requis', 400);
  }

  const product = await FeaturedProduct.create({
    name,
    description,
    price,
    originalPrice,
    currency,
    image,
    badge,
    rating,
    reviewsCount,
    productLink,
    productId,
    displayOrder,
    isActive,
    startDate,
    endDate,
    createdBy: req.user._id
  });

  successResponse(res, { product }, 'Produit en vedette créé avec succès', 201);
});

// @desc    Mettre à jour un produit en vedette
// @route   PUT /api/admin/featured-products/:id
// @access  Private/Admin
exports.updateFeaturedProduct = asyncHandler(async (req, res) => {
  let product = await FeaturedProduct.findById(req.params.id);

  if (!product) {
    return errorResponse(res, 'Produit en vedette non trouvé', 404);
  }

  const {
    name,
    description,
    price,
    originalPrice,
    currency,
    image,
    badge,
    rating,
    reviewsCount,
    productLink,
    productId,
    displayOrder,
    isActive,
    startDate,
    endDate
  } = req.body;

  product = await FeaturedProduct.findByIdAndUpdate(
    req.params.id,
    {
      name,
      description,
      price,
      originalPrice,
      currency,
      image,
      badge,
      rating,
      reviewsCount,
      productLink,
      productId,
      displayOrder,
      isActive,
      startDate,
      endDate,
      updatedBy: req.user._id
    },
    { new: true, runValidators: true }
  );

  successResponse(res, { product }, 'Produit en vedette mis à jour avec succès');
});

// @desc    Supprimer un produit en vedette
// @route   DELETE /api/admin/featured-products/:id
// @access  Private/Admin
exports.deleteFeaturedProduct = asyncHandler(async (req, res) => {
  const product = await FeaturedProduct.findById(req.params.id);

  if (!product) {
    return errorResponse(res, 'Produit en vedette non trouvé', 404);
  }

  await FeaturedProduct.findByIdAndDelete(req.params.id);

  successResponse(res, null, 'Produit en vedette supprimé avec succès');
});

// @desc    Réorganiser l'ordre des produits en vedette
// @route   PUT /api/admin/featured-products/reorder
// @access  Private/Admin
exports.reorderFeaturedProducts = asyncHandler(async (req, res) => {
  const { products } = req.body; // Array de { id, displayOrder }

  if (!Array.isArray(products)) {
    return errorResponse(res, 'Un tableau de produits est requis', 400);
  }

  const updatePromises = products.map(({ id, displayOrder }) =>
    FeaturedProduct.findByIdAndUpdate(id, { displayOrder, updatedBy: req.user._id })
  );

  await Promise.all(updatePromises);

  const updatedProducts = await FeaturedProduct.find({
    _id: { $in: products.map(p => p.id) }
  }).sort({ displayOrder: 1 });

  successResponse(res, { products: updatedProducts }, 'Ordre des produits mis à jour avec succès');
});

// @desc    Activer/Désactiver un produit en vedette
// @route   PATCH /api/admin/featured-products/:id/toggle
// @access  Private/Admin
exports.toggleFeaturedProduct = asyncHandler(async (req, res) => {
  const product = await FeaturedProduct.findById(req.params.id);

  if (!product) {
    return errorResponse(res, 'Produit en vedette non trouvé', 404);
  }

  product.isActive = !product.isActive;
  product.updatedBy = req.user._id;
  await product.save();

  successResponse(res, { product }, `Produit ${product.isActive ? 'activé' : 'désactivé'} avec succès`);
});
