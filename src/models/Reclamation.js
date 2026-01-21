const mongoose = require('mongoose');

const reclamationSchema = new mongoose.Schema({
    // Utilisateur (optionnel pour les réclamations anonymes)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },

    // Anonymat
    isAnonymous: {
        type: Boolean,
        default: false
    },

    // Email pour les réclamations anonymes
    anonymousEmail: {
        type: String,
        trim: true,
        lowercase: true
    },

    // Type de réclamation
    type: {
        type: String,
        enum: ['produit', 'livraison', 'vendeur', 'paiement', 'service', 'qualite', 'remboursement', 'autre'],
        required: [true, 'Le type de réclamation est requis']
    },

    // Sujet
    subject: {
        type: String,
        required: [true, 'Le sujet est requis'],
        trim: true,
        maxlength: [200, 'Le sujet ne peut pas dépasser 200 caractères']
    },

    // Description détaillée
    description: {
        type: String,
        required: [true, 'La description est requise'],
        trim: true,
        maxlength: [5000, 'La description ne peut pas dépasser 5000 caractères']
    },

    // Références optionnelles
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },

    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },

    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor'
    },

    // Statut de la réclamation
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'resolved', 'rejected', 'closed'],
        default: 'pending'
    },

    // Priorité
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },

    // Notes internes pour l'admin
    adminNotes: {
        type: String,
        maxlength: [2000, 'Les notes ne peuvent pas dépasser 2000 caractères']
    },

    // Réponse officielle à l'utilisateur
    response: {
        type: String,
        maxlength: [2000, 'La réponse ne peut pas dépasser 2000 caractères']
    },

    // Date de réponse
    respondedAt: Date,

    // Admin qui a traité
    handledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Pièces jointes
    attachments: [{
        url: String,
        filename: String,
        type: String
    }],

    // Historique des changements de statut
    statusHistory: [{
        status: String,
        date: { type: Date, default: Date.now },
        note: String,
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],

    // Métadonnées
    ipAddress: String,
    userAgent: String,

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index
reclamationSchema.index({ userId: 1 });
reclamationSchema.index({ status: 1 });
reclamationSchema.index({ type: 1 });
reclamationSchema.index({ priority: 1 });
reclamationSchema.index({ createdAt: -1 });

// Virtual pour le temps écoulé
reclamationSchema.virtual('timeElapsed').get(function () {
    const now = new Date();
    const diff = now - this.createdAt;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}j`;
    if (hours > 0) return `${hours}h`;
    return 'Récent';
});

// Méthode pour ajouter un changement de statut
reclamationSchema.methods.addStatusChange = function (status, note, updatedBy) {
    this.status = status;
    this.statusHistory.push({
        status,
        date: new Date(),
        note,
        updatedBy
    });
};

// Labels français pour les types
reclamationSchema.statics.getTypeLabels = function () {
    return {
        produit: 'Problème de produit',
        livraison: 'Problème de livraison',
        vendeur: 'Problème avec vendeur',
        paiement: 'Problème de paiement',
        service: 'Service client',
        qualite: 'Qualité du produit',
        remboursement: 'Demande de remboursement',
        autre: 'Autre'
    };
};

// Labels français pour les statuts
reclamationSchema.statics.getStatusLabels = function () {
    return {
        pending: 'En attente',
        in_progress: 'En cours',
        resolved: 'Résolu',
        rejected: 'Rejeté',
        closed: 'Fermé'
    };
};

// Labels français pour les priorités
reclamationSchema.statics.getPriorityLabels = function () {
    return {
        low: 'Basse',
        medium: 'Moyenne',
        high: 'Haute',
        urgent: 'Urgente'
    };
};

module.exports = mongoose.model('Reclamation', reclamationSchema);
