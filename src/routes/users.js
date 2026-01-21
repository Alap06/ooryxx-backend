const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getOrders,
  getOrderById,
  cancelOrder,
  getUserStats,
  submitVendorRequest
} = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// Configure multer for vendor request uploads
const vendorUploadDir = path.join(__dirname, '../../uploads/vendor-requests');
if (!fs.existsSync(vendorUploadDir)) {
  fs.mkdirSync(vendorUploadDir, { recursive: true });
}

const vendorStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, vendorUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const vendorUpload = multer({
  storage: vendorStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Seuls les fichiers JPEG, PNG et PDF sont autorisés'));
  }
});

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

// ==================== PROFIL ====================
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/profile/password', changePassword);

// ==================== ADRESSES ====================
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);

// ==================== PANIER ====================
router.get('/cart', getCart);
router.post('/cart', addToCart);
router.put('/cart/:productId', updateCartItem);
router.delete('/cart/:productId', removeFromCart);
router.delete('/cart', clearCart);

// ==================== WISHLIST ====================
router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);

// ==================== COMMANDES ====================
router.get('/orders', getOrders);
router.get('/orders/:orderId', getOrderById);
router.put('/orders/:orderId/cancel', cancelOrder);

// ==================== STATISTIQUES ====================
router.get('/stats', getUserStats);

// ==================== DEMANDE VENDEUR ====================
router.post('/vendor-request', vendorUpload.fields([
  { name: 'nationalIdFront', maxCount: 1 },
  { name: 'nationalIdBack', maxCount: 1 },
  { name: 'signedConvention', maxCount: 1 }
]), submitVendorRequest);

module.exports = router;


