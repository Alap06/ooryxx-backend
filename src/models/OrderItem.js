const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity:  { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  reviewId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Review' }
});

module.exports = orderItemSchema;