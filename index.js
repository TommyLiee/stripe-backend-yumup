const express = require("express");
const cors = require("cors");
const stripe = require("stripe")("sk_test_51ReEylRpNiXov6ulVjrbcbkw2fBADIc6Ht5rXt0iD89V0keFbMMSBQepEjWWKjhgtNgzYrYLO0SjPBPN3XangDNd00QDwrCnkr");
const nodemailer = require("nodemailer");

const app = express();

// Middleware spécifique pour Stripe Webhook
app.use("/webhook", express.raw({ type: "application/json" }));

// Middleware général
app.use(cors());
app.use(express.json());

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tr33fle@gmail.com",
    pass: "vicsilfkmhftzhle"
  }
});

// Fonction pour envoyer l'email
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

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("❌ Erreur d'envoi d'email :", error);
    } else {
      console.log("✅ Email envoyé :", info.response);
    }
  });
}

// Route de test
app.get("/", (req, res) => {
  res.send("Le backend Stripe de HenryAgency fonctionne ! ✅");
});

// Création de la session de paiement
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
              description: description // ✅ visible sur la page Stripe
            },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      customer_email: email,
      metadata: {
        lien_videos: clientLink || "aucun lien",
        description: description || "Commande"
      },
      success_url: "https://henryagency.webflow.io/success",
      cancel_url: "https://henryagency.webflow.io/cancel"
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("❌ Erreur Stripe :", error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook Stripe
const endpointSecret = "whsec_Ivwzv4IJs8dhuMo59f50K59ZrB2rYD82";

app.post("/webhook", (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Erreur de vérification webhook :", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    console.log("📦 Metadata reçue :", session.metadata);

    const email = session.customer_email;
    const description = session.metadata?.description || "Commande";
    const clientLink = session.metadata?.lien_videos || "Aucun lien fourni";

    sendConfirmationEmail(email, description, clientLink);
    console.log("✅ Paiement confirmé — email envoyé à", email);
  }

  res.status(200).json({ received: true });
});

// Lancement du serveur
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur le port ${PORT}`);
});
