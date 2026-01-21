const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'La quantité doit être au moins 1'],
    default: 1
  },
  price: Number, // Prix au moment de l'ajout
  selectedVariants: {
    type: Map,
    of: String
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  items: [cartItemSchema],
  
  // Code promo appliqué
  couponCode: String,
  
  // Total estimé
  estimatedTotal: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Méthode pour ajouter un produit
cartSchema.methods.addItem = async function(productId, quantity = 1, selectedVariants = {}) {
  const existingItem = this.items.find(item => 
    item.productId.toString() === productId.toString()
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    const Product = mongoose.model('Product');
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Produit non trouvé');
    }
    
    if (!product.isInStock(quantity)) {
      throw new Error('Stock insuffisant');
    }
    
    this.items.push({
      productId,
      quantity,
      price: product.finalPrice,
      selectedVariants
    });
  }
  
  return this.save();
};

// Méthode pour mettre à jour la quantité
cartSchema.methods.updateItemQuantity = function(productId, quantity) {
  const item = this.items.find(item => 
    item.productId.toString() === productId.toString()
  );
  
  if (!item) {
    throw new Error('Article non trouvé dans le panier');
  }
  
  if (quantity <= 0) {
    this.items = this.items.filter(item => 
      item.productId.toString() !== productId.toString()
    );
  } else {
    item.quantity = quantity;
  }
  
  return this.save();
};

// Méthode pour supprimer un article
cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(item => 
    item.productId.toString() !== productId.toString()
  );
  
  return this.save();
};

// Méthode pour vider le panier
cartSchema.methods.clear = function() {
  this.items = [];
  this.couponCode = undefined;
  return this.save();
};

// Méthode pour calculer le total
cartSchema.methods.calculateTotal = async function() {
  await this.populate('items.productId');
  
  let total = 0;
  for (const item of this.items) {
    if (item.productId) {
      total += item.productId.finalPrice * item.quantity;
    }
  }
  
  this.estimatedTotal = total;
  return total;
};

module.exports = mongoose.model('Cart', cartSchema);
