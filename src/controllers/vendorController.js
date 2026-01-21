const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const mongoose = require('mongoose');

/**
 * Tableau de bord vendeur - Statistiques principales
 * GET /api/vendor/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;

    if (!vendorId) {
      return res.status(403).json({ message: 'Accès vendeur requis' });
    }

    // Statistiques globales
    const vendor = await Vendor.findById(vendorId);
    const products = await Product.find({ vendorId });
    const orders = await Order.find({ vendorId });

    // Calcul des revenus (30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = orders.filter(order =>
      order.createdAt >= thirtyDaysAgo &&
      ['delivered', 'shipped', 'processing'].includes(order.status)
    );

    const totalRevenue = recentOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Commandes par statut
    const ordersByStatus = {
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length
    };

    // Produits les plus vendus (top 5)
    const productSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.productId.toString();
        if (!productSales[productId]) {
          productSales[productId] = {
            productId,
            title: item.title,
            sales: 0,
            revenue: 0
          };
        }
        productSales[productId].sales += item.quantity;
        productSales[productId].revenue += item.subtotal;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // Évolution des revenus (7 derniers jours)
    const revenueByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayOrders = orders.filter(order =>
        order.createdAt >= date &&
        order.createdAt < nextDay &&
        ['delivered', 'shipped', 'processing'].includes(order.status)
      );

      const dayRevenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

      revenueByDay.push({
        date: date.toISOString().split('T')[0],
        revenue: dayRevenue
      });
    }

    // Commandes récentes (5 dernières)
    const recentOrdersList = orders
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        clientCode: order.clientCode,
        totalAmount: order.totalAmount,
        status: order.status,
        date: order.createdAt
      }));

    // Répartition par catégorie
    const categoryStats = {};
    products.forEach(product => {
      const categoryId = product.category?.toString() || 'Non catégorisé';
      if (!categoryStats[categoryId]) {
        categoryStats[categoryId] = { count: 0, sales: 0 };
      }
      categoryStats[categoryId].count += 1;
      categoryStats[categoryId].sales += product.totalSales || 0;
    });

    res.json({
      stats: {
        totalRevenue,
        totalOrders: orders.length,
        totalProducts: products.length,
        averageRating: vendor.stats.rating || 0
      },
      ordersByStatus,
      topProducts,
      revenueByDay,
      recentOrders: recentOrdersList,
      categoryStats
    });

  } catch (error) {
    console.error('Erreur dashboard vendeur:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Obtenir tous les produits du vendeur
 * GET /api/vendor/products
 */
