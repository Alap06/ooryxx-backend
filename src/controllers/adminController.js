const User = require('../models/User');
const ModeratorActivityLog = require('../models/ModeratorActivityLog');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Coupon = require('../models/Coupon');
const NewsletterSubscriber = require('../models/Newsletter');
const mongoose = require('mongoose');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse, notFoundResponse } = require('../utils/responseHandler');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboard = asyncHandler(async (req, res) => {
    // Get counts
    const totalUsers = await User.countDocuments();
    const totalVendors = await Vendor.countDocuments();
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalOrders = await Order.countDocuments();

    // Get pending vendors
    const pendingVendors = await Vendor.countDocuments({ status: 'pending' });

    // Get revenue
    const revenueAggregate = await Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueAggregate[0]?.total || 0;

    // Get today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });

    // Get recent activity
    const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('firstName lastName email createdAt');

    const recentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber totalAmount status createdAt');

    successResponse(res, {
        stats: {
            totalUsers,
            totalVendors,
            totalProducts,
            totalOrders,
            totalRevenue,
            pendingVendors,
            todayOrders
        },
        recentUsers,
        recentOrders
    }, 'Dashboard data retrieved successfully');
});

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const field = req.query.field || 'all'; // 'all', 'name', 'email'
    const status = req.query.status;

    // Build query
    const query = {};
    if (search) {
        if (field === 'email') {
            query.email = { $regex: search, $options: 'i' };
        } else if (field === 'name') {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ];
        } else {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
    }
    if (status) {
        query.status = status;
    }

    const users = await User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password');

    const total = await User.countDocuments(query);

    successResponse(res, {
        users,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
            limit
        }
    }, 'Users retrieved successfully');
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'pending'].includes(status)) {
        return errorResponse(res, 'Invalid status', 400);
    }

    const user = await User.findByIdAndUpdate(
        id,
        { status },
        { new: true }
    ).select('-password');

    if (!user) {
        return notFoundResponse(res, 'User not found');
    }

    successResponse(res, user, `User status updated to ${status}`);
});

// @desc    Toggle user VIP status
// @route   PUT /api/admin/users/:id/vip
// @access  Private/Admin
exports.toggleUserVIP = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
        return notFoundResponse(res, 'User not found');
    }

    user.isVIP = !user.isVIP;
    await user.save();

    successResponse(res, { isVIP: user.isVIP }, `VIP status ${user.isVIP ? 'enabled' : 'disabled'}`);
});

// @desc    Get all vendors with pagination
// @route   GET /api/admin/vendors
// @access  Private/Admin
exports.getVendors = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query = {};
    if (status) {
        query.status = status;
    }

    const vendors = await Vendor.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName email');

    const total = await Vendor.countDocuments(query);

    successResponse(res, {
        vendors,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
            limit
        }
    }, 'Vendors retrieved successfully');
});

// @desc    Approve vendor
// @route   PUT /api/admin/vendors/:id/approve
// @access  Private/Admin
exports.approveVendor = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find and update vendor status
    const vendor = await Vendor.findByIdAndUpdate(
        id,
        { status: 'approved', approvedAt: new Date() },
        { new: true }
    ).populate('userId', 'firstName lastName email role');

    if (!vendor) {
        return notFoundResponse(res, 'Vendor not found');
    }

    // Update user role from customer to vendor and send notification
    if (vendor.userId) {
        const userId = vendor.userId._id || vendor.userId;
        const previousRole = vendor.userId.role;

        // Update user role to vendor
        await User.findByIdAndUpdate(userId, { role: 'vendor' });

        // Create congratulatory notification for new vendor
        const Notification = require('../models/Notification');
        await Notification.create({
            userId: userId,
            type: 'vendor_approved',
            content: `🎉 Félicitations ! Votre demande vendeur a été approuvée. Bienvenue dans notre communauté de vendeurs OORYXX ! Vous pouvez maintenant accéder à votre tableau de bord vendeur et commencer à vendre vos produits.`,
            isRead: false
        });

        // If user was previously a customer, log the role change
        if (previousRole === 'customer' || previousRole === 'customer_vip') {
            console.log(`User ${userId} role changed from ${previousRole} to vendor`);
        }
    }

    successResponse(res, vendor, 'Vendeur approuvé avec succès - Notification envoyée');
});

// @desc    Reject/Suspend vendor
// @route   PUT /api/admin/vendors/:id/reject
// @access  Private/Admin
exports.rejectVendor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const vendor = await Vendor.findByIdAndUpdate(
        id,
        { status: 'rejected', rejectionReason: reason },
        { new: true }
    );

    if (!vendor) {
        return notFoundResponse(res, 'Vendor not found');
    }

    successResponse(res, vendor, 'Vendor rejected');
});

// @desc    Get platform analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getAnalytics = asyncHandler(async (req, res) => {
    const period = req.query.period || '30d';

    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
        case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
        case '90d':
            startDate.setDate(startDate.getDate() - 90);
            break;
        case '1y':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        default:
            startDate.setDate(startDate.getDate() - 30);
    }

    // Revenue by day
    const revenueByDay = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                paymentStatus: 'paid'
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                revenue: { $sum: '$totalAmount' },
                orders: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
        {
            $match: { createdAt: { $gte: startDate, $lte: endDate } }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    // Top vendors
    const topVendors = await Order.aggregate([
        {
            $match: { createdAt: { $gte: startDate, $lte: endDate } }
        },
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.vendorId',
                revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                orders: { $sum: 1 }
            }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: 'vendors',
                localField: '_id',
                foreignField: '_id',
                as: 'vendor'
            }
        }
    ]);

    // New registrations
    const newUsers = await User.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
    });

    const newVendors = await Vendor.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
    });

    successResponse(res, {
        period,
        revenueByDay,
        ordersByStatus,
        topVendors,
        newRegistrations: {
            users: newUsers,
            vendors: newVendors
        }
    }, 'Analytics data retrieved successfully');
});

// @desc    Get pending products for moderation
// @route   GET /api/admin/products/pending
// @access  Private/Admin
exports.getPendingProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .populate('vendorId', 'storeName')
        .limit(50);

    successResponse(res, products, 'Pending products retrieved');
});

// @desc    Approve product
// @route   PUT /api/admin/products/:id/approve
// @access  Private/Admin
exports.approveProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(
        id,
        { status: 'approved', isActive: true },
        { new: true }
    );

    if (!product) {
        return notFoundResponse(res, 'Product not found');
    }

    successResponse(res, product, 'Product approved');
});

// @desc    Reject product
// @route   PUT /api/admin/products/:id/reject
// @access  Private/Admin
exports.rejectProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const product = await Product.findByIdAndUpdate(
        id,
        { status: 'rejected', rejectionReason: reason, isActive: false },
        { new: true }
    );

    if (!product) {
        return notFoundResponse(res, 'Product not found');
    }

    successResponse(res, product, 'Product rejected');
});

// @desc    Get user details with order history
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');

    if (!user) {
        return notFoundResponse(res, 'Utilisateur non trouvé');
    }

    // Get user's orders with full details
    const orders = await Order.find({ userId: id })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('items.productId', 'title images');

    // Calculate statistics
    const stats = {
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
        ordersByStatus: {}
    };

    // Count orders by status
    orders.forEach(order => {
        stats.ordersByStatus[order.status] = (stats.ordersByStatus[order.status] || 0) + 1;
    });

    // Check if user is a vendor
    let vendorInfo = null;
    if (user.role === 'vendor') {
        vendorInfo = await Vendor.findOne({ userId: id })
            .select('companyInfo status stats commission');
    }

    successResponse(res, {
        user,
        orders,
        stats,
        vendorInfo
    }, 'Détails utilisateur récupérés');
});

