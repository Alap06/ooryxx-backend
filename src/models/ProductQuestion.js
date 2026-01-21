const mongoose = require('mongoose');

/**
 * ProductQuestion Model
 * Système de questions/réponses anonymes entre clients et vendeurs
 */
const productQuestionSchema = new mongoose.Schema({
    // Produit concerné
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Le produit est requis'],
        index: true
    },

    // Client qui pose la question (caché au vendeur)
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Le client est requis'],
        index: true
    },

    // Vendeur du produit (caché au client)
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: [true, 'Le vendeur est requis'],
        index: true
    },

    // Sujet de la question
    subject: {
        type: String,
        required: [true, 'Le sujet est requis'],
        maxlength: [200, 'Le sujet ne peut pas dépasser 200 caractères'],
        trim: true
    },

    // Historique des messages
    messages: [{
        content: {
            type: String,
            required: true,
            maxlength: [2000, 'Le message ne peut pas dépasser 2000 caractères']
        },
        // Qui envoie: 'customer' ou 'vendor'
        sender: {
            type: String,
            enum: ['customer', 'vendor'],
            required: true
        },
        // Message original avant sanitization
        originalContent: String,
        // Message bloqué pour contenu suspect
        isBlocked: {
            type: Boolean,
            default: false
        },
        // Raison du blocage
        blockReason: {
            type: String,
            enum: ['email', 'phone', 'url', 'social_media', 'multiple'],
            default: null
        },
        // Détails du blocage
        blockDetails: [{
            type: { type: String },
            match: String
        }],
        // Admin notifié pour ce message bloqué
        adminNotified: {
            type: Boolean,
            default: false
        },
        // Lu par le destinataire
        isRead: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Statut de la conversation
    status: {
        type: String,
        enum: ['open', 'answered', 'closed', 'blocked'],
        default: 'open',
        index: true
    },

    // Toujours anonyme
    isAnonymous: {
        type: Boolean,
        default: true
    },

    // Conversation bloquée définitivement
    isBlocked: {
        type: Boolean,
        default: false
    },

    // Raison du blocage de la conversation
    blockedReason: String,

    // Dernière activité
    lastActivityAt: {
        type: Date,
        default: Date.now
    },

    // Nombre de messages non lus par le client
    unreadByCustomer: {
        type: Number,
        default: 0
    },

    // Nombre de messages non lus par le vendeur
    unreadByVendor: {
        type: Number,
        default: 1 // La question initiale
    }

}, {
    timestamps: true
});

// Index composés pour les recherches
productQuestionSchema.index({ productId: 1, status: 1 });
productQuestionSchema.index({ vendorId: 1, status: 1 });
productQuestionSchema.index({ customerId: 1, status: 1 });
productQuestionSchema.index({ lastActivityAt: -1 });

// Mettre à jour lastActivityAt à chaque nouveau message
productQuestionSchema.pre('save', function (next) {
    if (this.isModified('messages')) {
        this.lastActivityAt = new Date();
    }
    next();
});

// Méthode pour ajouter un message
productQuestionSchema.methods.addMessage = async function (content, sender, blockedInfo = null) {
    const message = {
        content: blockedInfo ? '[Message bloqué pour contenu suspect]' : content,
        originalContent: blockedInfo ? content : undefined,
        sender,
        isBlocked: !!blockedInfo,
        blockReason: blockedInfo?.reason || null,
        blockDetails: blockedInfo?.details || [],
        createdAt: new Date()
    };

    this.messages.push(message);

    // Mettre à jour les compteurs non lus
    if (sender === 'customer') {
        this.unreadByVendor += 1;
        this.status = 'open';
    } else {
        this.unreadByCustomer += 1;
        this.status = 'answered';
    }

    await this.save();
    return message;
};

// Méthode pour marquer comme lu
productQuestionSchema.methods.markAsRead = async function (role) {
    if (role === 'customer') {
        this.unreadByCustomer = 0;
    } else if (role === 'vendor') {
        this.unreadByVendor = 0;
    }

    // Marquer les messages comme lus
    const senderToMark = role === 'customer' ? 'vendor' : 'customer';
    this.messages.forEach(msg => {
        if (msg.sender === senderToMark) {
            msg.isRead = true;
        }
    });

    await this.save();
};

// Virtuel pour obtenir le dernier message
productQuestionSchema.virtual('lastMessage').get(function () {
    if (this.messages.length === 0) return null;
    return this.messages[this.messages.length - 1];
});

// Retourne les données anonymisées pour le client
productQuestionSchema.methods.toClientView = function () {
    return {
        _id: this._id,
        productId: this.productId,
        subject: this.subject,
        status: this.status,
        messages: this.messages.map(m => ({
            content: m.isBlocked ? '[Ce message a été masqué]' : m.content,
            sender: m.sender,
            senderLabel: m.sender === 'customer' ? 'Vous' : 'Vendeur',
            isBlocked: m.isBlocked,
            createdAt: m.createdAt,
            isRead: m.isRead
        })),
        unreadCount: this.unreadByCustomer,
        lastActivityAt: this.lastActivityAt,
        createdAt: this.createdAt
    };
};

// Retourne les données anonymisées pour le vendeur
productQuestionSchema.methods.toVendorView = function () {
    return {
        _id: this._id,
        productId: this.productId,
        subject: this.subject,
        status: this.status,
        messages: this.messages.map(m => ({
            content: m.isBlocked ? '[Ce message a été masqué]' : m.content,
            sender: m.sender,
            senderLabel: m.sender === 'vendor' ? 'Vous' : 'Client',
            isBlocked: m.isBlocked,
            createdAt: m.createdAt,
            isRead: m.isRead
        })),
        unreadCount: this.unreadByVendor,
        lastActivityAt: this.lastActivityAt,
        createdAt: this.createdAt
    };
};

// Retourne les données complètes pour l'admin/modérateur
productQuestionSchema.methods.toAdminView = function () {
    return {
        _id: this._id,
        productId: this.productId,
        customerId: this.customerId,
        vendorId: this.vendorId,
        subject: this.subject,
        status: this.status,
        isBlocked: this.isBlocked,
        blockedReason: this.blockedReason,
        messages: this.messages.map(m => ({
            content: m.content,
            originalContent: m.originalContent,
            sender: m.sender,
            isBlocked: m.isBlocked,
            blockReason: m.blockReason,
            blockDetails: m.blockDetails,
            adminNotified: m.adminNotified,
            createdAt: m.createdAt
        })),
        lastActivityAt: this.lastActivityAt,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

module.exports = mongoose.model('ProductQuestion', productQuestionSchema);
