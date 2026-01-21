const mongoose = require('mongoose');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse, notFoundResponse } = require('../utils/responseHandler');

// ==================== PROFIL UTILISATEUR ====================

// @desc    Obtenir le profil de l'utilisateur connecté
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('-password -refreshToken -resetPasswordToken')
    .populate('cart')
    .populate('wishlist');

  if (!user) {
    return notFoundResponse(res, 'Utilisateur non trouvé');
  }

  successResponse(res, user, 'Profil récupéré avec succès');
});

// @desc    Mettre à jour le profil
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phoneNumber, birthdate, profileImage } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return notFoundResponse(res, 'Utilisateur non trouvé');
  }

  // Mise à jour des champs
  if (firstName !== undefined && firstName) user.firstName = firstName;
  if (lastName !== undefined && lastName) user.lastName = lastName;
  if (phoneNumber !== undefined) user.phoneNumber = phoneNumber || null;
  if (birthdate !== undefined) user.birthdate = birthdate || null;

  // Handle profileImage (can be URL, base64, or empty to clear)
  if (profileImage !== undefined) {
    // If base64 is too large (>5MB), reject
    if (profileImage && profileImage.startsWith('data:') && profileImage.length > 5 * 1024 * 1024) {
      return errorResponse(res, 'Image trop grande (max 5MB)', 400);
    }
    user.profileImage = profileImage || null;
  }

  try {
    await user.save();
    successResponse(res, user, 'Profil mis à jour avec succès');
  } catch (saveError) {
    console.error('Error saving user profile:', saveError);
    return errorResponse(res, 'Erreur lors de la sauvegarde: ' + saveError.message, 500);
  }
});

// @desc    Changer le mot de passe
// @route   PUT /api/users/profile/password
// @access  Private
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return notFoundResponse(res, 'Utilisateur non trouvé');
  }

  // Vérifier l'ancien mot de passe
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return errorResponse(res, 'Mot de passe actuel incorrect', 400);
  }

  // Mettre à jour le mot de passe
  user.password = newPassword;
  await user.save();

  successResponse(res, null, 'Mot de passe modifié avec succès');
});

// ==================== ADRESSES ====================

// @desc    Obtenir toutes les adresses
// @route   GET /api/users/addresses
// @access  Private
exports.getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('addresses');

  if (!user) {
    return notFoundResponse(res, 'Utilisateur non trouvé');
  }

  successResponse(res, user.addresses, 'Adresses récupérées avec succès');
});

// @desc    Ajouter une adresse
// @route   POST /api/users/addresses
// @access  Private
exports.addAddress = asyncHandler(async (req, res) => {
  const { label, street, city, postalCode, country, isDefault } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return notFoundResponse(res, 'Utilisateur non trouvé');
  }

  // Si c'est l'adresse par défaut, retirer le flag des autres
  if (isDefault) {
    user.addresses.forEach(addr => addr.isDefault = false);
  }

  user.addresses.push({
    label,
    street,
    city,
    postalCode,
    country,
    isDefault: isDefault || user.addresses.length === 0
  });

  await user.save();

  successResponse(res, user.addresses, 'Adresse ajoutée avec succès', 201);
});

// @desc    Mettre à jour une adresse
// @route   PUT /api/users/addresses/:addressId
// @access  Private
exports.updateAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const { label, street, city, postalCode, country, isDefault } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return notFoundResponse(res, 'Utilisateur non trouvé');
  }

  const address = user.addresses.id(addressId);

  if (!address) {
    return notFoundResponse(res, 'Adresse non trouvée');
  }

  // Si devient l'adresse par défaut
  if (isDefault) {
    user.addresses.forEach(addr => addr.isDefault = false);
  }

  // Mise à jour
  if (label) address.label = label;
  if (street) address.street = street;
  if (city) address.city = city;
  if (postalCode) address.postalCode = postalCode;
  if (country) address.country = country;
  if (isDefault !== undefined) address.isDefault = isDefault;

  await user.save();

  successResponse(res, user.addresses, 'Adresse mise à jour avec succès');
});

// @desc    Supprimer une adresse
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
exports.deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  const user = await User.findById(req.user.id);

  if (!user) {
    return notFoundResponse(res, 'Utilisateur non trouvé');
  }

  user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
  await user.save();

  successResponse(res, user.addresses, 'Adresse supprimée avec succès');
});

// ==================== PANIER (CART) ====================

// @desc    Obtenir le panier
// @route   GET /api/users/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ userId: req.user.id })
    .populate({
      path: 'items.productId',
      select: 'title images price discount stock isActive'
    });

  // Créer un panier s'il n'existe pas
  if (!cart) {
    cart = await Cart.create({ userId: req.user.id, items: [] });
  }

  // Calculer le total
  await cart.calculateTotal();

  successResponse(res, cart, 'Panier récupéré avec succès');
});

