export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Parsing del body (fix per Vercel)
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    const embed = {
      username: "Helius Webhook",
      embeds: [
        {
          title: "📡 Nuovo Webhook Ricevuto",
          color: 0x00ff00,
          timestamp: new Date().toISOString(),
          fields: [
            { name: "Tipo evento", value: payload.type || "N/A" },
            { name: "Signature", value: payload.signature || "N/A" },
            { name: "Slot", value: String(payload.slot || "N/A") }
          ],
          footer: {
            text: "OuroBot"
          }
        }
      ]
    };

    const discordWebhookURL = "https://discord.com/api/webhooks/1364346213402546240/QKSJ3TTP6t31POZRovyn4XtMCEqw2wwCxDUJoF1xCG2h6HYOc-BMG8T5VSs7BLIQIC9l";

    await fetch(discordWebhookURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed),
    });

    return res.status(200).json({ status: 'ok' });

  } catch (err) {
    console.error("❌ Errore nella funzione webhook:", err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
