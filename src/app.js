const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { FRONTEND_URL } = require('./config/env');
const { globalRateLimiter } = require('./middleware/rateLimiting');
const { errorHandler, notFoundHandler, unhandledErrorHandler } = require('./middleware/errorHandler');
const { successResponse } = require('./utils/responseHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const vendorRoutes = require('./routes/vendors');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const reclamationRoutes = require('./routes/reclamations');
const categoryRoutes = require('./routes/categories');
const messageRoutes = require('./routes/messages');
const productQuestionRoutes = require('./routes/productQuestionRoutes');
const livreurRoutes = require('./routes/livreur');
const assignmentRoutes = require('./routes/assignment');
const deliveryZoneRoutes = require('./routes/deliveryZones');
const featuredProductRoutes = require('./routes/featuredProducts');
const announcementRoutes = require('./routes/announcements');

const app = express();

// Initialiser le gestionnaire d'erreurs non gérées
unhandledErrorHandler();

// Middlewares de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [FRONTEND_URL, 'http://localhost:3000'];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Compression gzip
app.use(compression());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use(globalRateLimiter);

// Health check (both paths for compatibility)
app.get('/health', (req, res) => {
  successResponse(res, {
    status: 'OK',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  }, 'Service opérationnel');
});

app.get('/api/health', (req, res) => {
  successResponse(res, {
    status: 'OK',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  }, 'Service opérationnel');
});

// API Info
app.get('/api', (req, res) => {
  successResponse(res, {
    name: 'OORYXX API',
    version: '1.0.0',
    description: 'API REST pour la marketplace OORYXX',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      vendors: '/api/vendors',
      products: '/api/products',
      orders: '/api/orders',
      payments: '/api/payments',
      admin: '/api/admin',
      analytics: '/api/analytics',
      reclamations: '/api/reclamations',
      categories: '/api/categories',
    },
  }, 'Bienvenue sur l\'API OORYXX');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vendor', vendorRoutes); // Vendor dashboard routes
app.use('/api/vendors', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reclamations', reclamationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', productQuestionRoutes); // Anonymous product Q&A routes
app.use('/api/livreur', livreurRoutes); // Delivery person routes
app.use('/api/assignment', assignmentRoutes); // Order assignment routes
app.use('/api/delivery-zones', deliveryZoneRoutes); // Delivery zones routes
app.use('/api/featured-products', featuredProductRoutes); // Featured products for hero slider
app.use('/api/announcements', announcementRoutes); // Announcements/info bar routes

// 404 handler (doit être après toutes les routes)
app.use(notFoundHandler);

// Error handler global (doit être le dernier middleware)
app.use(errorHandler);

module.exports = app;
