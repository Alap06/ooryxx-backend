const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Le code est requis'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },

  description: String,

  // Vendor-specific coupon (null for platform-wide)
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    default: null,
    index: true
  },

  // Type of promotion
  promoType: {
    type: String,
    enum: ['standard', 'flash_sale', 'loyalty', 'newsletter', 'welcome'],
    default: 'standard'
  },

  // Type et montant de réduction
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
    default: 'percentage'
  },

  discountValue: {
    type: Number,
    required: [true, 'La valeur de réduction est requise'],
    min: 0
  },

  // Flash sale specific settings
  flashSale: {
    startTime: Date,
    endTime: Date,
    limitedQuantity: Number,
    soldCount: {
      type: Number,
      default: 0
    }
  },

  // Loyalty program settings
  loyalty: {
    pointsRequired: Number,
    tierRequired: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', null],
      default: null
    }
  },

  // Conditions d'utilisation
  conditions: {
    minimumPurchase: {
      type: Number,
      default: 0
    },

    maximumDiscount: Number, // Pour les pourcentages

    applicableCategories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }],

    applicableProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],

    excludedProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],

    userLevel: {
      type: String,
      enum: ['all', 'normal', 'VIP']
    },

    firstPurchaseOnly: {
      type: Boolean,
      default: false
    },

    combinable: {
      type: Boolean,
      default: false
    }
  },

  // Limites d'utilisation
  usageLimit: {
    total: Number, // Nombre total d'utilisations
    perUser: {
      type: Number,
      default: 1
    }
  },

  // Compteur d'utilisation
  usageCount: {
    type: Number,
    default: 0
  },

  // Utilisations
  usedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    discountApplied: Number
  }],

  // Dates de validité
  validFrom: {
    type: Date,
    default: Date.now
  },

  validTo: Date,

  // Statut
  isActive: {
    type: Boolean,
    default: true
  },

  // Créé par
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, validFrom: 1, validTo: 1 });

// Méthode pour vérifier si le coupon est valide
couponSchema.methods.isValid = function () {
  const now = new Date();

  if (!this.isActive) return false;
  if (this.validFrom && this.validFrom > now) return false;
  if (this.validTo && this.validTo < now) return false;
  if (this.usageLimit?.total && this.usageCount >= this.usageLimit.total) return false;

  return true;
};

// Méthode pour vérifier si l'utilisateur peut utiliser le coupon
couponSchema.methods.canBeUsedBy = function (userId) {
  if (!this.isValid()) return false;

  const userUsages = this.usedBy.filter(u =>
    u.userId.toString() === userId.toString()
  ).length;

  if (this.usageLimit?.perUser && userUsages >= this.usageLimit.perUser) {
    return false;
  }

  return true;
};

// Méthode pour calculer la réduction
couponSchema.methods.calculateDiscount = function (cartTotal) {
  if (!this.isValid()) return 0;

  if (this.conditions?.minimumPurchase && cartTotal < this.conditions.minimumPurchase) {
    return 0;
  }

  let discount = 0;

  if (this.discountType === 'percentage') {
    discount = (cartTotal * this.discountValue) / 100;

    if (this.conditions?.maximumDiscount) {
      discount = Math.min(discount, this.conditions.maximumDiscount);
    }
  } else {
    discount = this.discountValue;
  }

  return Math.min(discount, cartTotal);
};

// Méthode pour enregistrer l'utilisation
couponSchema.methods.recordUsage = function (userId, orderId, discountApplied) {
  this.usedBy.push({
    userId,
    orderId,
    usedAt: new Date(),
    discountApplied
  });

  this.usageCount += 1;

  return this.save();
};

module.exports = mongoose.model('Coupon', couponSchema);