// @desc    Get vendor with their products
// @route   GET /api/admin/vendors/:id/products
// @access  Private/Admin
exports.getVendorWithProducts = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const vendor = await Vendor.findById(id)
        .populate('userId', 'firstName lastName email phoneNumber profileImage');

    if (!vendor) {
        return notFoundResponse(res, 'Vendeur non trouvé');
    }

    // Get vendor's products with full details
    const products = await Product.find({ vendorId: id })
        .sort({ createdAt: -1 })
        .select('title images price stock status rating reviewCount isActive createdAt');

    // Calculate product statistics
    const productStats = {
        total: products.length,
        active: products.filter(p => p.isActive && p.status === 'approved').length,
        pending: products.filter(p => p.status === 'pending').length,
        rejected: products.filter(p => p.status === 'rejected').length,
        outOfStock: products.filter(p => p.stock === 0).length
    };

    // Get vendor's orders
    const orders = await Order.find({ vendorId: id })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('orderNumber totalAmount status createdAt')
        .populate('userId', 'firstName lastName');

    successResponse(res, {
        vendor,
        products,
        productStats,
        recentOrders: orders
    }, 'Détails vendeur récupérés');
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!['customer', 'customer_vip', 'vendor', 'admin'].includes(role)) {
        return errorResponse(res, 'Rôle invalide', 400);
    }

    const user = await User.findByIdAndUpdate(
        id,
        { role },
        { new: true }
    ).select('-password');

    if (!user) {
        return notFoundResponse(res, 'Utilisateur non trouvé');
    }

    successResponse(res, user, `Rôle mis à jour: ${role}`);
});

// @desc    Get all products with filters and pagination
// @route   GET /api/admin/products
// @access  Private/Admin
exports.getAllProducts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const barcode = req.query.barcode || '';
    const category = req.query.category;
    const status = req.query.status;
    const vendorId = req.query.vendorId;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    const query = {};

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { 'seo.slug': { $regex: search, $options: 'i' } }
        ];

        // Search by Product ID
        if (mongoose.Types.ObjectId.isValid(search)) {
            query.$or.push({ _id: search });
        }

        // Search by Vendor Name
        // Find vendors matching the name
        const matchingVendors = await Vendor.find({
            'companyInfo.name': { $regex: search, $options: 'i' }
        }).select('_id');

        if (matchingVendors.length > 0) {
            const vendorIds = matchingVendors.map(v => v._id);
            query.$or.push({ vendorId: { $in: vendorIds } });
        }
    }

    if (barcode) {
        query['attributes.barcode'] = { $regex: barcode, $options: 'i' };
    }

    if (category) {
        query.category = category;
    }

    if (status) {
        query.status = status;
    }

    if (vendorId) {
        query.vendorId = vendorId;
    }

    // Sort object
    const sort = {};
    sort[sortBy] = sortOrder;

    const products = await Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('vendorId', 'companyInfo.name userId') // Populate useful vendor info
        .populate('category', 'name');

    const total = await Product.countDocuments(query);

    // Get stats (cached or simplified)
    const stats = {
        total: await Product.countDocuments(),
        active: await Product.countDocuments({ status: 'active', isPublished: true }),
        pending: await Product.countDocuments({ status: 'draft' }),
        outOfStock: await Product.countDocuments({ stock: 0 })
    };

    successResponse(res, {
        products,
        stats,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
            limit
        }
    }, 'Products retrieved successfully');
});

// @desc    Create a new product (admin)
// @route   POST /api/admin/products
// @access  Private/Admin
exports.createProduct = asyncHandler(async (req, res) => {
    const {
        vendorId,
        title,
        description,
        price,
        stock,
        category,
        images,
        attributes,
        specifications,
        tags,
        status,
        discount,
        shipping
    } = req.body;

    // Validate required fields
    if (!vendorId || !title || !description || !price || !category) {
        return errorResponse(res, 'Champs obligatoires manquants: vendorId, title, description, price, category', 400);
    }

    // Check vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
        return notFoundResponse(res, 'Vendeur non trouvé');
    }

    const product = new Product({
        vendorId,
        title,
        description,
        price,
        stock: stock || 0,
        category,
        images: images || [],
        attributes: attributes || {},
        specifications: specifications || [],
        tags: tags || [],
        status: status || 'draft',
        discount: discount || { percentage: 0 },
        shipping: shipping || {}
    });

    await product.save();

    // Update vendor product count
    await Vendor.findByIdAndUpdate(vendorId, {
        $inc: { 'stats.totalProducts': 1 }
    });

    successResponse(res, product, 'Produit créé avec succès', 201);
});

// @desc    Update a product (admin)
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
exports.updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.totalSales;
    delete updateData.views;

    const product = await Product.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
    ).populate('vendorId', 'storeName').populate('category', 'name');

    if (!product) {
        return notFoundResponse(res, 'Produit non trouvé');
    }

    successResponse(res, product, 'Produit mis à jour avec succès');
});

// @desc    Delete a product (admin)
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
exports.deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
        return notFoundResponse(res, 'Produit non trouvé');
    }

    const vendorId = product.vendorId;

    // Check for active orders with this product
    const activeOrders = await Order.countDocuments({
        'items.productId': id,
        status: { $in: ['pending', 'processing', 'shipped'] }
    });

    if (activeOrders > 0) {
        return errorResponse(res, `Impossible de supprimer: ${activeOrders} commande(s) active(s) contiennent ce produit`, 409);
    }

    await Product.findByIdAndDelete(id);

    // Update vendor product count
    if (vendorId) {
        await Vendor.findByIdAndUpdate(vendorId, {
            $inc: { 'stats.totalProducts': -1 }
        });
    }

    successResponse(res, null, 'Produit supprimé avec succès');
});

// @desc    Get all orders with filters and pagination
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getAllOrders = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filters
    const search = req.query.search || '';
    const status = req.query.status;
    const paymentStatus = req.query.paymentStatus;
    const vendorId = req.query.vendorId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    const query = {};

    if (search) {
        query.$or = [
            { orderNumber: { $regex: search, $options: 'i' } },
            { clientCode: { $regex: search, $options: 'i' } },
            { deliveryCode: { $regex: search, $options: 'i' } },
            { 'shippingAddress.recipientName': { $regex: search, $options: 'i' } }
        ];

        // Search by Order ID
        if (mongoose.Types.ObjectId.isValid(search)) {
            query.$or.push({ _id: search });
        }
    }

    if (status) {
        query.status = status;
    }

    if (paymentStatus) {
        query.paymentStatus = paymentStatus;
    }

    if (vendorId) {
        query.vendorId = vendorId;
    }

    // Date Range Filter
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
            query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt.$lte = end;
        }
    }

    // Sort object
    const sort = {};
    sort[sortBy] = sortOrder;

    const orders = await Order.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName email phoneNumber addresses')
        .populate('vendorId', 'companyInfo storeName')
        .populate('items.productId', 'title images');

    const total = await Order.countDocuments(query);

    // Get order stats
    const stats = {
        total: await Order.countDocuments(),
        pending: await Order.countDocuments({ status: 'pending' }),
        processing: await Order.countDocuments({ status: 'processing' }),
        delivered: await Order.countDocuments({ status: 'delivered' }),
        cancelled: await Order.countDocuments({ status: 'cancelled' })
    };

    successResponse(res, {
        orders,
        stats,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
            limit
        }
    }, 'Orders retrieved successfully');
});

