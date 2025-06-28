// 📦 Imports
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const Order = require('./models/Order');

const app = express();
app.use(cors());
app.use(express.json());

// 🔌 Connexion MongoDB (clé fixée ici)
mongoose.connect("mongodb+srv://admin:admin123@henryagency.nrvabdb.mongodb.net/?retryWrites=true&w=majority&appName=HenryAgency")
  .then(() => console.log("✅ Connecté à MongoDB"))
  .catch(err => console.error("❌ Erreur MongoDB :", err));

// 👤 Modèle utilisateur
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String
});
const User = mongoose.model('User', userSchema);

// 🔐 Middleware d'authentification
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token manquant" });

  try {
    const decoded = jwt.verify(token, "henry_secret"); // clé fixe
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: "Token invalide" });
  }
};

// 📝 Inscription
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed });
    await user.save();
    res.json({ message: "✅ Utilisateur créé avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
});

// 🔑 Connexion
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Utilisateur non trouvé" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Mot de passe incorrect" });

    const token = jwt.sign({ userId: user._id, email: user.email }, "henry_secret", { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 👤 Route de profil protégée
app.get('/profile', authMiddleware, (req, res) => {
  res.json({ message: `Bienvenue utilisateur ${req.user.email}` });
});

// 📦 Créer une commande
app.post('/create-order', authMiddleware, async (req, res) => {
  const { title, swissLink } = req.body;
  try {
    const order = new Order({
      userId: req.user.userId,
      email: req.user.email,
      title,
      swissLink,
      status: 'en attente',
      messages: []
    });
    await order.save();
    res.json({ message: '✅ Commande créée avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur création commande' });
  }
});

// 📬 Liste des commandes du client
app.get("/orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ email: req.user.email }).sort({ date: -1 });
    res.json(orders);
  } catch (err) {
    console.error("❌ Erreur récupération commandes :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🚀 Lancement serveur
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 API lancée sur le port ${PORT}`));
