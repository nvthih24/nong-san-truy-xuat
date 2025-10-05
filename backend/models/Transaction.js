const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  txHash: {
    type: String,
    required: true,
    unique: true,
  },
  productId: {
    type: String,
    required: true,
  },
  userAddress: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    enum: ['addProduct', 'updateTrace', 'updateManagerInfo'],
    required: true,
  },
  timestamp: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Transaction', transactionSchema);