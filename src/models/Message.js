const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    // Sender (admin who sent the message)
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Target type for bulk messaging
    targetType: {
        type: String,
        enum: ['individual', 'role', 'all'],
        default: 'individual'
    },

    // For individual targeting
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // For role-based targeting
    targetRole: {
        type: String,
        enum: ['customer', 'vendor', 'moderator', 'all']
    },

    // Message content
    title: {
        type: String,
        required: [true, 'Le titre est requis'],
        trim: true,
        maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
    },

    content: {
        type: String,
        required: [true, 'Le contenu est requis'],
        maxlength: [2000, 'Le contenu ne peut pas dépasser 2000 caractères']
    },

    // Message type/category
    type: {
        type: String,
        enum: ['info', 'warning', 'success', 'promo', 'announcement'],
        default: 'info'
    },

    // Read status tracking - stores user IDs who have read the message
    readBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Expiry date (optional)
    expiresAt: {
        type: Date
    },

    // Is active
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient querying
messageSchema.index({ targetType: 1, targetRole: 1, createdAt: -1 });
messageSchema.index({ recipientId: 1, createdAt: -1 });
messageSchema.index({ 'readBy.userId': 1 });

// Method to check if user has read this message
messageSchema.methods.isReadByUser = function (userId) {
    return this.readBy.some(r => r.userId.toString() === userId.toString());
};

// Method to mark as read
messageSchema.methods.markAsRead = function (userId) {
    if (!this.isReadByUser(userId)) {
        this.readBy.push({ userId, readAt: new Date() });
    }
    return this.save();
};

// Static method to get messages for a user
messageSchema.statics.getMessagesForUser = async function (user, options = {}) {
    const { page = 1, limit = 20, unreadOnly = false } = options;

    const query = {
        isActive: true,
        $or: [
            // Individual messages for this user
            { targetType: 'individual', recipientId: user._id },
            // Role-based messages for user's role
            { targetType: 'role', targetRole: user.role },
            // Role-based messages for 'all' roles
            { targetType: 'role', targetRole: 'all' },
            // Messages for everyone
            { targetType: 'all' }
        ],
        // Check expiry
        $and: [
            {
                $or: [
                    { expiresAt: null },
                    { expiresAt: { $gt: new Date() } }
                ]
            }
        ]
    };

    // Filter unread if requested
    if (unreadOnly) {
        query['readBy.userId'] = { $ne: user._id };
    }

    const messages = await this.find(query)
        .populate('sender', 'firstName lastName role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const total = await this.countDocuments(query);

    // Add isRead field to each message
    const messagesWithReadStatus = messages.map(msg => ({
        ...msg.toObject(),
        isRead: msg.isReadByUser(user._id)
    }));

    return {
        messages: messagesWithReadStatus,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

// Get unread count for a user
messageSchema.statics.getUnreadCount = async function (user) {
    return this.countDocuments({
        isActive: true,
        'readBy.userId': { $ne: user._id },
        $or: [
            { targetType: 'individual', recipientId: user._id },
            { targetType: 'role', targetRole: user.role },
            { targetType: 'role', targetRole: 'all' },
            { targetType: 'all' }
        ],
        $and: [
            {
                $or: [
                    { expiresAt: null },
                    { expiresAt: { $gt: new Date() } }
                ]
            }
        ]
    });
};

module.exports = mongoose.model('Message', messageSchema);
