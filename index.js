// 📦 Imports
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const stripe = require("stripe")("sk_test_51ReEylRpNiXov6ulVjrbcbkw2fBADIc6Ht5rXt0iD89V0keFbMMSBQepEjWWKjhgtNgzYrYLO0SjPBPN3XangDNd00QDwrCnkr");
const nodemailer = require("nodemailer");
const Order = require("./models/Order");

const app = express();
const endpointSecret = "whsec_Ivwzv4IJs8dhuMo59f50K59ZrB2rYD82";

// 🧠 Connexion MongoDB
mongoose.connect("mongodb+srv://admin:admin123@henryagency.nrvabdb.mongodb.net/?retryWrites=true&w=majority&appName=HenryAgency")
  .then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => console.error("❌ Erreur MongoDB :", err));

// 📧 Transporter Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tr33fle@gmail.com",
    pass: "vicsilfkmhftzhle"
  }
});

// 📩 Envoi d'e-mail de confirmation
function sendConfirmationEmail(email, description, clientLink) {
  const mailOptions = {
    from: '"HenryAgency" <tr33fle@gmail.com>',
    to: email,
    subject: "🎉 Confirmation de commande - HenryAgency",
    html: `
      <h2>Merci pour ta commande !</h2>
      <p><strong>Détail :</strong><br>${description.replace(/\n/g, "<br>")}</p>
      <p><strong>Lien de dépôt :</strong> ${clientLink || "Non fourni"}</p>
      <p>Nous te contacterons si besoin. Merci pour ta confiance 🙌</p>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("❌ Email non envoyé :", error);
    } else {
      console.log("✅ Email envoyé :", info.response);
    }
  });
}

// 🧊 Middlewares
app.use(cors());
app.use(express.json());
app.use("/webhook", express.raw({ type: "application/json" })); // Spécifique au webhook

// 🧪 Route de test
app.get("/", (req, res) => {
  res.send("✅ Backend Stripe opérationnel !");
});

// 💳 Création de session Stripe
app.post("/create-checkout-session", async (req, res) => {
  const { email, amount, description, clientLink } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: "Commande HenryAgency",
            description
          },
          unit_amount: amount
        },
        quantity: 1
      }],
      metadata: {
        description,
        lien_videos: clientLink
      },
      success_url: "https://henryagency.webflow.io/success",
      cancel_url: "https://henryagency.webflow.io/cancel"
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error("❌ Erreur Stripe :", err);
    res.status(500).json({ error: "Erreur lors de la création de la session Stripe." });
  }
});

// 🧲 Webhook Stripe
app.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Signature Stripe invalide :", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_email;
    const total = session.amount_total ? session.amount_total / 100 : 0;
    const description = session.metadata?.description || "Commande";
    const clientLink = session.metadata?.lien_videos || "";

    try {
      // Mise à jour de la commande existante (créée avant le paiement)
      const updatedOrder = await Order.findOneAndUpdate(
        { email, status: "en attente" },
        {
          status: "payée",
          total,
          details: {
            description,
            lien_videos: clientLink
          }
        },
        { new: true }
      );

      if (updatedOrder) {
        console.log(`✅ Statut mis à jour pour ${email}`);
        sendConfirmationEmail(email, description, clientLink);
      } else {
        console.warn(`⚠️ Aucune commande à mettre à jour pour ${email}`);
      }
    } catch (err) {
      console.error("❌ Erreur lors de la mise à jour MongoDB :", err);
    }
  }

  res.status(200).json({ received: true });
});

// 🚀 Lancement du serveur
const PORT = 4242;
app.listen(PORT, () => {
  console.log(`🚀 Serveur Stripe opérationnel sur le port ${PORT}`);
});
