const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur est requis'],
    index: true
  },
  
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Le produit est requis'],
    index: true
  },
  
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  rating: {
    type: Number,
    required: [true, 'La note est requise'],
    min: [1, 'La note minimum est 1'],
    max: [5, 'La note maximum est 5']
  },
  
  title: {
    type: String,
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  
  comment: {
    type: String,
    required: [true, 'Le commentaire est requis'],
    maxlength: [1000, 'Le commentaire ne peut pas dépasser 1000 caractères']
  },
  
  images: [String], // Images jointes à l'avis
  
  // Modération
  isModerated: {
    type: Boolean,
    default: false
  },
  
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  moderatedAt: Date,
  
  moderationNote: String,
  
  // Visibilité
  isVisible: {
    type: Boolean,
    default: true
  },
  
  // Statut
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  
  // Réponse du vendeur
  vendorResponse: {
    comment: String,
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Métadonnées
  helpfulCount: {
    type: Number,
    default: 0
  },
  
  helpfulVotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  verifiedPurchase: {
    type: Boolean,
    default: false
  },
  
  // Signalements
  reports: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }]
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index composé
reviewSchema.index({ productId: 1, userId: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ createdAt: -1 });

// Méthode pour marquer comme utile
reviewSchema.methods.markHelpful = function(userId) {
  if (!this.helpfulVotes.includes(userId)) {
    this.helpfulVotes.push(userId);
    this.helpfulCount = this.helpfulVotes.length;
  }
  return this.save();
};

// Méthode pour modérer
reviewSchema.methods.moderate = function(status, moderatorId, note) {
  this.status = status;
  this.isModerated = true;
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  this.moderationNote = note;
  this.isVisible = status === 'approved';
  
  return this.save();
};

module.exports = mongoose.model('Review', reviewSchema);