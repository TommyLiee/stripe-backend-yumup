const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Middlewares
app.use(cors());
app.use(express.json());

// Crée une session de paiement Stripe
app.post("/create-checkout-session", async (req, res) => {
  const { email, amount, description } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: "Commande HenryAgency",
            description: description,
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      customer_email: email,
      success_url: "https://henryagency.webflow.io/success",  // à modifier si nécessaire
      cancel_url: "https://henryagency.webflow.io/cancel",    // à modifier si nécessaire
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Erreur Stripe:", error);
    res.status(500).json({ error: error.message });
  }
});

// Route test pour vérifier que le backend tourne
app.get("/", (req, res) => {
  res.send("Le backend Stripe de HenryAgency fonctionne ! ✅");
});

// Écoute le port donné par Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur le port ${PORT}`);
});
