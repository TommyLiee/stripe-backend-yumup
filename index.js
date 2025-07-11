// ✅ Nouveau index.js pour stripe-backend (avec update fiable de la commande)

const express = require("express");
const cors = require("cors");
const stripe = require("stripe")("sk_test_51ReEylRpNiXov6ulVjrbcbkw2fBADIc6Ht5rXt0iD89V0keFbMMSBQepEjWWKjhgtNgzYrYLO0SjPBPN3XangDNd00QDwrCnkr");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const Order = require("./models/Order");

const app = express();
const endpointSecret = "whsec_Ivwzv4IJs8dhuMo59f50K59ZrB2rYD82";

// 🔗 Connexion MongoDB
mongoose.connect("mongodb+srv://admin:admin123@henryagency.nrvabdb.mongodb.net/?retryWrites=true&w=majority&appName=HenryAgency")
  .then(() => console.log("✅ Connecté à MongoDB"))
  .catch((err) => console.error("❌ Erreur MongoDB :", err));

// ✉️ Nodemailer config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tr33fle@gmail.com",
    pass: "vicsilfkmhftzhle"
  }
});

function sendConfirmationEmail(email, description, clientLink) {
  const mailOptions = {
    from: '"HenryAgency" <tr33fle@gmail.com>',
    to: email,
    subject: "🎉 Confirmation de commande - HenryAgency",
    html: `
      <h2>Merci pour ta commande !</h2>
      <p><strong>Détail :</strong><br>${description.replace(/\n/g, "<br>")}</p>
      <p><strong>Lien de dépôt des fichiers :</strong> ${clientLink || "Non renseigné"}</p>
      <p>Merci pour ta confiance 🙌</p>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("❌ Erreur email :", error);
    } else {
      console.log("✅ Email envoyé :", info.response);
    }
  });
}

// ⚠️ Webhook = body brut
app.use("/webhook", express.raw({ type: "application/json" }));

// 🧊 Middleware global
app.use(cors());
app.use(express.json());

// 🔁 Test route
app.get("/", (req, res) => {
  res.send("✅ Backend Stripe opérationnel !");
});

// 💳 Création session Stripe
app.post("/create-checkout-session", async (req, res) => {
  const { email, amount, description, clientLink } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
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
      customer_email: email,
      metadata: {
        description: description || "Commande",
        lien_videos: clientLink || "aucun lien"
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

// 📩 Webhook Stripe
app.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Erreur Webhook Stripe :", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_email;
    const description = session.metadata?.description || "Commande";
    const clientLink = session.metadata?.lien_videos || "aucun lien";
    const total = session.amount_total ? session.amount_total / 100 : 0;

    try {
      const updated = await Order.findOneAndUpdate(
        { email, status: "en attente" },
        {
          status: "payée",
          total,
          details: {
            description,
            lien_videos: clientLink
          }
        },
        { new: true, sort: { date: -1 } }
      );

      if (updated) {
        console.log(`✅ Commande mise à jour comme payée pour ${email}`);
        sendConfirmationEmail(email, description, clientLink);
      } else {
        console.warn(`⚠️ Aucune commande trouvée à mettre à jour pour ${email}`);
      }
    } catch (err) {
      console.error("❌ Erreur MongoDB update :", err);
    }
  }

  res.status(200).json({ received: true });
});

// 🚀 Serveur
app.listen(4242, () => {
  console.log("🚀 Serveur Stripe + Webhook lancé sur le port 4242");
});