// ============== MODERATOR MANAGEMENT ==============

// @desc    Get all moderators
// @route   GET /api/admin/moderators
// @access  Private/Admin
exports.getModerators = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search, status } = req.query;

    const query = { role: 'moderator' };

    if (search) {
        query.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    if (status === 'blocked') {
        query.isBlocked = true;
    } else if (status === 'active') {
        query.isBlocked = false;
    }

    const moderators = await User.find(query)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await User.countDocuments(query);

    // Get activity counts for each moderator
    const moderatorsWithActivity = await Promise.all(moderators.map(async (mod) => {
        const activityCount = await ModeratorActivityLog.countDocuments({ moderatorId: mod._id });
        const lastActivity = await ModeratorActivityLog.findOne({ moderatorId: mod._id }).sort({ createdAt: -1 });
        return {
            ...mod.toObject(),
            activityCount,
            lastActivityAt: lastActivity?.createdAt || null
        };
    }));

    successResponse(res, {
        moderators: moderatorsWithActivity,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
            limit
        }
    }, 'Moderators retrieved successfully');
});

// @desc    Create a new moderator (from existing user or new)
// @route   POST /api/admin/moderators
// @access  Private/Admin
exports.createModerator = asyncHandler(async (req, res) => {
    const { userId, email, firstName, lastName, password } = req.body;

    let user;

    if (userId) {
        // Promote existing user to moderator
        user = await User.findById(userId);
        if (!user) {
            return notFoundResponse(res, 'Utilisateur non trouvé');
        }
        if (user.role === 'admin') {
            return errorResponse(res, 'Impossible de modifier un administrateur', 400);
        }
        user.role = 'moderator';
        await user.save();
    } else {
        // Create new user as moderator
        if (!email || !firstName || !lastName || !password) {
            return errorResponse(res, 'Email, prénom, nom et mot de passe sont requis pour créer un nouveau modérateur', 400);
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return errorResponse(res, 'Un utilisateur avec cet email existe déjà', 409);
        }

        user = await User.create({
            email,
            firstName,
            lastName,
            password,
            role: 'moderator',
            isEmailVerified: true
        });
    }

    // Log activity
    await ModeratorActivityLog.logActivity({
        moderatorId: req.user.id,
        action: 'other',
        targetType: 'user',
        targetId: user._id,
        targetModel: 'User',
        description: `Modérateur créé: ${user.firstName} ${user.lastName}`,
        ipAddress: req.ip
    });

    const moderator = await User.findById(user._id).select('-password -refreshToken');
    successResponse(res, moderator, 'Modérateur créé avec succès', 201);
});

// @desc    Update moderator
// @route   PUT /api/admin/moderators/:id
// @access  Private/Admin
exports.updateModerator = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, email, phoneNumber, isActive } = req.body;

    const moderator = await User.findOne({ _id: id, role: 'moderator' });

    if (!moderator) {
        return notFoundResponse(res, 'Modérateur non trouvé');
    }

    if (firstName) moderator.firstName = firstName;
    if (lastName) moderator.lastName = lastName;
    if (email) moderator.email = email;
    if (phoneNumber !== undefined) moderator.phoneNumber = phoneNumber;
    if (isActive !== undefined) moderator.isActive = isActive;

    await moderator.save();

    const updated = await User.findById(id).select('-password -refreshToken');
    successResponse(res, updated, 'Modérateur mis à jour');
});

// @desc    Toggle block status of moderator
// @route   PUT /api/admin/moderators/:id/block
// @access  Private/Admin
exports.toggleModeratorBlock = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const moderator = await User.findOne({ _id: id, role: 'moderator' });

    if (!moderator) {
        return notFoundResponse(res, 'Modérateur non trouvé');
    }

    moderator.isBlocked = !moderator.isBlocked;
    await moderator.save();

    // Log activity
    await ModeratorActivityLog.logActivity({
        moderatorId: req.user.id,
        action: moderator.isBlocked ? 'block_user' : 'unblock_user',
        targetType: 'user',
        targetId: moderator._id,
        targetModel: 'User',
        description: moderator.isBlocked ? 'Modérateur bloqué' : 'Modérateur débloqué',
        ipAddress: req.ip
    });

    successResponse(res, { isBlocked: moderator.isBlocked }, `Modérateur ${moderator.isBlocked ? 'bloqué' : 'débloqué'}`);
});

// @desc    Revoke moderator role (demote to customer)
// @route   DELETE /api/admin/moderators/:id
// @access  Private/Admin
exports.revokeModerator = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const moderator = await User.findOne({ _id: id, role: 'moderator' });

    if (!moderator) {
        return notFoundResponse(res, 'Modérateur non trouvé');
    }

    moderator.role = 'customer';
    await moderator.save();

    // Log activity
    await ModeratorActivityLog.logActivity({
        moderatorId: req.user.id,
        action: 'other',
        targetType: 'user',
        targetId: moderator._id,
        targetModel: 'User',
        description: `Rôle modérateur révoqué pour ${moderator.firstName} ${moderator.lastName}`,
        ipAddress: req.ip
    });

    successResponse(res, null, 'Rôle modérateur révoqué');
});

// @desc    Get moderator activity log
// @route   GET /api/admin/moderators/:id/activity
// @access  Private/Admin
exports.getModeratorActivity = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const moderator = await User.findOne({ _id: id, role: 'moderator' });
    if (!moderator) {
        return notFoundResponse(res, 'Modérateur non trouvé');
    }

    const activities = await ModeratorActivityLog.find({ moderatorId: id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('targetId', 'firstName lastName email title orderNumber subject');

    const total = await ModeratorActivityLog.countDocuments({ moderatorId: id });

    successResponse(res, {
        moderator: {
            _id: moderator._id,
            firstName: moderator.firstName,
            lastName: moderator.lastName,
            email: moderator.email
        },
        activities,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
            limit
        }
    }, 'Activités récupérées');
});

// @desc    Get all moderator activities (global view)
// @route   GET /api/admin/moderators/activities
// @access  Private/Admin
exports.getAllModeratorActivities = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const { moderatorId, action, startDate, endDate } = req.query;

    const query = {};

    if (moderatorId) query.moderatorId = moderatorId;
    if (action) query.action = action;

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt.$lte = end;
        }
    }

    const activities = await ModeratorActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('moderatorId', 'firstName lastName email');

    const total = await ModeratorActivityLog.countDocuments(query);

    successResponse(res, {
        activities,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
            limit
        }
    }, 'Toutes les activités récupérées');
});

// ============== CATEGORY MANAGEMENT ==============