// @desc    Ajouter un produit au panier
// @route   POST /api/users/cart
// @access  Private
exports.addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, selectedVariants = {} } = req.body;

  // Vérifier si le produit existe et est actif
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return notFoundResponse(res, 'Produit non trouvé ou indisponible');
  }

  // Vérifier le stock
  if (!product.isInStock(quantity)) {
    return errorResponse(res, 'Stock insuffisant', 400);
  }

  let cart = await Cart.findOne({ userId: req.user.id });

  // Créer le panier s'il n'existe pas
  if (!cart) {
    cart = await Cart.create({ userId: req.user.id, items: [] });
  }

  // Ajouter le produit
  await cart.addItem(productId, quantity, selectedVariants);

  // Recharger avec les produits
  cart = await Cart.findById(cart._id).populate({
    path: 'items.productId',
    select: 'title images price discount stock'
  });

  await cart.calculateTotal();

  successResponse(res, cart, 'Produit ajouté au panier', 201);
});

// @desc    Mettre à jour la quantité d'un produit
// @route   PUT /api/users/cart/:productId
// @access  Private
exports.updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 0) {
    return errorResponse(res, 'Quantité invalide', 400);
  }

  const cart = await Cart.findOne({ userId: req.user.id });

  if (!cart) {
    return notFoundResponse(res, 'Panier non trouvé');
  }

  // Vérifier le stock
  const product = await Product.findById(productId);
  if (quantity > 0 && product && !product.isInStock(quantity)) {
    return errorResponse(res, 'Stock insuffisant', 400);
  }

  await cart.updateItemQuantity(productId, quantity);

  // Recharger
  const updatedCart = await Cart.findById(cart._id).populate({
    path: 'items.productId',
    select: 'title images price discount stock'
  });

  await updatedCart.calculateTotal();

  successResponse(res, updatedCart, 'Panier mis à jour');
});

// @desc    Supprimer un produit du panier
// @route   DELETE /api/users/cart/:productId
// @access  Private
exports.removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ userId: req.user.id });

  if (!cart) {
    return notFoundResponse(res, 'Panier non trouvé');
  }

  await cart.removeItem(productId);

  // Recharger
  const updatedCart = await Cart.findById(cart._id).populate({
    path: 'items.productId',
    select: 'title images price discount stock'
  });

  await updatedCart.calculateTotal();

  successResponse(res, updatedCart, 'Produit retiré du panier');
});

// @desc    Vider le panier
// @route   DELETE /api/users/cart
// @access  Private
exports.clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user.id });

  if (!cart) {
    return notFoundResponse(res, 'Panier non trouvé');
  }

  await cart.clear();

  successResponse(res, cart, 'Panier vidé');
});

// ==================== WISHLIST (LISTE DE SOUHAITS) ====================

// @desc    Obtenir la wishlist
// @route   GET /api/users/wishlist
// @access  Private
exports.getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('wishlist')
    .populate({
      path: 'wishlist',
      select: 'title images price discount rating stock isActive'
    });

  if (!user) {
    return notFoundResponse(res, 'Utilisateur non trouvé');
  }

  successResponse(res, user.wishlist, 'Wishlist récupérée avec succès');
});

// @desc    Ajouter un produit à la wishlist
// @route   POST /api/users/wishlist/:productId
// @access  Private
exports.addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) {
    return notFoundResponse(res, 'Produit non trouvé');
  }

  const user = await User.findById(req.user.id);

  // Vérifier si déjà dans la wishlist
  if (user.wishlist.includes(productId)) {
    return errorResponse(res, 'Produit déjà dans la wishlist', 400);
  }

  user.wishlist.push(productId);
  await user.save();

  await user.populate({
    path: 'wishlist',
    select: 'title images price discount rating'
  });

  successResponse(res, user.wishlist, 'Produit ajouté à la wishlist', 201);
});

// @desc    Retirer un produit de la wishlist
// @route   DELETE /api/users/wishlist/:productId
// @access  Private
exports.removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const user = await User.findById(req.user.id);

  user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
  await user.save();

  await user.populate({
    path: 'wishlist',
    select: 'title images price discount rating'
  });

  successResponse(res, user.wishlist, 'Produit retiré de la wishlist');
});

// ==================== COMMANDES ====================

// @desc    Obtenir toutes les commandes de l'utilisateur
// @route   GET /api/users/orders
// @access  Private
exports.getOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = { userId: req.user.id };
  if (status) query.status = status;

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('items.productId', 'title images');

  const count = await Order.countDocuments(query);

  successResponse(res, {
    orders,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    total: count
  }, 'Commandes récupérées avec succès');
});

