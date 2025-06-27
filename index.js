// 🌐 Chargement des variables d'environnement
require("dotenv").config();

// 📦 Imports
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // sécurisé via .env
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const Order = require("./models/Order"); // Ton modèle de commande

const app = express();

// ⚠️ Stripe Webhook a besoin du body brut
app.use("/webhook", express.raw({ type: "application/json" }));

// 🌍 Middlewares globaux
app.use(cors());
app.use(express.json());

// 🔌 Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connecté à MongoDB"))
  .catch((err) => console.error("❌ Erreur MongoDB :", err));

// 📧 Configuration de Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tr33fle@gmail.com",
    pass: "vicsilfkmhftzhle"
  }
});

// ✅ Fonction d'envoi d'e-mail
function sendConfirmationEmail(email, description, clientLink) {
  const mailOptions = {
    from: '"HenryAgency" <tr33fle@gmail.com>',
    to: email,
    subject: "🎉 Confirmation de commande - HenryAgency",
    html: `
      <h2>Merci pour ta commande !</h2>
      <p><strong>Détail :</strong><br>${description.replace(/\n/g, "<br>")}</p>
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

// 🔁 Route test
app.get("/", (req, res) => {
  res.send("Le backend Stripe de HenryAgency fonctionne ✅");
});

// 💳 Création de la session de paiement
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
              description
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

// 🔄 Webhook Stripe
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

    const email = session.customer_email;
    const description = session.metadata?.description || "Commande";
    const clientLink = session.metadata?.lien_videos || "aucun lien";

    // 📬 Envoie de l'e-mail
    sendConfirmationEmail(email, description, clientLink);

    // 💾 Création de la commande en base de données
    const newOrder = new Order({
      email,
      total: session.amount_total / 100,
      date: new Date(),
      status: "payée",
      details: {
        lien_videos: clientLink,
        description
      }
    });

    newOrder.save()
      .then(() => console.log("✅ Commande enregistrée dans MongoDB"))
      .catch((err) => console.error("❌ Erreur enregistrement commande :", err));
  }

  res.status(200).json({ received: true });
});

// 🚀 Lancement du serveur
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});