// @desc    Get all categories with hierarchy
// @route   GET /api/admin/categories
// @access  Private/Admin
exports.getAllCategories = asyncHandler(async (req, res) => {
    const { search, isActive, parentId } = req.query;

    const query = {};

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { slug: { $regex: search, $options: 'i' } }
        ];
    }

    if (isActive !== undefined) {
        query.isActive = isActive === 'true';
    }

    if (parentId === 'null') {
        query.parentId = null;
    } else if (parentId) {
        query.parentId = parentId;
    }

    const categories = await Category.find(query)
        .sort({ displayOrder: 1, name: 1 })
        .populate('parentId', 'name slug');

    // Build hierarchy tree
    const buildTree = (parentId = null) => {
        return categories
            .filter(cat => {
                const catParentId = cat.parentId?._id?.toString() || cat.parentId?.toString() || null;
                return catParentId === (parentId ? parentId.toString() : null);
            })
            .map(cat => ({
                ...cat.toObject(),
                children: buildTree(cat._id)
            }));
    };

    const tree = buildTree();

    // Get stats
    const stats = {
        total: await Category.countDocuments(),
        active: await Category.countDocuments({ isActive: true }),
        inactive: await Category.countDocuments({ isActive: false }),
        rootCategories: await Category.countDocuments({ parentId: null })
    };

    successResponse(res, {
        categories,
        tree,
        stats
    }, 'Catégories récupérées avec succès');
});

// @desc    Get category by ID
// @route   GET /api/admin/categories/:id
// @access  Private/Admin
exports.getCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await Category.findById(id)
        .populate('parentId', 'name slug');

    if (!category) {
        return notFoundResponse(res, 'Catégorie non trouvée');
    }

    // Get subcategories
    const subcategories = await Category.find({ parentId: id })
        .sort({ displayOrder: 1, name: 1 })
        .select('name slug isActive displayOrder');

    // Get products count in this category
    const productsCount = await Product.countDocuments({ category: id });

    successResponse(res, {
        category,
        subcategories,
        productsCount
    }, 'Catégorie récupérée');
});

// @desc    Create a new category
// @route   POST /api/admin/categories
// @access  Private/Admin
exports.createCategory = asyncHandler(async (req, res) => {
    const { name, description, parentId, attributes, image, icon, isActive, displayOrder } = req.body;

    // Validate required fields
    if (!name) {
        return errorResponse(res, 'Le nom de la catégorie est requis', 400);
    }

    // Check for duplicate name at the same level
    const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        parentId: parentId || null
    });

    if (existingCategory) {
        return errorResponse(res, 'Une catégorie avec ce nom existe déjà à ce niveau', 400);
    }

    // Validate parentId if provided
    if (parentId) {
        const parentCategory = await Category.findById(parentId);
        if (!parentCategory) {
            return notFoundResponse(res, 'Catégorie parente non trouvée');
        }
    }

    const category = new Category({
        name,
        description: description || '',
        parentId: parentId || null,
        attributes: attributes || [],
        image: image || '',
        icon: icon || '',
        isActive: isActive !== undefined ? isActive : true,
        displayOrder: displayOrder || 0
    });

    await category.save();

    successResponse(res, category, 'Catégorie créée avec succès', 201);
});

// @desc    Update a category
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, parentId, attributes, image, icon, isActive, displayOrder } = req.body;

    const category = await Category.findById(id);

    if (!category) {
        return notFoundResponse(res, 'Catégorie non trouvée');
    }

    // Check for duplicate name at the same level (excluding current category)
    if (name && name !== category.name) {
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            parentId: parentId !== undefined ? parentId : category.parentId,
            _id: { $ne: id }
        });

        if (existingCategory) {
            return errorResponse(res, 'Une catégorie avec ce nom existe déjà à ce niveau', 400);
        }
    }

    // Prevent setting self as parent
    if (parentId === id) {
        return errorResponse(res, 'Une catégorie ne peut pas être son propre parent', 400);
    }

    // Prevent circular reference
    if (parentId) {
        let currentParent = await Category.findById(parentId);
        while (currentParent) {
            if (currentParent._id.toString() === id) {
                return errorResponse(res, 'Référence circulaire détectée', 400);
            }
            currentParent = currentParent.parentId ? await Category.findById(currentParent.parentId) : null;
        }
    }

    // Update fields
    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (parentId !== undefined) category.parentId = parentId || null;
    if (attributes !== undefined) category.attributes = attributes;
    if (image !== undefined) category.image = image;
    if (icon !== undefined) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;

    // Regenerate slug if name changed
    if (name && name !== category.name) {
        category.slug = null; // Will be regenerated by pre-save hook
    }

    await category.save();

    const updatedCategory = await Category.findById(id).populate('parentId', 'name slug');

    successResponse(res, updatedCategory, 'Catégorie mise à jour avec succès');
});

// @desc    Delete a category
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
exports.deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reassignTo, deleteChildren } = req.query;

    const category = await Category.findById(id);

    if (!category) {
        return notFoundResponse(res, 'Catégorie non trouvée');
    }

    // Check for subcategories
    const subcategories = await Category.find({ parentId: id });

    if (subcategories.length > 0 && !deleteChildren && !reassignTo) {
        return errorResponse(res, `Cette catégorie contient ${subcategories.length} sous-catégorie(s). Veuillez les réassigner ou les supprimer d'abord.`, 400);
    }

    // Check for products in this category
    const productsCount = await Product.countDocuments({ category: id });

    if (productsCount > 0 && !reassignTo) {
        return errorResponse(res, `${productsCount} produit(s) sont assignés à cette catégorie. Veuillez les réassigner d'abord.`, 400);
    }

    // Handle subcategories
    if (subcategories.length > 0) {
        if (deleteChildren === 'true') {
            // Delete all children recursively
            const deleteRecursive = async (parentId) => {
                const children = await Category.find({ parentId });
                for (const child of children) {
                    await deleteRecursive(child._id);
                    await Category.findByIdAndDelete(child._id);
                }
            };
            await deleteRecursive(id);
        } else if (reassignTo) {
            // Reassign children to new parent
            await Category.updateMany({ parentId: id }, { parentId: reassignTo });
        }
    }

    // Reassign products if needed
    if (productsCount > 0 && reassignTo) {
        await Product.updateMany({ category: id }, { category: reassignTo });
    }

    await Category.findByIdAndDelete(id);

    successResponse(res, null, 'Catégorie supprimée avec succès');
});

// ============== COUPON MANAGEMENT ==============

// @desc    Get all coupons
// @route   GET /api/admin/coupons
// @access  Private/Admin
exports.getAllCoupons = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const promoType = req.query.promoType;
    const status = req.query.status;

    // Build query
    const query = {};
    if (search) {
        query.$or = [
            { code: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }
    if (promoType) {
        query.promoType = promoType;
    }
    if (status === 'active') {
        query.isActive = true;
    } else if (status === 'inactive') {
        query.isActive = false;
    }

    const coupons = await Coupon.find(query)
        .populate('vendorId', 'storeName')
        .populate('conditions.applicableCategories', 'name')
        .populate('conditions.applicableProducts', 'title')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Coupon.countDocuments(query);

    // Get stats
    const stats = {
        total: await Coupon.countDocuments(),
        active: await Coupon.countDocuments({ isActive: true }),
        expired: await Coupon.countDocuments({ validTo: { $lt: new Date() } }),
        flashSales: await Coupon.countDocuments({ promoType: 'flash_sale' })
    };

    successResponse(res, {
        coupons,
        stats,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
            limit
        }
    }, 'Coupons récupérés avec succès');
});

