const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  filename:   String,
  type:       String,
  linkedTo:   {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'onModel'
  },
  onModel:    { type: String, required: true, enum: ['User','Product','Order','Payment','Contract'] },
  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Upload', uploadSchema);