const mongoose = require('mongoose');
const crypto = require('crypto');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  title: String, // Snapshot du titre
  image: String, // Snapshot de l'image
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  discount: {
    type: Number,
    default: 0
  },
  subtotal: Number,
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  }
});

const orderSchema = new mongoose.Schema({
  // Utilisateur
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur est requis'],
    index: true
  },

  // Vendeur principal (si une seule commande vendeur)
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    index: true
  },

  // Numéro de commande unique
  orderNumber: {
    type: String,
    unique: true
  },

  // Articles de la commande
  items: [orderItemSchema],

  // Anonymat: Code client pour le vendeur
  clientCode: {
    type: String,
    index: true
  },

  // Code de livraison pour le livreur
  deliveryCode: {
    type: String,
    unique: true
  },

  // Adresse de livraison (snapshot)
  shippingAddress: {
    recipientName: String,
    phone: String,
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'Tunisie' },
    instructions: String
  },

  // Montants
  subtotal: {
    type: Number,
    required: true
  },

  shippingCost: {
    type: Number,
    default: 0
  },

  tax: {
    type: Number,
    default: 0
  },

  discount: {
    type: Number,
    default: 0
  },

  totalAmount: {
    type: Number,
    required: true
  },

  // Méthode de paiement
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'usdt', 'poste_tunisienne', 'cash_on_delivery'],
    required: true
  },

  // Statut de paiement
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },

  // Référence du paiement
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },

  // Statut de la commande
  status: {
    type: String,
    enum: [
      'pending',              // En attente
      'confirmed',            // Confirmée par vendeur
      'processing',           // En traitement
      'ready_to_ship',        // Prête à expédier
      'assigned_to_delivery', // Assignée au livreur
      'picked_up',            // Récupérée par livreur
      'out_for_delivery',     // En cours de livraison
      'delivered',            // Livrée
      'delivery_attempted',   // Tentative échouée
      'refused',              // Refusée par client
      'returned',             // Retournée
      'cancelled',            // Annulée
      'refunded'              // Remboursée
    ],
    default: 'pending',
    index: true
  },

  // Historique des statuts
  statusHistory: [{
    status: String,
    date: { type: Date, default: Date.now },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Informations de livraison
  shipping: {
    carrier: String,
    trackingNumber: String,
    trackingUrl: String,
    estimatedDelivery: Date,
    actualDelivery: Date,
    deliveryAttempts: {
      type: Number,
      default: 0
    }
  },

  // Livreur assignment
  livreurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },

  assignedToLivreurAt: Date,
  pickedUpAt: Date,
  deliveredAt: Date,

  // Proof of delivery
  deliveryProof: {
    photo: String, // URL of delivery photo
    signature: String, // Base64 signature
    notes: String,
    location: {
      lat: Number,
      lng: Number
    },
    timestamp: Date
  },

  // Refusal/Return info
  refusalInfo: {
    reason: {
      type: String,
      enum: ['not_home', 'wrong_address', 'damaged', 'refused_payment', 'other']
    },
    details: String,
    photo: String,
    timestamp: Date
  },

  // Coupon appliqué
  coupon: {
    code: String,
    discount: Number,
    type: String // 'percentage' ou 'fixed'
  },

  // Notes
  customerNotes: String,
  vendorNotes: String,
  adminNotes: String,

  // Annulation/Retour
  cancellation: {
    reason: String,
    date: Date,
    refundStatus: String,
    refundAmount: Number
  },

  // Métadonnées
  ipAddress: String,
  userAgent: String,

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index
orderSchema.index({ createdAt: -1 });
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ vendorId: 1, status: 1 });

// Générer le numéro de commande avant sauvegarde
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }

  // Générer le code client (anonymat) - Format CLT-XXXX
  if (!this.clientCode) {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.clientCode = `CLT-${code}`;
  }

  // Générer le code de livraison - Format LIV-XXXXXX
  if (!this.deliveryCode) {
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.deliveryCode = `LIV-${code}`;
  }

  // Calculer le sous-total
  if (this.items && this.items.length > 0) {
    this.items.forEach(item => {
      item.subtotal = item.price * item.quantity * (1 - item.discount / 100);
    });

    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  // Calculer le total
  this.totalAmount = this.subtotal + this.shippingCost + this.tax - this.discount;

  next();
});

// Méthode pour ajouter un changement de statut
orderSchema.methods.addStatusChange = function (status, note, updatedBy) {
  this.status = status;
  this.statusHistory.push({
    status,
    date: new Date(),
    note,
    updatedBy
  });
};

// Méthode pour vérifier si la commande peut être annulée
orderSchema.methods.canBeCancelled = function () {
  return ['pending', 'confirmed', 'processing'].includes(this.status);
};

// Méthode pour obtenir les informations client pour le livreur
orderSchema.methods.getDeliveryInfo = function (code) {
  if (this.deliveryCode !== code) {
    throw new Error('Code de livraison invalide');
  }

  return {
    recipientName: this.shippingAddress.recipientName,
    phone: this.shippingAddress.phone,
    address: {
      street: this.shippingAddress.street,
      city: this.shippingAddress.city,
      postalCode: this.shippingAddress.postalCode,
      country: this.shippingAddress.country,
      instructions: this.shippingAddress.instructions
    },
    orderNumber: this.orderNumber,
    totalAmount: this.totalAmount
  };
};

module.exports = mongoose.model('Order', orderSchema);