// @desc    Get coupon stats
// @route   GET /api/admin/coupons/stats
// @access  Private/Admin
exports.getCouponStats = asyncHandler(async (req, res) => {
    const totalCoupons = await Coupon.countDocuments();
    const activeCoupons = await Coupon.countDocuments({ isActive: true });
    const expiredCoupons = await Coupon.countDocuments({ validTo: { $lt: new Date() } });
    const flashSales = await Coupon.countDocuments({ promoType: 'flash_sale', isActive: true });

    // Get total usage
    const usageAggregate = await Coupon.aggregate([
        { $group: { _id: null, totalUsage: { $sum: '$usageCount' } } }
    ]);
    const totalUsage = usageAggregate[0]?.totalUsage || 0;

    // Get discount by type
    const byType = await Coupon.aggregate([
        { $group: { _id: '$promoType', count: { $sum: 1 } } }
    ]);

    successResponse(res, {
        totalCoupons,
        activeCoupons,
        expiredCoupons,
        flashSales,
        totalUsage,
        byType
    }, 'Statistiques des coupons');
});

// @desc    Get coupon by ID
// @route   GET /api/admin/coupons/:id
// @access  Private/Admin
exports.getCouponById = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id)
        .populate('vendorId', 'storeName companyInfo')
        .populate('conditions.applicableCategories', 'name')
        .populate('conditions.applicableProducts', 'title price')
        .populate('createdBy', 'firstName lastName email')
        .populate('usedBy.userId', 'firstName lastName email')
        .populate('usedBy.orderId', 'orderNumber totalAmount');

    if (!coupon) {
        return notFoundResponse(res, 'Coupon non trouvé');
    }

    successResponse(res, { coupon }, 'Coupon récupéré avec succès');
});

// @desc    Create coupon
// @route   POST /api/admin/coupons
// @access  Private/Admin
exports.createCoupon = asyncHandler(async (req, res) => {
    const {
        code,
        description,
        vendorId,
        promoType,
        discountType,
        discountValue,
        flashSale,
        loyalty,
        conditions,
        usageLimit,
        validFrom,
        validTo,
        isActive
    } = req.body;

    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
        return errorResponse(res, 'Ce code de coupon existe déjà', 400);
    }

    // Validate discount value
    if (discountType === 'percentage' && discountValue > 100) {
        return errorResponse(res, 'Le pourcentage de réduction ne peut pas dépasser 100%', 400);
    }

    const coupon = await Coupon.create({
        code,
        description,
        vendorId: vendorId || null,
        promoType: promoType || 'standard',
        discountType,
        discountValue,
        flashSale,
        loyalty,
        conditions,
        usageLimit,
        validFrom,
        validTo,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user._id
    });

    successResponse(res, { coupon }, 'Coupon créé avec succès', 201);
});

// @desc    Update coupon
// @route   PUT /api/admin/coupons/:id
// @access  Private/Admin
exports.updateCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
        return notFoundResponse(res, 'Coupon non trouvé');
    }

    // Check for duplicate code if code is being changed
    if (req.body.code && req.body.code.toUpperCase() !== coupon.code) {
        const existingCoupon = await Coupon.findOne({ code: req.body.code.toUpperCase() });
        if (existingCoupon) {
            return errorResponse(res, 'Ce code de coupon existe déjà', 400);
        }
    }

    // Validate discount value
    if (req.body.discountType === 'percentage' && req.body.discountValue > 100) {
        return errorResponse(res, 'Le pourcentage de réduction ne peut pas dépasser 100%', 400);
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    ).populate('vendorId', 'storeName')
        .populate('conditions.applicableCategories', 'name')
        .populate('conditions.applicableProducts', 'title');

    successResponse(res, { coupon: updatedCoupon }, 'Coupon mis à jour avec succès');
});

// @desc    Delete coupon
// @route   DELETE /api/admin/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
        return notFoundResponse(res, 'Coupon non trouvé');
    }

    // Check if coupon has been used
    if (coupon.usageCount > 0) {
        // Soft delete - just deactivate
        coupon.isActive = false;
        await coupon.save();
        return successResponse(res, null, 'Coupon désactivé (utilisé précédemment)');
    }

    await Coupon.findByIdAndDelete(req.params.id);
    successResponse(res, null, 'Coupon supprimé avec succès');
});

// @desc    Toggle coupon status
// @route   PUT /api/admin/coupons/:id/toggle
// @access  Private/Admin
exports.toggleCouponStatus = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
        return notFoundResponse(res, 'Coupon non trouvé');
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    successResponse(res, { coupon }, `Coupon ${coupon.isActive ? 'activé' : 'désactivé'} avec succès`);
});

// ============== NEWSLETTER MANAGEMENT ==============

// @desc    Get newsletter subscribers
// @route   GET /api/admin/newsletter/subscribers
// @access  Private/Admin
exports.getNewsletterSubscribers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status;

    // Build query
    const query = {};
    if (search) {
        query.$or = [
            { email: { $regex: search, $options: 'i' } },
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } }
        ];
    }
    if (status === 'active') {
        query.isActive = true;
    } else if (status === 'inactive') {
        query.isActive = false;
    }

    const subscribers = await NewsletterSubscriber.find(query)
        .populate('userId', 'firstName lastName email')
        .sort({ subscribedAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await NewsletterSubscriber.countDocuments(query);

    successResponse(res, {
        subscribers,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
            limit
        }
    }, 'Abonnés récupérés avec succès');
});

// @desc    Get newsletter stats
// @route   GET /api/admin/newsletter/stats
// @access  Private/Admin
exports.getNewsletterStats = asyncHandler(async (req, res) => {
    const totalSubscribers = await NewsletterSubscriber.countDocuments();
    const activeSubscribers = await NewsletterSubscriber.countDocuments({ isActive: true });
    const verifiedSubscribers = await NewsletterSubscriber.countDocuments({ isVerified: true });

    // Get subscribers by source
    const bySource = await NewsletterSubscriber.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);

    // Get recent subscriptions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSubscriptions = await NewsletterSubscriber.countDocuments({
        subscribedAt: { $gte: thirtyDaysAgo }
    });

    // Get unsubscriptions (last 30 days)
    const recentUnsubscriptions = await NewsletterSubscriber.countDocuments({
        unsubscribedAt: { $gte: thirtyDaysAgo }
    });

    successResponse(res, {
        totalSubscribers,
        activeSubscribers,
        verifiedSubscribers,
        recentSubscriptions,
        recentUnsubscriptions,
        bySource
    }, 'Statistiques newsletter');
});

// @desc    Add newsletter subscriber
// @route   POST /api/admin/newsletter/subscribers
// @access  Private/Admin
exports.addNewsletterSubscriber = asyncHandler(async (req, res) => {
    const { email, firstName, lastName, preferences } = req.body;

    // Check if already subscribed
    const existing = await NewsletterSubscriber.findOne({ email: email.toLowerCase() });
    if (existing) {
        if (!existing.isActive) {
            // Resubscribe
            existing.isActive = true;
            existing.unsubscribedAt = null;
            existing.source = 'admin';
            await existing.save();
            return successResponse(res, { subscriber: existing }, 'Abonné réactivé avec succès');
        }
        return errorResponse(res, 'Cet email est déjà abonné', 400);
    }

    const subscriber = await NewsletterSubscriber.create({
        email,
        firstName,
        lastName,
        preferences,
        source: 'admin',
        isVerified: true // Admin-added subscribers are verified
    });

    successResponse(res, { subscriber }, 'Abonné ajouté avec succès', 201);
});

