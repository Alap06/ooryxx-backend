const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

/**
 * Obtenir des recommandations pour un utilisateur
 */
const getRecommendations = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return [];
    }
    
    // Récupérer l'historique des commandes de l'utilisateur
    const orders = await Order.find({ userId })
      .populate('items.productId')
      .limit(10)
      .sort({ createdAt: -1 });
    
    // Extraire les catégories des produits achetés
    const purchasedCategories = new Set();
    const purchasedProducts = new Set();
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.productId) {
          purchasedProducts.add(item.productId._id.toString());
          if (item.productId.category) {
            purchasedCategories.add(item.productId.category.toString());
          }
        }
      });
    });
    
    // Construire la requête de recommandation
    let query = {
      _id: { $nin: Array.from(purchasedProducts) },
      status: 'active',
      isPublished: true,
      stock: { $gt: 0 }
    };
    
    // Si des catégories ont été achetées, prioriser ces catégories
    if (purchasedCategories.size > 0) {
      query.category = { $in: Array.from(purchasedCategories) };
    }
    
    // Adapter selon le niveau utilisateur
    let recommendations;
    
    if (user.level === 'VIP') {
      // Pour les VIP, montrer des produits premium
      recommendations = await Product.find(query)
        .sort({ priority: -1, rating: -1, totalSales: -1 })
        .limit(20)
        .populate('category');
    } else {
      // Pour les utilisateurs normaux
      recommendations = await Product.find(query)
        .sort({ rating: -1, totalSales: -1 })
        .limit(15)
        .populate('category');
    }
    
    // Si pas assez de recommandations, ajouter des produits populaires
    if (recommendations.length < 10) {
      const popularProducts = await Product.find({
        _id: { $nin: [...Array.from(purchasedProducts), ...recommendations.map(p => p._id)] },
        status: 'active',
        isPublished: true,
        stock: { $gt: 0 }
      })
        .sort({ totalSales: -1, rating: -1 })
        .limit(10 - recommendations.length)
        .populate('category');
      
      recommendations = [...recommendations, ...popularProducts];
    }
    
    return recommendations;
    
  } catch (error) {
    console.error('Erreur recommandations:', error);
    return [];
  }
};

/**
 * Obtenir des produits similaires
 */
const getSimilarProducts = async (productId, limit = 6) => {
  try {
    const product = await Product.findById(productId);
    
    if (!product) {
      return [];
    }
    
    const similarProducts = await Product.find({
      _id: { $ne: productId },
      category: product.category,
      status: 'active',
      isPublished: true,
      stock: { $gt: 0 }
    })
      .sort({ rating: -1, totalSales: -1 })
      .limit(limit)
      .populate('category');
    
    return similarProducts;
    
  } catch (error) {
    console.error('Erreur produits similaires:', error);
    return [];
  }
};

/**
 * Obtenir les produits fréquemment achetés ensemble
 */
const getFrequentlyBoughtTogether = async (productId, limit = 4) => {
  try {
    // Trouver les commandes contenant ce produit
    const orders = await Order.find({
      'items.productId': productId,
      status: { $in: ['delivered', 'shipped'] }
    }).limit(50);
    
    // Compter les produits achetés avec celui-ci
    const productCount = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const itemId = item.productId.toString();
        if (itemId !== productId.toString()) {
          productCount[itemId] = (productCount[itemId] || 0) + 1;
        }
      });
    });
    
    // Trier par fréquence
    const sortedProducts = Object.entries(productCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id]) => id);
    
    // Récupérer les détails des produits
    const products = await Product.find({
      _id: { $in: sortedProducts },
      status: 'active',
      isPublished: true,
      stock: { $gt: 0 }
    }).populate('category');
    
    return products;
    
  } catch (error) {
    console.error('Erreur frequently bought together:', error);
    return [];
  }
};

module.exports = {
  getRecommendations,
  getSimilarProducts,
  getFrequentlyBoughtTogether
};
