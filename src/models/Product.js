const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: [true, 'Le vendeur est requis'],
    index: true
  },

  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
    maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
  },

  description: {
    type: String,
    required: [true, 'La description est requise'],
    maxlength: [5000, 'La description ne peut pas dépasser 5000 caractères']
  },

  images: [{
    url: { type: String, required: true },
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'La catégorie est requise'],
    index: true
  },

  // Prix
  price: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },

  currency: {
    type: String,
    enum: ['TND', 'EUR', 'USD', 'CNY'],
    default: 'TND'
  },

  discount: {
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    startDate: Date,
    endDate: Date
  },

  finalPrice: {
    type: Number,
    default: function () { return this.price; }
  },

  // Stock
  stock: {
    type: Number,
    required: [true, 'Le stock est requis'],
    min: [0, 'Le stock ne peut pas être négatif'],
    default: 0
  },

  lowStockThreshold: {
    type: Number,
    default: 10
  },

  // Attributs/Variantes
  attributes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
    // Exemple: { couleur: 'Rouge', taille: 'M', poids: '500g' }
  },

  variants: [{
    name: String,
    options: [{
      value: String,
      price: Number, // Prix additionnel
      stock: Number
    }]
  }],

  // Spécifications techniques
  specifications: [{
    key: String,
    value: String
  }],

  // SEO
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    slug: {
      type: String,
      sparse: true
    }
  },

  // Évaluations
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },

  reviewCount: {
    type: Number,
    default: 0
  },

  // Priorité pour le référencement
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Badges
  badges: [{
    type: String,
    enum: ['nouveau', 'populaire', 'promo', 'épuisé', 'top-ventes']
  }],

  // Livraison
  shipping: {
    weight: Number, // en kg
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    freeShipping: { type: Boolean, default: false },
    processingTime: { type: Number, default: 2 } // Jours
  },

  // Statut
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'out_of_stock', 'discontinued'],
    default: 'draft'
  },

  isPublished: {
    type: Boolean,
    default: false
  },

  publishedAt: Date,

  // Statistiques
  views: {
    type: Number,
    default: 0
  },

  totalSales: {
    type: Number,
    default: 0
  },

  // Métadonnées
  tags: [String],
  featured: { type: Boolean, default: false },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les recherches
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ totalSales: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ status: 1, isPublished: 1 });

// Virtual pour les avis
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'productId'
});

// Calcul du prix final avant sauvegarde
productSchema.pre('save', function (next) {
  if (this.discount && this.discount.percentage > 0) {
    const now = new Date();
    const discountActive = (!this.discount.startDate || this.discount.startDate <= now) &&
      (!this.discount.endDate || this.discount.endDate >= now);

    if (discountActive) {
      this.finalPrice = this.price * (1 - this.discount.percentage / 100);
    } else {
      this.finalPrice = this.price;
    }
  } else {
    this.finalPrice = this.price;
  }

  // Générer le slug si pas défini
  if (!this.seo.slug && this.title) {
    this.seo.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  next();
});

// Méthode pour mettre à jour la note
productSchema.methods.updateRating = async function () {
  const Review = mongoose.model('Review');
  const reviews = await Review.find({
    productId: this._id,
    isModerated: true
  });

  if (reviews.length === 0) {
    this.rating = 0;
    this.reviewCount = 0;
  } else {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating = totalRating / reviews.length;
    this.reviewCount = reviews.length;
  }

  await this.save();
};

// Méthode pour vérifier si le produit est en stock
productSchema.methods.isInStock = function (quantity = 1) {
  return this.stock >= quantity;
};

// Méthode pour décrémenter le stock
productSchema.methods.decrementStock = async function (quantity) {
  if (this.stock < quantity) {
    throw new Error('Stock insuffisant');
  }

  this.stock -= quantity;
  this.totalSales += quantity;

  if (this.stock === 0) {
    this.status = 'out_of_stock';
  }

  await this.save();
};

module.exports = mongoose.model('Product', productSchema);