// @desc    Remove newsletter subscriber
// @route   DELETE /api/admin/newsletter/subscribers/:id
// @access  Private/Admin
exports.removeNewsletterSubscriber = asyncHandler(async (req, res) => {
    const subscriber = await NewsletterSubscriber.findById(req.params.id);

    if (!subscriber) {
        return notFoundResponse(res, 'Abonné non trouvé');
    }

    // Soft delete
    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    successResponse(res, null, 'Abonné supprimé avec succès');
});

// @desc    Send newsletter (placeholder - needs email service)
// @route   POST /api/admin/newsletter/send
// @access  Private/Admin
exports.sendNewsletter = asyncHandler(async (req, res) => {
    const { subject, content, targetPreference } = req.body;

    if (!subject || !content) {
        return errorResponse(res, 'Le sujet et le contenu sont requis', 400);
    }

    // Get target subscribers
    const query = { isActive: true };
    if (targetPreference) {
        query[`preferences.${targetPreference}`] = true;
    }

    const subscribers = await NewsletterSubscriber.find(query).select('email firstName');
    const subscriberCount = subscribers.length;

    // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
    // For now, just return the count of potential recipients

    // Log the newsletter send attempt
    console.log(`Newsletter send requested: "${subject}" to ${subscriberCount} subscribers`);

    successResponse(res, {
        recipientCount: subscriberCount,
        subject,
        message: 'Newsletter programmée (intégration email à configurer)'
    }, `Newsletter sera envoyée à ${subscriberCount} abonné(s)`);
});

// ============== USER CRUD MANAGEMENT ==============

// @desc    Create a new user
// @route   POST /api/admin/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, password, role, isVip, status, birthdate, gender } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
        return errorResponse(res, 'Prénom, nom, email et mot de passe sont requis', 400);
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        return errorResponse(res, 'Cet email est déjà utilisé', 400);
    }

    // Create user
    const user = await User.create({
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone: phone || '',
        password,
        role: role || 'customer',
        isVip: isVip || false,
        status: status || 'active',
        birthdate: birthdate || null,
        gender: gender || null,
        isEmailVerified: true // Admin-created users are considered verified
    });

    successResponse(res, {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVip: user.isVip,
        status: user.status,
        birthdate: user.birthdate,
        gender: user.gender
    }, 'Utilisateur créé avec succès', 201);
});


// @desc    Update user details
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, phone, role, isVip, status } = req.body;

    const user = await User.findById(id);
    if (!user) {
        return notFoundResponse(res, 'Utilisateur non trouvé');
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (isVip !== undefined) user.isVip = isVip;
    if (status) user.status = status;

    await user.save();

    successResponse(res, {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVip: user.isVip,
        status: user.status
    }, 'Utilisateur mis à jour avec succès');
});

// @desc    Update user password (admin override)
// @route   PUT /api/admin/users/:id/password
// @access  Private/Admin
exports.updateUserPassword = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
        return errorResponse(res, 'Le nouveau mot de passe doit contenir au moins 6 caractères', 400);
    }

    const user = await User.findById(id);
    if (!user) {
        return notFoundResponse(res, 'Utilisateur non trouvé');
    }

    // Set new password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    successResponse(res, null, 'Mot de passe mis à jour avec succès');
});

// @desc    Update user email
// @route   PUT /api/admin/users/:id/email
// @access  Private/Admin
exports.updateUserEmail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newEmail } = req.body;

    if (!newEmail) {
        return errorResponse(res, 'Le nouvel email est requis', 400);
    }

    // Check if email already exists
    const existingUser = await User.findOne({
        email: newEmail.toLowerCase(),
        _id: { $ne: id }
    });
    if (existingUser) {
        return errorResponse(res, 'Cet email est déjà utilisé par un autre compte', 400);
    }

    const user = await User.findById(id);
    if (!user) {
        return notFoundResponse(res, 'Utilisateur non trouvé');
    }

    const oldEmail = user.email;
    user.email = newEmail.toLowerCase();
    user.isEmailVerified = false; // Require re-verification
    await user.save();

    successResponse(res, {
        oldEmail,
        newEmail: user.email
    }, 'Email mis à jour avec succès');
});

// @desc    Delete user (soft delete)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
        return notFoundResponse(res, 'Utilisateur non trouvé');
    }

    // Soft delete - set status to deleted
    user.status = 'deleted';
    user.deletedAt = new Date();
    await user.save();

    successResponse(res, null, 'Utilisateur supprimé avec succès');
});

// ============== LIVREUR MANAGEMENT ==============

const Livreur = require('../models/Livreur');
const Notification = require('../models/Notification');

// @desc    Get all livreurs with pagination
// @route   GET /api/admin/livreurs
// @access  Private/Admin
exports.getLivreurs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const zone = req.query.zone;
    const search = req.query.search;

    const query = {};

    if (status) {
        query.status = status;
    }

    if (zone) {
        query.$or = [
            { zone: { $regex: zone, $options: 'i' } },
            { additionalZones: { $elemMatch: { $regex: zone, $options: 'i' } } }
        ];
    }

    const livreurs = await Livreur.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName email phoneNumber profileImage createdAt');

    const total = await Livreur.countDocuments(query);

    // Get stats
    const stats = {
        total: await Livreur.countDocuments(),
        pending: await Livreur.countDocuments({ status: 'pending' }),
        approved: await Livreur.countDocuments({ status: 'approved' }),
        suspended: await Livreur.countDocuments({ status: 'suspended' }),
        available: await Livreur.countDocuments({ status: 'approved', isAvailable: true })
    };

    // Filter by search if provided (search on user data)
    let filteredLivreurs = livreurs;
    if (search) {
        const searchLower = search.toLowerCase();
        filteredLivreurs = livreurs.filter(l =>
            l.userId?.firstName?.toLowerCase().includes(searchLower) ||
            l.userId?.lastName?.toLowerCase().includes(searchLower) ||
            l.userId?.email?.toLowerCase().includes(searchLower) ||
            l.zone?.toLowerCase().includes(searchLower)
        );
    }

    // Format response
    const formattedLivreurs = filteredLivreurs.map(l => ({
        _id: l._id,
        userId: l.userId?._id,
        name: l.userId ? `${l.userId.firstName} ${l.userId.lastName}` : 'N/A',
        matricule: l.matricule,
        email: l.userId?.email,
        phone: l.userId?.phoneNumber,
        profileImage: l.userId?.profileImage,
        type: l.type,
        parentCompany: l.parentCompany,
        vehicleType: l.vehicleType,
        licensePlate: l.licensePlate,
        zone: l.zone,
        additionalZones: l.additionalZones,
        isAvailable: l.isAvailable,
        status: l.status,
        currentOrdersCount: l.currentOrders?.length || 0,
        maxOrdersAtOnce: l.maxOrdersAtOnce,
        stats: {
            totalDeliveries: l.stats?.totalDeliveries || 0,
            successfulDeliveries: l.stats?.successfulDeliveries || 0,
            failedDeliveries: l.stats?.failedDeliveries || 0,
            rating: l.stats?.rating || 5,
            averageDeliveryTime: l.stats?.averageDeliveryTime || 0
        },
        successRate: l.successRate || 100,
        createdAt: l.createdAt
    }));

    successResponse(res, {
        livreurs: formattedLivreurs,
        stats,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
            limit
        }
    }, 'Livreurs récupérés avec succès');
});

