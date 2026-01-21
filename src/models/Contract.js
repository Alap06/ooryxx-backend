const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  adminId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  pdfUrl:   String,
  startDate: Date,
  endDate:   Date,
  status:    { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Contract', contractSchema);