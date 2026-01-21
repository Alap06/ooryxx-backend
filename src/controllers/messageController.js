const Message = require('../models/Message');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse, notFoundResponse } = require('../utils/responseHandler');

// @desc    Send a message (admin only)
// @route   POST /api/messages
// @access  Private/Admin
exports.sendMessage = asyncHandler(async (req, res) => {
    const { targetType, recipientId, recipientEmail, targetRole, title, content, type, expiresAt } = req.body;

    // Validation
    if (!title || !content) {
        return errorResponse(res, 'Titre et contenu sont requis', 400);
    }

    if (!targetType) {
        return errorResponse(res, 'Type de ciblage requis', 400);
    }

    let messageData = {
        sender: req.user._id,
        targetType,
        title,
        content,
        type: type || 'info',
        expiresAt: expiresAt || null
    };

    // Handle different target types
    if (targetType === 'individual') {
        let recipient;

        if (recipientId) {
            recipient = await User.findById(recipientId);
        } else if (recipientEmail) {
            recipient = await User.findOne({ email: recipientEmail });
        }

        if (!recipient) {
            return errorResponse(res, 'Destinataire non trouvé', 404);
        }

        messageData.recipientId = recipient._id;
    } else if (targetType === 'role') {
        if (!targetRole) {
            return errorResponse(res, 'Rôle cible requis pour le ciblage par rôle', 400);
        }
        messageData.targetRole = targetRole;
    }
    // For 'all' type, no additional fields needed

    const message = await Message.create(messageData);

    // Get recipient count for response
    let recipientCount = 0;
    if (targetType === 'individual') {
        recipientCount = 1;
    } else if (targetType === 'role') {
        if (targetRole === 'all') {
            recipientCount = await User.countDocuments({ role: { $ne: 'admin' } });
        } else {
            recipientCount = await User.countDocuments({ role: targetRole });
        }
    } else if (targetType === 'all') {
        recipientCount = await User.countDocuments({ role: { $ne: 'admin' } });
    }

    successResponse(res, {
        message,
        recipientCount
    }, `Message envoyé à ${recipientCount} destinataire(s)`, 201);
});

// @desc    Get my messages
// @route   GET /api/messages/my
// @access  Private
exports.getMyMessages = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const result = await Message.getMessagesForUser(req.user, {
        page: parseInt(page),
        limit: parseInt(limit),
        unreadOnly: unreadOnly === 'true'
    });

    successResponse(res, result, 'Messages récupérés');
});

// @desc    Get unread count
// @route   GET /api/messages/unread-count
// @access  Private
exports.getUnreadCount = asyncHandler(async (req, res) => {
    const count = await Message.getUnreadCount(req.user);
    successResponse(res, { count }, 'Nombre de messages non lus');
});

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);

    if (!message) {
        return notFoundResponse(res, 'Message non trouvé');
    }

    await message.markAsRead(req.user._id);

    successResponse(res, { isRead: true }, 'Message marqué comme lu');
});

// @desc    Mark all messages as read
// @route   PUT /api/messages/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res) => {
    // Get all messages for this user that are unread
    const messages = await Message.find({
        isActive: true,
        'readBy.userId': { $ne: req.user._id },
        $or: [
            { targetType: 'individual', recipientId: req.user._id },
            { targetType: 'role', targetRole: req.user.role },
            { targetType: 'role', targetRole: 'all' },
            { targetType: 'all' }
        ]
    });

    // Mark each as read
    for (const message of messages) {
        await message.markAsRead(req.user._id);
    }

    successResponse(res, { markedCount: messages.length }, `${messages.length} messages marqués comme lus`);
});

// @desc    Get all messages (admin view)
// @route   GET /api/messages
// @access  Private/Admin
exports.getAllMessages = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, type } = req.query;

    const query = {};
    if (type) {
        query.targetType = type;
    }

    const messages = await Message.find(query)
        .populate('sender', 'firstName lastName')
        .populate('recipientId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));

    const total = await Message.countDocuments(query);

    successResponse(res, {
        messages,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    }, 'Messages récupérés');
});

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private/Admin
exports.deleteMessage = asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);

    if (!message) {
        return notFoundResponse(res, 'Message non trouvé');
    }

    await message.deleteOne();

    successResponse(res, null, 'Message supprimé');
});

// @desc    Search users for messaging
// @route   GET /api/messages/search-users
// @access  Private/Admin
exports.searchUsers = asyncHandler(async (req, res) => {
    const { q, role } = req.query;

    if (!q || q.length < 2) {
        return successResponse(res, { users: [] }, 'Recherche trop courte');
    }

    const query = {
        role: { $ne: 'admin' },
        $or: [
            { firstName: { $regex: q, $options: 'i' } },
            { lastName: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
        ]
    };

    if (role && role !== 'all') {
        query.role = role;
    }

    const users = await User.find(query)
        .select('firstName lastName email role profileImage')
        .limit(10);

    successResponse(res, { users }, 'Utilisateurs trouvés');
});
