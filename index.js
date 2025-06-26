const express = require("express");
const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.json());

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
            name: "Commande YumUp",
            description: description
          },
          unit_amount: amount
        },
        quantity: 1
      }],
      customer_email: email,
      success_url: "https://tonsite.com/success", // à remplacer
      cancel_url: "https://tonsite.com/cancel"    // à remplacer
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Erreur Stripe:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("✅ Serveur lancé sur le port 3000");
});
