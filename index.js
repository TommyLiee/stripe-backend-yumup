// ✅ BACKEND COMPLET Stripe + Email (Node.js / Express)
const express = require("express");
const app = express();
const cors = require("cors");
const stripe = require("stripe")("sk_test_51ReEylRpNiXov6ulVjrbcbkw2fBADIc6Ht5rXt0iD89V0keFbMMSBQepEjWWKjhgtNgzYrYLO0SjPBPN3XangDNd00QDwrCnkr");
const nodemailer = require("nodemailer");

app.use(cors());
app.use(express.json());

// ✅ CONFIG EMAIL
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tr33fle@gmail.com", // remplace par ton email
    pass: "vics ilfk mhft zhle " // remplace par le mot de passe généré par Google
  }
});

function sendConfirmationEmail(email, description, clientLink) {
  const mailOptions = {
    from: '"HenryAgency" <tr33fle@gmail.com>',
    to: email,
    subject: "🎉 Confirmation de commande - HenryAgency",
    html: `
      <h2>Merci pour ta commande !</h2>
      <p><strong>Détail :</strong> ${description}</p>
      <p><strong>Lien de dépôt des fichiers :</strong> ${clientLink || "Non renseigné"}</p>
      <p>Nous te contacterons rapidement si nous avons besoin de précisions.<br>Merci pour ta confiance 🙌</p>
    `
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.error("Erreur d'envoi d'email :", error);
    } else {
      console.log("✅ Email envoyé :", info.response);
    }
  });
}

// ✅ ROUTE TEST
app.get("/", (req, res) => {
  res.send("Le backend Stripe de HenryAgency fonctionne ! ✅");
});

// ✅ ROUTE STRIPE
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

    // ✅ Envoi de l'email juste après création de la session
    sendConfirmationEmail(email, description, clientLink);

    res.json({ id: session.id });
  } catch (error) {
    console.error("Erreur Stripe :", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ LANCEMENT DU SERVEUR
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`✅ Serveur Stripe + Email lancé sur le port ${PORT}`));
