const mongoose = require('mongoose');

const featuredProductSchema = new mongoose.Schema({
  // Informations du produit
  name: {
    type: String,
    required: [true, 'Le nom du produit est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },

  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },

  // Prix
  price: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },

  originalPrice: {
    type: Number,
    min: [0, 'Le prix original ne peut pas être négatif']
  },

  currency: {
    type: String,
    enum: ['TND', 'DT', 'EUR', 'USD'],
    default: 'DT'
  },

  // Image
  image: {
    type: String,
    required: [true, 'L\'image est requise']
  },

  // Badge (Bestseller, Nouveau, Tendance, Exclusif, etc.)
  badge: {
    type: String,
    enum: ['Bestseller', 'Nouveau', 'Tendance', 'Exclusif', 'Promo', 'Limité', 'Top Vente'],
    default: 'Nouveau'
  },

  // Note et avis
  rating: {
    type: Number,
    min: [0, 'La note ne peut pas être négative'],
    max: [5, 'La note ne peut pas dépasser 5'],
    default: 4.5
  },

  reviewsCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Lien vers le produit réel (optionnel)
  productLink: {
    type: String,
    trim: true
  },

  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },

  // Ordre d'affichage dans le slider
  displayOrder: {
    type: Number,
    default: 0
  },

  // Statut
  isActive: {
    type: Boolean,
    default: true
  },

  // Dates de validité
  startDate: {
    type: Date,
    default: Date.now
  },

  endDate: {
    type: Date
  },

  // Métadonnées
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// Index pour les requêtes fréquentes
featuredProductSchema.index({ isActive: 1, displayOrder: 1 });
featuredProductSchema.index({ startDate: 1, endDate: 1 });

// Calculer le pourcentage de réduction
featuredProductSchema.virtual('discountPercent').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// S'assurer que les virtuels sont inclus dans JSON
featuredProductSchema.set('toJSON', { virtuals: true });
featuredProductSchema.set('toObject', { virtuals: true });

// Méthode statique pour récupérer les produits actifs
featuredProductSchema.statics.getActiveProducts = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    $or: [
      { endDate: { $exists: false } },
      { endDate: null },
      { endDate: { $gte: now } }
    ]
  }).sort({ displayOrder: 1, createdAt: -1 });
};

const FeaturedProduct = mongoose.model('FeaturedProduct', featuredProductSchema);

module.exports = FeaturedProduct;
