const mongoose = require('mongoose');

const newsletterSubscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'L\'email est requis'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },

    firstName: {
        type: String,
        trim: true
    },

    lastName: {
        type: String,
        trim: true
    },

    // Link to user if registered
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    // Subscription status
    isActive: {
        type: Boolean,
        default: true
    },

    // Subscription preferences
    preferences: {
        promotions: {
            type: Boolean,
            default: true
        },
        newProducts: {
            type: Boolean,
            default: true
        },
        flashSales: {
            type: Boolean,
            default: true
        },
        weeklyDigest: {
            type: Boolean,
            default: false
        }
    },

    // Subscription tracking
    subscribedAt: {
        type: Date,
        default: Date.now
    },

    confirmedAt: Date,

    unsubscribedAt: Date,

    // Source of subscription
    source: {
        type: String,
        enum: ['website', 'checkout', 'footer', 'popup', 'import', 'admin'],
        default: 'website'
    },

    // Email verification
    isVerified: {
        type: Boolean,
        default: false
    },

    verificationToken: String,

    // Unsubscribe token (for email links)
    unsubscribeToken: {
        type: String,
        index: true
    },

    // Stats
    emailsSent: {
        type: Number,
        default: 0
    },

    emailsOpened: {
        type: Number,
        default: 0
    },

    lastEmailSentAt: Date,
    lastEmailOpenedAt: Date,

    // Bounce and spam tracking
    bounceCount: {
        type: Number,
        default: 0
    },

    isBlacklisted: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
newsletterSubscriberSchema.index({ email: 1 });
newsletterSubscriberSchema.index({ isActive: 1 });
newsletterSubscriberSchema.index({ subscribedAt: -1 });

// Pre-save hook to generate unsubscribe token
newsletterSubscriberSchema.pre('save', function (next) {
    if (!this.unsubscribeToken) {
        this.unsubscribeToken = require('crypto').randomBytes(32).toString('hex');
    }
    next();
});

// Method to unsubscribe
newsletterSubscriberSchema.methods.unsubscribe = function () {
    this.isActive = false;
    this.unsubscribedAt = new Date();
    return this.save();
};

// Method to resubscribe
newsletterSubscriberSchema.methods.resubscribe = function () {
    this.isActive = true;
    this.unsubscribedAt = null;
    return this.save();
};

// Static method to get active subscribers
newsletterSubscriberSchema.statics.getActiveSubscribers = function (preferences = {}) {
    const query = { isActive: true, isBlacklisted: false };

    if (preferences.promotions !== undefined) {
        query['preferences.promotions'] = preferences.promotions;
    }
    if (preferences.flashSales !== undefined) {
        query['preferences.flashSales'] = preferences.flashSales;
    }

    return this.find(query);
};

module.exports = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);