// @desc    Obtenir une commande spécifique
// @route   GET /api/users/orders/:orderId
// @access  Private
exports.getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findOne({
    _id: orderId,
    userId: req.user.id
  })
    .populate('items.productId', 'title images price')
    .populate('vendorId', 'companyInfo');

  if (!order) {
    return notFoundResponse(res, 'Commande non trouvée');
  }

  successResponse(res, order, 'Commande récupérée avec succès');
});

// @desc    Annuler une commande
// @route   PUT /api/users/orders/:orderId/cancel
// @access  Private
exports.cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findOne({
    _id: orderId,
    userId: req.user.id
  });

  if (!order) {
    return notFoundResponse(res, 'Commande non trouvée');
  }

  // Vérifier si la commande peut être annulée
  if (!['pending', 'confirmed'].includes(order.status)) {
    return errorResponse(res, 'Cette commande ne peut plus être annulée', 400);
  }

  order.status = 'cancelled';
  order.statusHistory.push({
    status: 'cancelled',
    comment: 'Annulée par l\'utilisateur'
  });

  await order.save();

  successResponse(res, order, 'Commande annulée avec succès');
});

// @desc    Obtenir les statistiques de l'utilisateur
// @route   GET /api/users/stats
// @access  Private
exports.getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Nombre de commandes
  const totalOrders = await Order.countDocuments({ userId });

  // Montant total dépensé - use 'new' keyword for newer mongoose
  let totalSpent = 0;
  try {
    const ordersData = await Order.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    totalSpent = ordersData.length > 0 ? ordersData[0].total : 0;
  } catch (err) {
    // If aggregation fails, just use 0
    totalSpent = 0;
  }

  // Produits dans la wishlist
  const user = await User.findById(userId).select('wishlist createdAt');
  const wishlistCount = user?.wishlist?.length || 0;

  // Articles dans le panier
  const cart = await Cart.findOne({ userId });
  const cartItemsCount = cart ? cart.items.length : 0;

  successResponse(res, {
    totalOrders,
    totalSpent,
    wishlistCount,
    cartItemsCount,
    memberSince: user?.createdAt || new Date()
  }, 'Statistiques récupérées avec succès');
});

// ==================== DEMANDE VENDEUR ====================

const Vendor = require('../models/Vendor');

// @desc    Soumettre une demande pour devenir vendeur
// @route   POST /api/users/vendor-request
// @access  Private
exports.submitVendorRequest = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Check if the user already has a vendor profile
  const existingVendor = await Vendor.findOne({ userId });
  if (existingVendor) {
    return errorResponse(res, 'Vous avez déjà une demande vendeur en cours ou approuvée.', 400);
  }

  // Parse the form data
  const {
    fullName,
    birthdate,
    nationalIdNumber,
    companyName,
    companyDescription,
    street,
    city,
    postalCode,
    companyPhone,
    companyEmail,
    website,
    accountHolder,
    iban,
    bankName,
    swift,
    productCategories,
    productDescription
  } = req.body;

  // Parse productCategories if it's a string
  let categories = productCategories;
  if (typeof productCategories === 'string') {
    try {
      categories = JSON.parse(productCategories);
    } catch (e) {
      categories = [productCategories];
    }
  }

  // Handle file uploads (if using multer, files would be in req.files)
  let nationalIdFrontPath = null;
  let nationalIdBackPath = null;
  let signedConventionPath = null;

  if (req.files) {
    if (req.files.nationalIdFront) {
      nationalIdFrontPath = `/uploads/vendor-requests/${req.files.nationalIdFront[0].filename}`;
    }
    if (req.files.nationalIdBack) {
      nationalIdBackPath = `/uploads/vendor-requests/${req.files.nationalIdBack[0].filename}`;
    }
    if (req.files.signedConvention) {
      signedConventionPath = `/uploads/vendor-requests/${req.files.signedConvention[0].filename}`;
    }
  }

  // Create the Vendor document
  const vendor = await Vendor.create({
    userId,
    companyInfo: {
      name: companyName,
      description: companyDescription,
      address: {
        street,
        city,
        postalCode,
        country: 'Tunisie'
      },
      phone: companyPhone,
      email: companyEmail,
      website
    },
    documents: {
      identityCard: {
        number: nationalIdNumber,
        document: nationalIdFrontPath, // Could store both front and back
        verified: false
      },
      businessLicense: {
        document: signedConventionPath,
        verified: false
      }
    },
    bankInfo: {
      accountHolder,
      iban,
      bankName,
      swift
    },
    status: 'pending',
    notes: `Catégories souhaitées: ${(categories || []).join(', ')}. Description produits: ${productDescription || ''}`
  });

  // Update user's birthdate if provided
  if (birthdate) {
    await User.findByIdAndUpdate(userId, { birthdate });
  }

  successResponse(res, { vendorId: vendor._id, status: vendor.status }, 'Votre demande vendeur a été soumise avec succès. Elle sera examinée sous 48h.', 201);
});

