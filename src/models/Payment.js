const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'La commande est requise'],
    index: true
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur est requis'],
    index: true
  },
  
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    index: true
  },
  
  // Méthode de paiement
  method: {
    type: String,
    enum: ['stripe', 'paypal', 'usdt', 'poste_tunisienne', 'cash_on_delivery'],
    required: [true, 'La méthode de paiement est requise']
  },
  
  // Montants
  amount: {
    type: Number,
    required: [true, 'Le montant est requis'],
    min: 0
  },
  
  currency: {
    type: String,
    default: 'TND'
  },
  
  // Statut
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Détails Stripe
  stripePaymentIntentId: String,
  stripeChargeId: String,
  stripeCustomerId: String,
  
  // Détails PayPal
  paypalOrderId: String,
  paypalPayerId: String,
  paypalPaymentId: String,
  
  // Détails USDT
  usdtWalletAddress: String,
  usdtTransactionHash: String,
  
  // Détails Poste Tunisienne
  posteTNReferenceNumber: String,
  posteTNReceiptImage: String,
  
  // Informations générales
  paymentProof: String, // URL de l'image de preuve
  
  transactionId: String, // ID de transaction générique
  
  // Métadonnées du paiement
  paymentDetails: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Informations de remboursement
  refund: {
    amount: Number,
    reason: String,
    refundedAt: Date,
    refundId: String,
    status: String
  },
  
  // Erreurs
  error: {
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed
  },
  
  // Dates importantes
  paidAt: Date,
  failedAt: Date,
  
  // IP et métadonnées
  ipAddress: String,
  userAgent: String,
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index
paymentSchema.index({ orderId: 1, status: 1 });
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ transactionId: 1 });

// Méthode pour marquer comme payé
paymentSchema.methods.markAsPaid = function(transactionId, details = {}) {
  this.status = 'completed';
  this.transactionId = transactionId;
  this.paidAt = new Date();
  this.paymentDetails = details;
  
  return this.save();
};

// Méthode pour marquer comme échoué
paymentSchema.methods.markAsFailed = function(errorCode, errorMessage) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.error = {
    code: errorCode,
    message: errorMessage
  };
  
  return this.save();
};

// Méthode pour rembourser
paymentSchema.methods.refund = async function(amount, reason, refundId) {
  this.status = 'refunded';
  this.refund = {
    amount: amount || this.amount,
    reason,
    refundedAt: new Date(),
    refundId,
    status: 'completed'
  };
  
  return this.save();
};

module.exports = mongoose.model('Payment', paymentSchema);