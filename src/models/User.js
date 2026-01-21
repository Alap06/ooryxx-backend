const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const addressSchema = new mongoose.Schema({
  label: { type: String, required: true }, // 'Maison', 'Bureau', etc.
  street: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'Tunisie' },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true,
    minlength: [2, 'Le prénom doit contenir au moins 2 caractères']
  },
  lastName: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email invalide']
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false // Ne pas retourner le mot de passe par défaut
  },
  phoneNumber: {
    type: String,
    match: [/^\+?[1-9]\d{1,14}$/, 'Numéro de téléphone invalide']
  },
  birthdate: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: null
  },
  addresses: [addressSchema],
  role: {
    type: String,
    enum: ['customer', 'customer_vip', 'vendor', 'livreur', 'moderator', 'admin'],
    default: 'customer'
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended', 'deleted'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  profileImage: String,


  // Social login
  googleId: String,
  facebookId: String,

  // Références
  cart: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  // Token pour réinitialisation de mot de passe
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  // Refresh token
  refreshToken: String,

  // Métadonnées
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
// email index is auto-created by unique: true
userSchema.index({ role: 1 });
userSchema.index({ level: 1 });

// Virtual pour le nom complet
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual pour les commandes
userSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'userId'
});

// Hash password avant sauvegarde
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Erreur lors de la comparaison des mots de passe');
  }
};

// Méthode pour générer un token de réinitialisation de mot de passe
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Méthode pour vérifier si le compte est verrouillé
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Incrémenter les tentatives de connexion
userSchema.methods.incLoginAttempts = function () {
  // Si le verrouillage a expiré, réinitialiser
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Verrouiller le compte après 5 tentatives échouées
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 heures
  }

  return this.updateOne(updates);
};

// Réinitialiser les tentatives de connexion
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

module.exports = mongoose.model('User', userSchema);