// @desc    Get livreur details
// @route   GET /api/admin/livreurs/:id
// @access  Private/Admin
exports.getLivreurDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const livreur = await Livreur.findById(id)
        .populate('userId', 'firstName lastName email phoneNumber profileImage createdAt addresses')
        .populate('currentOrders');

    if (!livreur) {
        return notFoundResponse(res, 'Livreur non trouvé');
    }

    // Get delivery history
    const deliveryHistory = await Order.find({
        livreurId: livreur.userId._id,
        status: { $in: ['delivered', 'refused', 'returned'] }
    })
        .sort({ deliveredAt: -1 })
        .limit(20)
        .select('orderNumber status totalAmount deliveredAt shippingAddress.city');

    // Get pending orders with more details
    const pendingOrders = await Order.find({
        livreurId: livreur.userId._id,
        status: { $in: ['assigned_to_delivery', 'picked_up', 'out_for_delivery'] }
    })
        .sort({ assignedToLivreurAt: -1 })
        .populate('userId', 'firstName lastName email phoneNumber') // Client details
        .populate('items.product', 'title price')
        .select('orderNumber status totalAmount shippingAddress assignedToLivreurAt paymentStatus');

    successResponse(res, {
        livreur,
        deliveryHistory,
        pendingOrders
    }, 'Détails du livreur récupérés');
});

// @desc    Update livreur status (approve/suspend)
// @route   PUT /api/admin/livreurs/:id/status
// @access  Private/Admin
exports.updateLivreurStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['pending', 'approved', 'suspended', 'inactive'].includes(status)) {
        return errorResponse(res, 'Statut invalide', 400);
    }

    const livreur = await Livreur.findById(id).populate('userId', 'firstName lastName email');

    if (!livreur) {
        return notFoundResponse(res, 'Livreur non trouvé');
    }

    const previousStatus = livreur.status;
    livreur.status = status;

    // If suspending, make unavailable
    if (status === 'suspended' || status === 'inactive') {
        livreur.isAvailable = false;
    }

    if (reason) {
        livreur.notes = reason;
    }

    await livreur.save();

    // Send notification to livreur
    if (livreur.userId) {
        let notificationContent = '';

        if (status === 'approved' && previousStatus === 'pending') {
            notificationContent = '🎉 Félicitations ! Votre compte livreur a été approuvé. Vous pouvez maintenant commencer à livrer des commandes.';
        } else if (status === 'suspended') {
            notificationContent = `⚠️ Votre compte livreur a été suspendu. ${reason ? `Raison: ${reason}` : 'Contactez l\'administration pour plus d\'informations.'}`;
        } else if (status === 'approved' && previousStatus === 'suspended') {
            notificationContent = '✅ Votre compte livreur a été réactivé. Vous pouvez reprendre les livraisons.';
        }

        if (notificationContent) {
            await Notification.create({
                userId: livreur.userId._id,
                type: 'livreur_status',
                content: notificationContent
            });
        }
    }

    successResponse(res, livreur, `Statut du livreur mis à jour: ${status}`);
});

// @desc    Create livreur account (admin only)
// @route   POST /api/admin/livreurs
// @access  Private/Admin
exports.createLivreurAccount = asyncHandler(async (req, res) => {
    const {
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        vehicleType,
        licensePlate,
        zone,
        additionalZones,
        maxOrdersAtOnce,
        documents,
        bankInfo
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phoneNumber || !zone) {
        return errorResponse(res, 'Champs obligatoires manquants: email, password, firstName, lastName, phoneNumber, zone', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        return errorResponse(res, 'Un utilisateur avec cet email existe déjà', 400);
    }

    // Create user with livreur role
    const user = new User({
        email: email.toLowerCase(),
        password,
        firstName,
        lastName,
        phoneNumber,
        role: 'livreur',
        isEmailVerified: true, // Admin-created accounts are verified
        status: 'active'
    });

    await user.save();

    // Generate Matricule: LIV-YYYY-XXXX
    const year = new Date().getFullYear();
    const count = await Livreur.countDocuments();
    const seq = (count + 1).toString().padStart(4, '0');
    const matricule = `LIV-${year}-${seq}`;

    // Create livreur profile
    const livreur = new Livreur({
        userId: user._id,
        matricule,
        vehicleType: vehicleType || 'moto',
        licensePlate,
        zone,
        additionalZones: additionalZones || [],
        maxOrdersAtOnce: maxOrdersAtOnce || 5,
        status: 'approved', // Admin-created livreurs are auto-approved
        isAvailable: true,
        documents: documents || {},
        cin: req.body.cin || {},
        type: req.body.type || 'independent',
        parentCompany: req.body.parentCompany,
        associatedVendors: req.body.associatedVendors || [],
        bankInfo: bankInfo || {}
    });

    await livreur.save();

    // Send welcome notification
    await Notification.create({
        userId: user._id,
        type: 'welcome',
        content: `Bienvenue ${firstName} ! Votre compte livreur OORYXX a été créé. Vous pouvez vous connecter et commencer à livrer des commandes.`
    });

    successResponse(res, {
        user: {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            role: user.role
        },
        livreur: {
            _id: livreur._id,
            vehicleType: livreur.vehicleType,
            zone: livreur.zone,
            status: livreur.status
        }
    }, 'Compte livreur créé avec succès', 201);
});

// @desc    Delete livreur (remove profile, keep user)
// @route   DELETE /api/admin/livreurs/:id
// @access  Private/Admin
exports.deleteLivreur = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { deleteUser: shouldDeleteUser } = req.query;

    const livreur = await Livreur.findById(id).populate('userId');

    if (!livreur) {
        return notFoundResponse(res, 'Livreur non trouvé');
    }

    // Check for pending deliveries
    if (livreur.currentOrders && livreur.currentOrders.length > 0) {
        return errorResponse(res, `Ce livreur a ${livreur.currentOrders.length} commande(s) en cours. Réassignez-les d'abord.`, 400);
    }

    const userId = livreur.userId?._id;

    // Delete livreur profile
    await Livreur.findByIdAndDelete(id);

    // Optionally delete or downgrade user
    if (shouldDeleteUser === 'true') {
        await User.findByIdAndUpdate(userId, { status: 'deleted' });
    } else {
        // Downgrade to customer
        await User.findByIdAndUpdate(userId, { role: 'customer' });
    }

    successResponse(res, null, 'Profil livreur supprimé avec succès');
});

