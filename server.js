// ?? Chargement des variables d'environnement
require('dotenv').config();

// ?? Imports
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const Order = require('./models/Order');

// ?? Initialisation de l'app
const app = express();
app.use(cors());
app.use(express.json());

// ?? Connexion � MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('? Connect� � MongoDB'))
  .catch(err => console.error('? Erreur MongoDB :', err));

// ?? Mod�le utilisateur
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String
});
const User = mongoose.model('User', userSchema);

// ?? Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Acc�s refus�, token manquant" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // On stocke tout l'objet d�cod�
    next();
  } catch (err) {
    res.status(401).json({ error: "Token invalide" });
  }
};

// ?? Inscription
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed });
    await user.save();
    res.json({ message: "? Utilisateur cr�� avec succ�s" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la cr�ation" });
  }
});

// ?? Connexion
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Utilisateur non trouv�" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Mot de passe incorrect" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ?? Route test profil
app.get('/profile', authenticateToken, (req, res) => {
  res.json({ message: `Bienvenue, utilisateur ${req.user.userId}` });
});

// ?? Cr�er une commande
app.post('/create-order', authenticateToken, async (req, res) => {
  const { title, swissLink } = req.body;
  try {
    const order = new Order({
      userId: req.user.userId,
      title,
      swissLink,
      status: 'en attente',
      messages: []
    });
    await order.save();
    res.json({ message: '? Commande cr��e avec succ�s' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la cr�ation de commande' });
  }
});

// ?? Lancement serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`?? API lanc�e sur le port ${PORT}`));
