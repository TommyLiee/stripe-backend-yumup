// ✅ BACKEND MODIFIÉ (Node.js / Express)
const express = require("express");
const app = express();
const cors = require("cors");
const stripe = require("stripe")("sk_test_51ReEylRpNiXov6ulVjrbcbkw2fBADIc6Ht5rXt0iD89V0keFbMMSBQepEjWWKjhgtNgzYrYLO0SjPBPN3XangDNd00QDwrCnkr");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Le backend Stripe de HenryAgency fonctionne ! ✅");
});

app.post("/create-checkout-session", async (req, res) => {
  const { email, amount, description, clientLink } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Commande HenryAgency",
              description: `${description}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        lien_videos: clientLink || "aucun lien"
      },
      success_url: "https://henryagency.webflow.io/success",
      cancel_url: "https://henryagency.webflow.io/cancel",
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Erreur Stripe :", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Serveur en cours sur le port ${PORT}`));