exports.getProducts = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;

    if (!vendorId) {
      return res.status(403).json({ message: 'Accès vendeur requis' });
    }

    // Limit increased to 300 (max allowed)
    const { search, category, status, page = 1, limit = 300 } = req.query;
    const maxLimit = Math.min(parseInt(limit) || 300, 300); // Cap at 300

    const query = { vendorId };

    if (search) {
      query.$text = { $search: search };
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(maxLimit)
      .skip((parseInt(page) - 1) * maxLimit);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / maxLimit)
      }
    });

  } catch (error) {
    console.error('Erreur récupération produits:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Créer un nouveau produit
 * POST /api/vendor/products
 */
exports.createProduct = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;

    if (!vendorId) {
      return res.status(403).json({ message: 'Accès vendeur requis' });
    }

    const { name, title, images, primaryImage, category, description, ...otherFields } = req.body;

    // Convert category name to ObjectId if needed
    let categoryId = null;
    if (category) {
      const Category = require('../models/Category');
      // Check if it's already an ObjectId
      if (mongoose.isValidObjectId(category)) {
        categoryId = category;
      } else {
        // Search by name
        const cat = await Category.findOne({
          name: { $regex: new RegExp(`^${category}$`, 'i') }
        });
        if (!cat) {
          return res.status(400).json({ message: `Catégorie introuvable: ${category}` });
        }
        categoryId = cat._id;
      }
    }

    // Format images for Mongoose schema
    let formattedImages = [];
    if (images && Array.isArray(images)) {
      formattedImages = images.map((img, index) => {
        const url = typeof img === 'string' ? img : img.url;
        return {
          url: url || 'https://placehold.co/300x300/e2e8f0/475569?text=Produit',
          alt: name || title || 'Product Image',
          isPrimary: index === 0 || url === primaryImage
        };
      });
    }

    // Ensure we have at least one image
    if (formattedImages.length === 0) {
      formattedImages.push({
        url: 'https://placehold.co/300x300/e2e8f0/475569?text=Produit',
        alt: name || title || 'Product Image',
        isPrimary: true
      });
    }

    const productData = {
      ...otherFields,
      title: title || name,
      description: description || name || 'Pas de description',
      category: categoryId,
      vendorId,
      status: otherFields.status || 'active',
      images: formattedImages
    };

    const product = new Product(productData);
    await product.save();

    // Mettre à jour le nombre de produits du vendeur
    await Vendor.findByIdAndUpdate(vendorId, {
      $inc: { 'stats.totalProducts': 1 }
    });

    res.status(201).json({
      message: 'Produit créé avec succès',
      product
    });

  } catch (error) {
    console.error('Erreur création produit:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Import bulk products (CSV import)
 * POST /api/vendor/products/bulk
 */
exports.bulkImportProducts = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const userId = req.user.userId;

    if (!vendorId) {
      return res.status(403).json({ message: 'Accès vendeur requis' });
    }

    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Aucun produit à importer' });
    }

    // Import security utilities
    const { validateProductBatch, sanitizeString } = require('../utils/security');
    const Message = require('../models/Message');
    const User = require('../models/User');

    const MAX_PRODUCTS = 300;
    const securityAlerts = [];

    // Check if batch exceeds limit
    if (products.length > MAX_PRODUCTS) {
      securityAlerts.push({
        type: 'BATCH_LIMIT_EXCEEDED',
        message: `Tentative d'import de ${products.length} produits (limite: ${MAX_PRODUCTS})`,
        vendorId,
        userId
      });

      // Notify admin about limit exceeded
      try {
        const admins = await User.find({ role: 'admin' }).select('_id');
        const vendor = await Vendor.findById(vendorId).select('companyName');

        for (const admin of admins) {
          await Message.create({
            sender: userId,
            recipient: admin._id,
            subject: '⚠️ Limite d\'import dépassée',
            content: `Le vendeur "${vendor?.companyName || vendorId}" a tenté d'importer ${products.length} produits, dépassant la limite de ${MAX_PRODUCTS}. L'import a été limité aux ${MAX_PRODUCTS} premiers produits.`,
            type: 'notification',
            priority: 'high'
          });
        }
      } catch (notifError) {
        console.error('Erreur notification admin:', notifError);
      }
    }

    // Validate and sanitize products
    const validation = validateProductBatch(products.slice(0, MAX_PRODUCTS), MAX_PRODUCTS);

    // If there are security alerts, notify admin
    if (validation.securityAlerts.length > 0) {
      securityAlerts.push(...validation.securityAlerts);

      try {
        const admins = await User.find({ role: 'admin' }).select('_id');
        const vendor = await Vendor.findById(vendorId).select('companyName');

        for (const admin of admins) {
          await Message.create({
            sender: userId,
            recipient: admin._id,
            subject: '🚨 Alerte sécurité - Import produits',
            content: `ALERTE SÉCURITÉ:\n\nVendeur: ${vendor?.companyName || vendorId}\n\nMenaces détectées:\n${validation.securityAlerts.map(a => `- ${a.message}`).join('\n')}\n\nL'import a été bloqué pour les produits concernés.`,
            type: 'notification',
            priority: 'urgent'
          });
        }
      } catch (notifError) {
        console.error('Erreur notification sécurité:', notifError);
      }
    }

    const importedProducts = [];
    const errors = [...validation.errors];

    // Process only validated products
    for (let i = 0; i < validation.products.length; i++) {
      try {
        const p = validation.products[i];

        // Validation des champs obligatoires
        if (!p.name && !p.title) {
          errors.push({ index: i, name: `Produit ${i + 1}`, error: 'Nom manquant' });
          continue;
        }

        // Map category name to category ID
        let categoryId = null;
        if (p.category) {
          const Category = require('../models/Category');
          const sanitizedCategory = sanitizeString(p.category);
          const cat = await Category.findOne({
            $or: [
              { name: { $regex: new RegExp(`^${sanitizedCategory}$`, 'i') } },
              { _id: mongoose.isValidObjectId(p.category) ? p.category : null }
            ]
          });

          if (!cat) {
            errors.push({ index: i, name: p.name || p.title, error: `Catégorie introuvable: ${p.category}` });
            continue;
          }
          categoryId = cat._id;
        }

        // Format images (already validated for malicious URLs)
        const rawImages = p.images || [];
        const formattedImages = rawImages.map((img, idx) => ({
          url: typeof img === 'string' ? img : (img.url || 'https://placehold.co/300x300/e2e8f0/475569?text=Produit'),
          alt: sanitizeString(p.name || p.title || 'Product'),
          isPrimary: idx === 0
        }));

        // Add default image if none provided
        if (formattedImages.length === 0) {
          formattedImages.push({
            url: 'https://placehold.co/300x300/e2e8f0/475569?text=Produit',
            alt: sanitizeString(p.name || p.title || 'Product'),
            isPrimary: true
          });
        }

        const productData = {
          title: sanitizeString(p.name || p.title),
          description: sanitizeString(p.description || p.name || 'Pas de description'),
          price: Math.max(0, parseFloat(p.price) || 0),
          comparePrice: Math.max(0, parseFloat(p.comparePrice) || 0),
          currency: ['TND', 'EUR', 'USD', 'CNY'].includes(p.currency) ? p.currency : 'TND',
          category: categoryId,
          stock: Math.max(0, parseInt(p.stock) || 0),
          sku: sanitizeString(p.sku || `SKU-${Date.now()}-${i}`),
          brand: sanitizeString(p.brand || ''),
          status: ['active', 'draft', 'inactive'].includes(p.status) ? p.status : 'active',
          isFeatured: p.isFeatured === true || p.isFeatured === 'true',
          featured: p.isFeatured === true || p.isFeatured === 'true',
          vendorId,
          images: formattedImages
        };

        const product = new Product(productData);
        await product.save();
        importedProducts.push(product);

      } catch (itemError) {
        errors.push({
          index: i,
          name: validation.products[i]?.name || `Produit ${i + 1}`,
          error: itemError.message
        });
      }
    }

    // Update vendor stats
    if (importedProducts.length > 0) {
      await Vendor.findByIdAndUpdate(vendorId, {
        $inc: { 'stats.totalProducts': importedProducts.length }
      });
    }

    res.status(201).json({
      message: `${importedProducts.length} produits importés avec succès`,
      imported: importedProducts.length,
      failed: errors.length,
      securityAlerts: securityAlerts.length > 0 ? securityAlerts.length : undefined,
      errors: errors.length > 0 ? errors.slice(0, 20) : undefined, // Limit error list
      products: importedProducts
    });

  } catch (error) {
    console.error('Erreur import bulk:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Modifier un produit
 * PUT /api/vendor/products/:id
 */
exports.updateProduct = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { id } = req.params;

    if (!vendorId) {
      return res.status(403).json({ message: 'Accès vendeur requis' });
    }

    const product = await Product.findOne({ _id: id, vendorId });

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    const { name, title, images, primaryImage, category, description, ...otherFields } = req.body;

    // Convert category name to ObjectId if needed
    if (category) {
      const Category = require('../models/Category');
      if (mongoose.isValidObjectId(category)) {
        product.category = category;
      } else {
        const cat = await Category.findOne({
          name: { $regex: new RegExp(`^${category}$`, 'i') }
        });
        if (!cat) {
          return res.status(400).json({ message: `Catégorie introuvable: ${category}` });
        }
        product.category = cat._id;
      }
    }

    // Update basic fields
    Object.assign(product, otherFields);

    // Update title if name provided
    if (name) product.title = name;
    if (title) product.title = title;

    // Update description if provided
    if (description) product.description = description;

    // Update images if provided
    if (images && Array.isArray(images)) {
      product.images = images.map((img, index) => {
        const url = typeof img === 'string' ? img : img.url;
        return {
          url: url || 'https://placehold.co/300x300/e2e8f0/475569?text=Produit',
          alt: product.title,
          isPrimary: index === 0 || url === primaryImage
        };
      });
    }

    await product.save();

    res.json({
      message: 'Produit mis à jour avec succès',
      product
    });

  } catch (error) {
    console.error('Erreur mise à jour produit:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Supprimer un produit
 * DELETE /api/vendor/products/:id
 */
exports.deleteProduct = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { id } = req.params;

    if (!vendorId) {
      return res.status(403).json({ message: 'Accès vendeur requis' });
    }

    const product = await Product.findOneAndDelete({ _id: id, vendorId });

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Mettre à jour le nombre de produits du vendeur
    await Vendor.findByIdAndUpdate(vendorId, {
      $inc: { 'stats.totalProducts': -1 }
    });

    res.json({ message: 'Produit supprimé avec succès' });

  } catch (error) {
    console.error('Erreur suppression produit:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Obtenir toutes les commandes du vendeur
 * GET /api/vendor/orders
 */
exports.getOrders = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;

    if (!vendorId) {
      return res.status(403).json({ message: 'Accès vendeur requis' });
    }

    const { search, status, page = 1, limit = 20 } = req.query;

    const query = { vendorId };

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { clientCode: { $regex: search, $options: 'i' } },
        { deliveryCode: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .select('-shippingAddress.recipientName -shippingAddress.phone -userId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments(query);

    // Statistiques rapides
    const stats = {
      pending: await Order.countDocuments({ vendorId, status: 'pending' }),
      confirmed: await Order.countDocuments({ vendorId, status: 'confirmed' }),
      shipped: await Order.countDocuments({ vendorId, status: 'shipped' }),
      delivered: await Order.countDocuments({ vendorId, status: 'delivered' })
    };

    res.json({
      orders,
      stats,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Confirmer une commande
 * PUT /api/vendor/orders/:id/confirm
 */
exports.confirmOrder = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { id } = req.params;

    if (!vendorId) {
      return res.status(403).json({ message: 'Accès vendeur requis' });
    }

    const order = await Order.findOne({ _id: id, vendorId });

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Cette commande ne peut pas être confirmée' });
    }

    order.addStatusChange('confirmed', 'Commande confirmée par le vendeur', req.user._id);
    await order.save();

    res.json({
      message: 'Commande confirmée avec succès',
      order
    });

  } catch (error) {
    console.error('Erreur confirmation commande:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Annuler une commande
 * PUT /api/vendor/orders/:id/cancel
 */
exports.cancelOrder = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { id } = req.params;
    const { reason } = req.body;

    if (!vendorId) {
      return res.status(403).json({ message: 'Accès vendeur requis' });
    }

    const order = await Order.findOne({ _id: id, vendorId });

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    if (!order.canBeCancelled()) {
      return res.status(400).json({ message: 'Cette commande ne peut pas être annulée' });
    }

    order.cancellation = {
      reason: reason || 'Annulée par le vendeur',
      date: new Date()
    };
    order.addStatusChange('cancelled', reason, req.user._id);
    await order.save();

    // Restaurer le stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity }
      });
    }

    res.json({
      message: 'Commande annulée avec succès',
      order
    });

  } catch (error) {
    console.error('Erreur annulation commande:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Marquer une commande comme prête à expédier
 * PUT /api/vendor/orders/:id/ship
 */
exports.shipOrder = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { id } = req.params;
    const { carrier, trackingNumber } = req.body;

    if (!vendorId) {
      return res.status(403).json({ message: 'Accès vendeur requis' });
    }

    const order = await Order.findOne({ _id: id, vendorId });

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    if (!['confirmed', 'processing'].includes(order.status)) {
      return res.status(400).json({ message: 'Cette commande ne peut pas être expédiée' });
    }

    order.shipping = {
      ...order.shipping,
      carrier,
      trackingNumber,
      trackingUrl: trackingNumber ? `https://tracking.example.com/${trackingNumber}` : null,
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // +3 jours
    };

    // Utiliser le statut correct du flux livreur
    order.addStatusChange('ready_to_ship', 'Commande prête à expédier - En attente d\'assignation livreur', req.user._id);
    await order.save();

    res.json({
      message: 'Commande prête à expédier. Vous pouvez maintenant l\'assigner à un livreur.',
      order
    });

  } catch (error) {
    console.error('Erreur expédition commande:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Obtenir les détails d'une commande (avec code client uniquement)
 * GET /api/vendor/orders/:id
 */
exports.getOrderDetails = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { id } = req.params;

    if (!vendorId) {
      return res.status(403).json({ message: 'Accès vendeur requis' });
    }

    const order = await Order.findOne({ _id: id, vendorId })
      .select('-shippingAddress.recipientName -shippingAddress.phone -userId')
      .populate('items.productId', 'title images');

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    res.json({ order });

  } catch (error) {
    console.error('Erreur détails commande:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Analytics - Données détaillées
 * GET /api/vendor/analytics
 */
exports.getAnalytics = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { period = 'month' } = req.query;

    if (!vendorId) {
      return res.status(403).json({ message: 'Accès vendeur requis' });
    }

    // Calculer la période
    let startDate = new Date();
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const orders = await Order.find({
      vendorId,
      createdAt: { $gte: startDate }
    });

    const products = await Product.find({ vendorId });
    const reviews = await Review.find({ vendorId });

    // Revenus par jour
    const revenueByDay = {};
    orders.forEach(order => {
      if (['delivered', 'shipped', 'processing'].includes(order.status)) {
        const date = order.createdAt.toISOString().split('T')[0];
        revenueByDay[date] = (revenueByDay[date] || 0) + order.totalAmount;
      }
    });

    // Performance par catégorie
    const categoryPerformance = {};
    products.forEach(product => {
      const categoryId = product.category?.toString() || 'Non catégorisé';
      if (!categoryPerformance[categoryId]) {
        categoryPerformance[categoryId] = {
          sales: 0,
          revenue: 0,
          products: 0
        };
      }
      categoryPerformance[categoryId].products += 1;
      categoryPerformance[categoryId].sales += product.totalSales || 0;
    });

    // Heures de pointe
    const hourlyOrders = new Array(24).fill(0);
    orders.forEach(order => {
      const hour = order.createdAt.getHours();
      hourlyOrders[hour] += 1;
    });

    // Top 10 produits
    const topProducts = products
      .sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0))
      .slice(0, 10)
      .map(p => ({
        id: p._id,
        title: p.title,
        sales: p.totalSales || 0,
        revenue: (p.totalSales || 0) * p.price,
        rating: p.rating || 0,
        stock: p.stock
      }));

    // Statistiques période précédente (pour comparaison)
    const previousStartDate = new Date(startDate);
    const periodLength = Date.now() - startDate.getTime();
    previousStartDate.setTime(previousStartDate.getTime() - periodLength);

    const previousOrders = await Order.find({
      vendorId,
      createdAt: { $gte: previousStartDate, $lt: startDate }
    });

    const currentRevenue = orders
      .filter(o => ['delivered', 'shipped', 'processing'].includes(o.status))
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const previousRevenue = previousOrders
      .filter(o => ['delivered', 'shipped', 'processing'].includes(o.status))
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const revenueGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : 0;

    res.json({
      period,
      stats: {
        revenue: currentRevenue,
        previousRevenue,
        revenueGrowth: parseFloat(revenueGrowth),
        orders: orders.length,
        previousOrders: previousOrders.length,
        ordersGrowth: previousOrders.length > 0
          ? ((orders.length - previousOrders.length) / previousOrders.length * 100).toFixed(1)
          : 0,
        averageOrderValue: orders.length > 0 ? currentRevenue / orders.length : 0,
        conversionRate: 4.2 // À calculer avec les visites
      },
      revenueByDay,
      categoryPerformance,
      hourlyOrders,
      topProducts,
      performance: {
        quality: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
        speed: 4.2,
        communication: 4.5,
        price: 4.1,
        service: 4.6
      }
    });

  } catch (error) {
    console.error('Erreur analytics:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ============== COUPON MANAGEMENT (VENDOR-SCOPED) ==============

/**
 * Obtenir tous les coupons du vendeur
 * GET /api/vendor/coupons
 */
exports.getCoupons = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;

    if (!vendorId) {
      return res.status(403).json({ message: 'Accès vendeur requis' });
    }

    const { search, promoType, status, page = 1, limit = 20 } = req.query;

    const query = { vendorId };

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (promoType && promoType !== 'all') {
      query.promoType = promoType;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const coupons = await Coupon.find(query)
      .populate('conditions.applicableProducts', 'title')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Coupon.countDocuments(query);

    // Stats
    const stats = {
      total: await Coupon.countDocuments({ vendorId }),
      active: await Coupon.countDocuments({ vendorId, isActive: true }),
      expired: await Coupon.countDocuments({ vendorId, validTo: { $lt: new Date() } }),
      totalUsage: (await Coupon.aggregate([
        { $match: { vendorId: req.user.vendorId } },
        { $group: { _id: null, total: { $sum: '$usageCount' } } }
      ]))[0]?.total || 0
    };

    res.json({
      success: true,
      coupons,
      stats,
      pagination: {
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur récupération coupons:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Obtenir un coupon par ID
 * GET /api/vendor/coupons/:id
 */
exports.getCouponById = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { id } = req.params;

    if (!vendorId) {
      return res.status(403).json({ message: 'Accès vendeur requis' });
    }

    const coupon = await Coupon.findOne({ _id: id, vendorId })
      .populate('conditions.applicableProducts', 'title price images')
      .populate('usedBy.userId', 'firstName lastName')
      .populate('usedBy.orderId', 'orderNumber totalAmount');

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon non trouvé' });
    }

    res.json({ success: true, coupon });

  } catch (error) {
    console.error('Erreur récupération coupon:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Créer un coupon
 * POST /api/vendor/coupons
 */
exports.createCoupon = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;

    if (!vendorId) {
      return res.status(403).json({ message: 'Accès vendeur requis' });
    }

    const {
      code,
      description,
      promoType,
      discountType,
      discountValue,
      flashSale,
      conditions,
      usageLimit,
      validFrom,
      validTo
    } = req.body;

    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Ce code de coupon existe déjà' });
    }

    // Validate discount value
    if (discountType === 'percentage' && discountValue > 100) {
      return res.status(400).json({ message: 'Le pourcentage ne peut pas dépasser 100%' });
    }

    // Vendors can only create standard or flash_sale coupons
    const allowedTypes = ['standard', 'flash_sale'];
    if (promoType && !allowedTypes.includes(promoType)) {
      return res.status(400).json({ message: 'Type de promotion non autorisé pour les vendeurs' });
    }

    // Verify products belong to vendor
    if (conditions?.applicableProducts?.length > 0) {
      const vendorProducts = await Product.find({
        _id: { $in: conditions.applicableProducts },
        vendorId
      });
      if (vendorProducts.length !== conditions.applicableProducts.length) {
        return res.status(400).json({ message: 'Certains produits ne vous appartiennent pas' });
      }
    }

    const coupon = new Coupon({
      code,
      description,
      vendorId,
      promoType: promoType || 'standard',
      discountType,
      discountValue,
      flashSale,
      conditions,
      usageLimit,
      validFrom,
      validTo,
      createdBy: req.user._id
    });

    await coupon.save();

    res.status(201).json({
      success: true,
      message: 'Coupon créé avec succès',
      coupon
    });

  } catch (error) {
    console.error('Erreur création coupon:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Modifier un coupon
 * PUT /api/vendor/coupons/:id
 */
exports.updateCoupon = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { id } = req.params;

    if (!vendorId) {
      return res.status(403).json({ message: 'Accès vendeur requis' });
    }

    const coupon = await Coupon.findOne({ _id: id, vendorId });

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon non trouvé' });
    }

    // Check for duplicate code if code is being changed
    if (req.body.code && req.body.code.toUpperCase() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ code: req.body.code.toUpperCase() });
      if (existingCoupon) {
        return res.status(400).json({ message: 'Ce code de coupon existe déjà' });
      }
    }

    // Validate discount value
    if (req.body.discountType === 'percentage' && req.body.discountValue > 100) {
      return res.status(400).json({ message: 'Le pourcentage ne peut pas dépasser 100%' });
    }

    // Verify products belong to vendor if being updated
    if (req.body.conditions?.applicableProducts?.length > 0) {
      const vendorProducts = await Product.find({
        _id: { $in: req.body.conditions.applicableProducts },
        vendorId
      });
      if (vendorProducts.length !== req.body.conditions.applicableProducts.length) {
        return res.status(400).json({ message: 'Certains produits ne vous appartiennent pas' });
      }
    }

    // Don't allow changing vendorId
    delete req.body.vendorId;

    Object.assign(coupon, req.body);
    await coupon.save();

    res.json({
      success: true,
      message: 'Coupon mis à jour avec succès',
      coupon
    });

  } catch (error) {
    console.error('Erreur mise à jour coupon:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Supprimer un coupon
 * DELETE /api/vendor/coupons/:id
 */
exports.deleteCoupon = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { id } = req.params;

    if (!vendorId) {
      return res.status(403).json({ message: 'Accès vendeur requis' });
    }

    const coupon = await Coupon.findOne({ _id: id, vendorId });

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon non trouvé' });
    }

    // If coupon has been used, just deactivate it
    if (coupon.usageCount > 0) {
      coupon.isActive = false;
      await coupon.save();
      return res.json({ success: true, message: 'Coupon désactivé (utilisé précédemment)' });
    }

    await Coupon.findByIdAndDelete(id);

    res.json({ success: true, message: 'Coupon supprimé avec succès' });

  } catch (error) {
    console.error('Erreur suppression coupon:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Activer/Désactiver un coupon
 * PUT /api/vendor/coupons/:id/toggle
 */
exports.toggleCouponStatus = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { id } = req.params;

    if (!vendorId) {
      return res.status(403).json({ message: 'Accès vendeur requis' });
    }

    const coupon = await Coupon.findOne({ _id: id, vendorId });

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon non trouvé' });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({
      success: true,
      message: `Coupon ${coupon.isActive ? 'activé' : 'désactivé'} avec succès`,
      coupon
    });

  } catch (error) {
    console.error('Erreur toggle coupon:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = exports;
