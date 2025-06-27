const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Soit userId, soit email (ou les deux si tu veux lier à un compte)
  email: { type: String, required: true },
  total: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, default: 'en attente' },

  details: {
    description: { type: String },
    lien_videos: { type: String }
  },

  // Optionnel : si tu veux garder le système de discussion
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
