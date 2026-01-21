const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  // Type d'annonce
  type: {
    type: String,
    enum: ['message', 'offer', 'social', 'info'],
    default: 'message'
  },
  
  // Contenu principal
  content: {
    type: String,
    required: [true, 'Le contenu est requis'],
    maxlength: [200, 'Le contenu ne peut pas dépasser 200 caractères']
  },
  
  // Lien optionnel
  link: {
    type: String,
    default: null
  },
  
  // Texte du lien
  linkText: {
    type: String,
    default: null
  },
  
  // Icône (emoji ou nom d'icône)
  icon: {
    type: String,
    default: '📢'
  },
  
  // Couleur de fond (gradient)
  backgroundColor: {
    type: String,
    default: 'from-primary-600 via-primary-500 to-primary-600'
  },
  
  // Priorité (plus élevé = affiché en premier)
  priority: {
    type: Number,
    default: 0
  },
  
  // Dates de validité
  startDate: {
    type: Date,
    default: Date.now
  },
  
  endDate: {
    type: Date,
    default: null
  },
  
  // État actif/inactif
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Réseaux sociaux (si type = social)
  socialLinks: {
    facebook: { type: String, default: null },
    instagram: { type: String, default: null },
    twitter: { type: String, default: null },
    tiktok: { type: String, default: null },
    youtube: { type: String, default: null }
  },
  
  // Informations de contact (si type = info)
  contactInfo: {
    phone: { type: String, default: null },
    email: { type: String, default: null },
    address: { type: String, default: null }
  },
  
  // Créé par
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index pour les requêtes fréquentes
announcementSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
announcementSchema.index({ type: 1, isActive: 1 });

// Méthode statique pour obtenir les annonces actives
announcementSchema.statics.getActiveAnnouncements = async function() {
  const now = new Date();
  
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    $or: [
      { endDate: null },
      { endDate: { $gte: now } }
    ]
  })
  .sort({ priority: -1, createdAt: -1 })
  .limit(5);
};

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
