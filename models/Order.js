const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String, required: true },
  title: { type: String, required: true },
  swissLink: { type: String },
  total: { type: Number, required: true },
  status: { type: String, default: 'en attente' },
  date: { type: Date, default: Date.now },
  messages: [
    {
      sender: String,
      content: String,
      timestamp: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('Order', orderSchema);
