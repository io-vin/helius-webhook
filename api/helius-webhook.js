import { buffer } from 'micro';

export const config = {
  api: {
    bodyParser: false, // Disattiva il body parser di Next.js
  },
};

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // 🧠 Prende il body grezzo
    const rawBody = await buffer(req);
    const bodyText = rawBody.toString('utf8').trim();

    console.log("📦 Raw buffer length:", rawBody.length);
    console.log("📦 Raw buffer (utf8):", bodyText);

    // ❌ Se il body è vuoto, termina
    if (!bodyText || bodyText.length < 5) {
      return res.status(400).json({ error: 'Empty or invalid JSON body' });
    }

    // 🔄 Tenta il parsing JSON
    let payload;
    try {
      payload = JSON.parse(bodyText);
    } catch (err) {
      console.error("❌ Errore nel parsing JSON:", err.message);
      return res.status(400).json({ error: 'Invalid JSON format' });
    }

    // ✅ Verifica struttura payload
    if (!payload?.accountData || !Array.isArray(payload.accountData)) {
      console.log("❌ Payload senza accountData:", JSON.stringify(payload));
      return res.status(400).json({ error: 'Expected object with accountData array' });
    }

    const accountData = payload.accountData;

    // 🎯 Token da ignorare (SOL, USDC, USDT)
    const excludedMints = [
      'So11111111111111111111111111111111111111112',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
    ];

    // 🔍 Variabili da riempire
    let buyer = null;
    let tokenMint = null;
    let tokenAmount = null;
    let decimals = null;
    let solSpent = null;

    for (const acc of accountData) {
      if (acc.tokenBalanceChanges && acc.tokenBalanceChanges.length > 0) {
        const tokenInfo = acc.tokenBalanceChanges[0];

        if (!tokenInfo?.mint || excludedMints.includes(tokenInfo.mint)) {
          console.log("⚠️ Token escluso:", tokenInfo?.mint);
          return res.status(200).json({ status: 'ignored excluded token' });
        }

        if (!tokenInfo.rawTokenAmount) continue;

        buyer = tokenInfo.userAccount;
        tokenMint = tokenInfo.mint;
        tokenAmount = tokenInfo.rawTokenAmount.tokenAmount;
        decimals = tokenInfo.rawTokenAmount.decimals;
      }
    }

    for (const acc of accountData) {
      if (acc.account === buyer && acc.nativeBalanceChange < 0) {
        solSpent = Math.abs(acc.nativeBalanceChange) / 1e9;
      }
    }

    // 🛑 Se non è un BUY, esce
    if (!buyer || !tokenMint || !tokenAmount || !solSpent) {
      console.log("⛔ Dati incompleti o non è un BUY.");
      return res.status(200).json({ status: 'not a buy or incomplete data' });
    }

    // ✅ Format dei valori
    const amountFormatted = (Number(tokenAmount) / Math.pow(10, decimals)).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    });

    const solFormatted = `~${solSpent.toFixed(4)} SOL`;

    // 📨 Messaggio per Discord
    const content = `🆕 Buy detected on InternetMoneyMafia\n` +
      `💰 Buyer: ${buyer}\n` +
      `📦 Token: ${tokenMint}\n` +
      `📊 Amount: ${amountFormatted}\n` +
      `💵 Spent: ${solFormatted}`;

    const discordWebhookURL = "https://discord.com/api/webhooks/1364346213402546240/QKSJ3TTP6t31POZRovyn4XtMCEqw2wwCxDUJoF1xCG2h6HYOc-BMG8T5VSs7BLIQIC9l";

    await fetch(discordWebhookURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    console.log("✅ Messaggio inviato a Discord");

    return res.status(200).json({ status: 'ok' });

  } catch (err) {
    console.error("❌ Errore generale:", err.message);
    console.error(err.stack);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
