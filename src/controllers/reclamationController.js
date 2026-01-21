const Reclamation = require('../models/Reclamation');
const User = require('../models/User');
const Order = require('../models/Order');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse, notFoundResponse } = require('../utils/responseHandler');

// @desc    Create a new reclamation
// @route   POST /api/reclamations
// @access  Private (or Public for anonymous)
exports.createReclamation = asyncHandler(async (req, res) => {
    const {
        isAnonymous,
        anonymousEmail,
        type,
        subject,
        description,
        orderId,
        productId,
        vendorId,
        priority,
        attachments
    } = req.body;

    // Validation
    if (!type || !subject || !description) {
        return errorResponse(res, 'Type, sujet et description sont requis', 400);
    }

    // Build reclamation data
    const reclamationData = {
        type,
        subject,
        description,
        isAnonymous: isAnonymous || false,
        priority: priority || 'medium',
        status: 'pending',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
    };

    // If not anonymous, add user reference
    if (!isAnonymous && req.user) {
        reclamationData.userId = req.user.id;
    } else if (isAnonymous && anonymousEmail) {
        reclamationData.anonymousEmail = anonymousEmail;
    }

    // Add optional references
    if (orderId) reclamationData.orderId = orderId;
    if (productId) reclamationData.productId = productId;
    if (vendorId) reclamationData.vendorId = vendorId;
    if (attachments) reclamationData.attachments = attachments;

    // Add initial status history
    reclamationData.statusHistory = [{
        status: 'pending',
        date: new Date(),
        note: 'Réclamation créée'
    }];

    const reclamation = await Reclamation.create(reclamationData);

    successResponse(res, reclamation, 'Réclamation soumise avec succès', 201);
});

// @desc    Get all reclamations (admin)
// @route   GET /api/reclamations
// @access  Private/Admin
exports.getReclamations = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, type, priority, search, sortBy, sortOrder } = req.query;

    // Build query
    const query = {};

    if (status && status !== 'all') {
        query.status = status;
    }
    if (type && type !== 'all') {
        query.type = type;
    }
    if (priority && priority !== 'all') {
        query.priority = priority;
    }
    if (search) {
        query.$or = [
            { subject: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    // Build sort
    const sort = {};
    sort[sortBy || 'createdAt'] = sortOrder === 'asc' ? 1 : -1;

    const reclamations = await Reclamation.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName email')
        .populate('orderId', 'orderNumber totalAmount status')
        .populate('productId', 'title images')
        .populate('vendorId', 'companyInfo.name')
        .populate('handledBy', 'firstName lastName');

    const total = await Reclamation.countDocuments(query);

    // Get statistics
    const stats = await Reclamation.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const statsFormatted = {
        pending: 0,
        in_progress: 0,
        resolved: 0,
        rejected: 0,
        closed: 0,
        total: 0
    };

    stats.forEach(s => {
        statsFormatted[s._id] = s.count;
        statsFormatted.total += s.count;
    });

    successResponse(res, {
        reclamations,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
            limit
        },
        stats: statsFormatted
    }, 'Réclamations récupérées avec succès');
});

// @desc    Get single reclamation
// @route   GET /api/reclamations/:id
// @access  Private/Admin
exports.getReclamation = asyncHandler(async (req, res) => {
    const reclamation = await Reclamation.findById(req.params.id)
        .populate('userId', 'firstName lastName email phoneNumber profileImage')
        .populate('orderId', 'orderNumber totalAmount status items createdAt')
        .populate('productId', 'title images price')
        .populate('vendorId', 'companyInfo.name companyInfo.email')
        .populate('handledBy', 'firstName lastName')
        .populate('statusHistory.updatedBy', 'firstName lastName');

    if (!reclamation) {
        return notFoundResponse(res, 'Réclamation non trouvée');
    }

    successResponse(res, reclamation, 'Réclamation récupérée');
});

// @desc    Update reclamation status
// @route   PUT /api/reclamations/:id/status
// @access  Private/Admin
exports.updateReclamationStatus = asyncHandler(async (req, res) => {
    const { status, response, adminNotes, priority } = req.body;
    const reclamation = await Reclamation.findById(req.params.id);

    if (!reclamation) {
        return notFoundResponse(res, 'Réclamation non trouvée');
    }

    // Update status
    if (status) {
        reclamation.addStatusChange(status, `Statut changé en ${status}`, req.user.id);
    }

    // Update response
    if (response) {
        reclamation.response = response;
        reclamation.respondedAt = new Date();
    }

    // Update admin notes
    if (adminNotes !== undefined) {
        reclamation.adminNotes = adminNotes;
    }

    // Update priority
    if (priority) {
        reclamation.priority = priority;
    }

    // Set handler
    reclamation.handledBy = req.user.id;

    await reclamation.save();

    const updatedReclamation = await Reclamation.findById(req.params.id)
        .populate('userId', 'firstName lastName email')
        .populate('handledBy', 'firstName lastName');

    successResponse(res, updatedReclamation, 'Réclamation mise à jour');
});

// @desc    Get user's own reclamations
// @route   GET /api/reclamations/my
// @access  Private
exports.getMyReclamations = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reclamations = await Reclamation.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('orderId', 'orderNumber')
        .populate('productId', 'title');

    const total = await Reclamation.countDocuments({ userId: req.user.id });

    successResponse(res, {
        reclamations,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
            limit
        }
    }, 'Mes réclamations récupérées');
});

// @desc    Delete reclamation (admin only)
// @route   DELETE /api/reclamations/:id
// @access  Private/Admin
exports.deleteReclamation = asyncHandler(async (req, res) => {
    const reclamation = await Reclamation.findById(req.params.id);

    if (!reclamation) {
        return notFoundResponse(res, 'Réclamation non trouvée');
    }

    await reclamation.deleteOne();

    successResponse(res, null, 'Réclamation supprimée');
});

// @desc    Update user's own reclamation
// @route   PUT /api/reclamations/my/:id
// @access  Private
exports.updateMyReclamation = asyncHandler(async (req, res) => {
    const { subject, description, priority } = req.body;
    const reclamation = await Reclamation.findById(req.params.id);

    if (!reclamation) {
        return notFoundResponse(res, 'Réclamation non trouvée');
    }

    // Check ownership
    if (!reclamation.userId || reclamation.userId.toString() !== req.user.id.toString()) {
        return errorResponse(res, 'Vous ne pouvez modifier que vos propres réclamations', 403);
    }

    // Only allow editing if status is pending
    if (reclamation.status !== 'pending') {
        return errorResponse(res, 'Vous ne pouvez modifier une réclamation que si elle est en attente', 400);
    }

    // Update allowed fields
    if (subject) reclamation.subject = subject;
    if (description) reclamation.description = description;
    if (priority) reclamation.priority = priority;

    await reclamation.save();

    successResponse(res, reclamation, 'Réclamation mise à jour');
});
