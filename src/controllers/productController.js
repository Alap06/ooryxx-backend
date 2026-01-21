const Product = require('../models/Product');
const Category = require('../models/Category');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// @desc    Get all public products with filters
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        category,
        minPrice,
        maxPrice,
        sort = '-createdAt',
        search,
        discount
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = {
        isPublished: true,
        status: 'active',
        stock: { $gt: 0 }
    };

    if (category) {
        query.category = category;
    }

    if (minPrice || maxPrice) {
        query.finalPrice = {};
        if (minPrice) query.finalPrice.$gte = parseFloat(minPrice);
        if (maxPrice) query.finalPrice.$lte = parseFloat(maxPrice);
    }

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    if (discount === 'true') {
        query['discount.percentage'] = { $gt: 0 };
    }

    const products = await Product.find(query)
        .populate('category', 'name slug')
        .populate('vendorId', 'companyInfo.name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v');

    const total = await Product.countDocuments(query);

    successResponse(res, {
        products,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
        }
    }, 'Products retrieved successfully');
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = asyncHandler(async (req, res) => {
    const { limit = 8 } = req.query;

    // First try to get products marked as featured
    let products = await Product.find({
        isPublished: true,
        status: 'active',
        stock: { $gt: 0 },
        featured: true
    })
        .populate('category', 'name slug')
        .populate('vendorId', 'companyInfo.name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .select('-__v');

    // If no featured products, fallback to top-rated products
    if (products.length === 0) {
        products = await Product.find({
            isPublished: true,
            status: 'active',
            stock: { $gt: 0 }
        })
            .populate('category', 'name slug')
            .populate('vendorId', 'companyInfo.name')
            .sort({ rating: -1, reviewCount: -1 })
            .limit(parseInt(limit))
            .select('-__v');
    }

    successResponse(res, { products }, 'Featured products retrieved successfully');
});

// @desc    Get products on sale
// @route   GET /api/products/sale
// @access  Public
exports.getSaleProducts = asyncHandler(async (req, res) => {
    const { limit = 8 } = req.query;

    const products = await Product.find({
        isPublished: true,
        status: 'active',
        stock: { $gt: 0 },
        'discount.percentage': { $gt: 0 }
    })
        .populate('category', 'name slug')
        .populate('vendorId', 'companyInfo.name')
        .sort({ 'discount.percentage': -1 })
        .limit(parseInt(limit))
        .select('-__v');

    successResponse(res, { products }, 'Sale products retrieved successfully');
});

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('category', 'name slug')
        .populate('vendorId', 'companyInfo.name companyInfo.description stats.rating');

    if (!product) {
        return errorResponse(res, 'Product not found', 404);
    }

    successResponse(res, { product }, 'Product retrieved successfully');
});

// @desc    Get similar products
// @route   GET /api/products/:id/similar
// @access  Public
exports.getSimilarProducts = asyncHandler(async (req, res) => {
    const { limit = 4 } = req.query;

    const product = await Product.findById(req.params.id);
    if (!product) {
        return errorResponse(res, 'Product not found', 404);
    }

    const similarProducts = await Product.find({
        _id: { $ne: product._id },
        category: product.category,
        isPublished: true,
        status: 'active',
        stock: { $gt: 0 }
    })
        .populate('category', 'name slug')
        .populate('vendorId', 'companyInfo.name')
        .sort({ rating: -1 })
        .limit(parseInt(limit))
        .select('-__v');

    successResponse(res, { products: similarProducts }, 'Similar products retrieved successfully');
});

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
exports.getProductReviews = asyncHandler(async (req, res) => {
    // TODO: Implement reviews when Review model is created
    successResponse(res, {
        reviews: [],
        stats: {
            average: 0,
            total: 0,
            distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        }
    }, 'Reviews retrieved successfully');
});

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
exports.searchProducts = asyncHandler(async (req, res) => {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
        return errorResponse(res, 'Search query is required', 400);
    }

    const skip = (page - 1) * limit;

    const products = await Product.find({
        $or: [
            { title: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } }
        ],
        isPublished: true,
        status: 'active'
    })
        .populate('category', 'name slug')
        .populate('vendorId', 'companyInfo.name')
        .sort({ rating: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v');

    const total = await Product.countDocuments({
        $or: [
            { title: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } }
        ],
        isPublished: true,
        status: 'active'
    });

    successResponse(res, {
        products,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
        }
    }, 'Search results retrieved successfully');
});

// @desc    Get all active categories
// @route   GET /api/products/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true })
        .sort({ displayOrder: 1, name: 1 })
        .select('name slug description icon image parentId');

    successResponse(res, { categories }, 'Categories retrieved successfully');
});

