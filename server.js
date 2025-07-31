// server.js
const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const token = "SEU_TOKEN_DO_FACEBOOK";
const phoneNumberId = "ID_DO_SEU_NUMERO";

app.post("/send", async (req, res) => {
  const { to, message } = req.body;

  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ status: "ok" });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ status: "erro", erro: err.message });
  }
});

app.listen(3000, () =>
  console.log("API WhatsApp rodando em http://localhost:3000")
);