// @desc    Get livreur delivery statistics
// @route   GET /api/admin/livreurs/:id/stats
// @access  Private/Admin
exports.getLivreurStats = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { period } = req.query;

    const livreur = await Livreur.findById(id).populate('userId', 'firstName lastName');

    if (!livreur) {
        return notFoundResponse(res, 'Livreur non trouvé');
    }

    // Calculate date range
    let startDate = new Date();
    switch (period) {
        case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
        case '90d':
            startDate.setDate(startDate.getDate() - 90);
            break;
        default:
            startDate.setDate(startDate.getDate() - 30);
    }

    // Get deliveries by day
    const deliveriesByDay = await Order.aggregate([
        {
            $match: {
                livreurId: livreur.userId._id,
                deliveredAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$deliveredAt' } },
                count: { $sum: 1 },
                revenue: { $sum: '$totalAmount' }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Get deliveries by status
    const deliveriesByStatus = await Order.aggregate([
        {
            $match: {
                livreurId: livreur.userId._id,
                updatedAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    successResponse(res, {
        livreur: {
            _id: livreur._id,
            name: `${livreur.userId.firstName} ${livreur.userId.lastName}`,
            stats: livreur.stats,
            successRate: livreur.successRate
        },
        period: period || '30d',
        deliveriesByDay,
        deliveriesByStatus
    }, 'Statistiques du livreur récupérées');
});

// ========================================
// GESTION DES LIVRAISONS & ASSIGNATION
// ========================================

// @desc    Get orders ready for delivery with livreur info
// @route   GET /api/admin/orders/delivery
// @access  Private/Admin
exports.getDeliveryOrders = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, zone, livreurId, search } = req.query;

    // Build query for delivery-related statuses
    const query = {
        status: { 
            $in: ['shipped', 'assigned_to_delivery', 'picked_up', 'out_for_delivery', 'delivered', 'refused', 'returned'] 
        }
    };

    // Filter by specific status
    if (status && status !== 'all') {
        if (status === 'ready_for_delivery') {
            query.status = 'shipped';
            query.livreurId = { $exists: false };
        } else {
            query.status = status;
        }
    }

    // Filter by livreur
    if (livreurId) {
        query.livreurId = livreurId === 'unassigned' 
            ? { $exists: false } 
            : livreurId;
    }

    // Search by order number or delivery code
    if (search) {
        query.$or = [
            { orderNumber: { $regex: search, $options: 'i' } },
            { deliveryCode: { $regex: search, $options: 'i' } },
            { 'shippingAddress.city': { $regex: search, $options: 'i' } },
            { 'shippingAddress.recipientName': { $regex: search, $options: 'i' } }
        ];
    }

    const orders = await Order.find(query)
        .populate('userId', 'firstName lastName email phoneNumber')
        .populate('livreurId', 'firstName lastName phoneNumber')
        .populate('items.productId', 'title images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Order.countDocuments(query);

    // Get available livreurs for assignment dropdown
    const Livreur = require('../models/Livreur');
    const livreurs = await Livreur.find({ isActive: true })
        .populate('userId', 'firstName lastName phoneNumber')
        .select('userId isAvailable deliveryZones vehicleType currentOrders maxOrdersPerDay stats');

    successResponse(res, {
        orders,
        livreurs: livreurs.map(l => ({
            _id: l._id,
            userId: l.userId?._id,
            name: l.userId ? `${l.userId.firstName} ${l.userId.lastName}` : 'Inconnu',
            phone: l.userId?.phoneNumber,
            isAvailable: l.isAvailable,
            vehicleType: l.vehicleType,
            zones: l.deliveryZones,
            currentOrders: l.currentOrders?.length || 0,
            maxOrders: l.maxOrdersPerDay || 10,
            rating: l.stats?.rating || 0
        })),
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
            limit
        }
    }, 'Commandes de livraison récupérées');
});

// @desc    Assign a livreur to an order
// @route   PUT /api/admin/orders/:orderId/assign-livreur
// @access  Private/Admin
exports.assignLivreurToOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { livreurId } = req.body;

    if (!livreurId) {
        return errorResponse(res, 'ID du livreur requis', 400);
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
        return notFoundResponse(res, 'Commande non trouvée');
    }

    // Check if order is in a valid status for assignment
    const validStatuses = ['shipped', 'assigned_to_delivery'];
    if (!validStatuses.includes(order.status)) {
        return errorResponse(res, `Impossible d'assigner un livreur à une commande avec le statut "${order.status}"`, 400);
    }

    // Find the livreur
    const Livreur = require('../models/Livreur');
    const livreur = await Livreur.findById(livreurId).populate('userId', 'firstName lastName');
    if (!livreur) {
        return notFoundResponse(res, 'Livreur non trouvé');
    }

    // Check if livreur is available
    if (!livreur.isAvailable) {
        return errorResponse(res, 'Ce livreur n\'est pas disponible', 400);
    }

    // Check if livreur has reached max orders
    if (livreur.currentOrders && livreur.currentOrders.length >= (livreur.maxOrdersPerDay || 10)) {
        return errorResponse(res, 'Ce livreur a atteint sa limite de commandes', 400);
    }

    // If order was already assigned to another livreur, remove from their list
    if (order.livreurId) {
        await Livreur.findOneAndUpdate(
            { userId: order.livreurId },
            { $pull: { currentOrders: order._id } }
        );
    }

    // Assign livreur to order
    order.livreurId = livreur.userId._id;
    order.status = 'assigned_to_delivery';
    order.assignedAt = new Date();
    await order.save();

    // Add order to livreur's current orders
    await Livreur.findByIdAndUpdate(livreurId, {
        $addToSet: { currentOrders: order._id }
    });

    // Populate the updated order
    await order.populate('livreurId', 'firstName lastName phoneNumber');

    successResponse(res, {
        order,
        livreur: {
            _id: livreur._id,
            name: `${livreur.userId.firstName} ${livreur.userId.lastName}`
        }
    }, `Commande assignée à ${livreur.userId.firstName} ${livreur.userId.lastName}`);
});

// @desc    Unassign livreur from an order
// @route   PUT /api/admin/orders/:orderId/unassign-livreur
// @access  Private/Admin
exports.unassignLivreurFromOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
        return notFoundResponse(res, 'Commande non trouvée');
    }

    if (!order.livreurId) {
        return errorResponse(res, 'Cette commande n\'a pas de livreur assigné', 400);
    }

    // Only allow unassignment if not yet picked up
    const validStatuses = ['assigned_to_delivery'];
    if (!validStatuses.includes(order.status)) {
        return errorResponse(res, `Impossible de retirer le livreur car la commande est "${order.status}"`, 400);
    }

    // Remove from livreur's current orders
    const Livreur = require('../models/Livreur');
    await Livreur.findOneAndUpdate(
        { userId: order.livreurId },
        { $pull: { currentOrders: order._id } }
    );

    // Unassign from order
    order.livreurId = undefined;
    order.status = 'shipped';
    order.assignedAt = undefined;
    await order.save();

    successResponse(res, { order }, 'Livreur retiré de la commande');
});

// @desc    Get delivery statistics for admin dashboard
// @route   GET /api/admin/delivery/stats
// @access  Private/Admin
exports.getDeliveryStats = asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count orders by status
    const pendingAssignment = await Order.countDocuments({
        status: 'shipped',
        livreurId: { $exists: false }
    });

    const assignedOrders = await Order.countDocuments({
        status: 'assigned_to_delivery'
    });

    const inDelivery = await Order.countDocuments({
        status: { $in: ['picked_up', 'out_for_delivery'] }
    });

    const deliveredToday = await Order.countDocuments({
        status: 'delivered',
        deliveredAt: { $gte: today, $lt: tomorrow }
    });

    const refusedToday = await Order.countDocuments({
        status: 'refused',
        updatedAt: { $gte: today, $lt: tomorrow }
    });

    // Count available livreurs
    const Livreur = require('../models/Livreur');
    const availableLivreurs = await Livreur.countDocuments({
        isActive: true,
        isAvailable: true
    });

    const totalLivreurs = await Livreur.countDocuments({ isActive: true });

    // Today's total completed (delivered + refused)
    const completedToday = deliveredToday + refusedToday;

    successResponse(res, {
        pendingAssignment,
        assignedOrders,
        inDelivery,
        deliveredToday,
        refusedToday,
        completedToday,
        availableLivreurs,
        totalLivreurs
    }, 'Statistiques de livraison récupérées');
});

