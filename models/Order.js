const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  swissLink: String,
  status: { type: String, default: 'en attente' },
  messages: [
    {
      sender: String,
      content: String,
      timestamp: { type: Date, default: Date.now }
    }
  ]
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
