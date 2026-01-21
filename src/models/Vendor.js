const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'ID utilisateur est requis'],
    unique: true
  },
  
  // Informations de l'entreprise
  companyInfo: {
    name: {
      type: String,
      required: [true, 'Le nom de l\'entreprise est requis'],
      trim: true
    },
    description: {
      type: String,
      maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères']
    },
    logo: String,
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true, default: 'Tunisie' }
    },
    phone: {
      type: String,
      required: [true, 'Le numéro de téléphone de l\'entreprise est requis']
    },
    email: {
      type: String,
      required: [true, 'L\'email de l\'entreprise est requis'],
      lowercase: true,
      trim: true
    },
    website: String
  },
  
  // Documents légaux
  documents: {
    siret: {
      number: String,
      document: String, // URL du document
      verified: { type: Boolean, default: false }
    },
    taxId: {
      number: String,
      document: String,
      verified: { type: Boolean, default: false }
    },
    identityCard: {
      number: String,
      document: String,
      verified: { type: Boolean, default: false }
    },
    businessLicense: {
      document: String,
      verified: { type: Boolean, default: false }
    }
  },
  
  // Informations bancaires
  bankInfo: {
    accountHolder: String,
    iban: String,
    bankName: String,
    swift: String
  },
  
  // Statut du vendeur
  status: {
    type: String,
    enum: ['pending', 'approved', 'suspended', 'rejected'],
    default: 'pending'
  },
  
  // Statistiques
  stats: {
    totalSales: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalProducts: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 }
  },
  
  // Commission
  commission: {
    rate: { type: Number, default: 10, min: 0, max: 100 }, // Pourcentage
    type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' }
  },
  
  // Catégories de produits autorisées
  allowedCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  // Politique de retour
  returnPolicy: {
    acceptReturns: { type: Boolean, default: true },
    returnPeriod: { type: Number, default: 14 }, // Jours
    conditions: String
  },
  
  // Politique d'expédition
  shippingPolicy: {
    domesticShipping: {
      enabled: { type: Boolean, default: true },
      cost: Number,
      freeShippingThreshold: Number,
      estimatedDays: { min: Number, max: Number }
    },
    internationalShipping: {
      enabled: { type: Boolean, default: false },
      cost: Number,
      estimatedDays: { min: Number, max: Number }
    }
  },
  
  // Vérifications
  verifications: {
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    identityVerified: { type: Boolean, default: false },
    addressVerified: { type: Boolean, default: false }
  },
  
  // Métadonnées
  isActive: { type: Boolean, default: true },
  lastActive: Date,
  notes: String, // Notes admin
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index
vendorSchema.index({ userId: 1 });
vendorSchema.index({ status: 1 });
vendorSchema.index({ 'companyInfo.name': 'text' });
vendorSchema.index({ 'stats.rating': -1 });

// Virtual pour les produits
vendorSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'vendorId'
});

// Virtual pour les commandes
vendorSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'vendorId'
});

// Méthode pour calculer la note moyenne
vendorSchema.methods.updateRating = async function() {
  const Product = mongoose.model('Product');
  const products = await Product.find({ vendorId: this._id });
  
  if (products.length === 0) {
    this.stats.rating = 0;
    this.stats.reviewCount = 0;
    return;
  }
  
  let totalRating = 0;
  let totalReviews = 0;
  
  products.forEach(product => {
    if (product.rating && product.reviewCount > 0) {
      totalRating += product.rating * product.reviewCount;
      totalReviews += product.reviewCount;
    }
  });
  
  this.stats.rating = totalReviews > 0 ? totalRating / totalReviews : 0;
  this.stats.reviewCount = totalReviews;
  
  await this.save();
};

// Méthode pour vérifier si le vendeur peut vendre
vendorSchema.methods.canSell = function() {
  return this.status === 'approved' && this.isActive;
};

module.exports = mongoose.model('Vendor', vendorSchema);
