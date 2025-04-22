import { buffer } from 'micro';

export const config = {
  api: {
    bodyParser: false, // Obbligatorio per usare `buffer` da micro
  },
};

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const rawBody = await buffer(req);
    const payload = JSON.parse(rawBody.toString());

    // ✅ Debug iniziale
    console.log("🔥 PAYLOAD RICEVUTO 🔥", JSON.stringify(payload, null, 2));

    if (!payload?.accountData || !Array.isArray(payload.accountData)) {
      console.log("❌ Formato non valido:", JSON.stringify(payload));
      return res.status(400).json({ error: 'Invalid payload format: expected object with accountData array' });
    }

    const accountData = payload.accountData;

    const excludedMints = [
      'So11111111111111111111111111111111111111112', // Wrapped SOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'  // USDT
    ];

    let buyer = null;
    let tokenMint = null;
    let tokenAmount = null;
    let decimals = null;
    let solSpent = null;

    for (const acc of accountData) {
      if (acc.tokenBalanceChanges && acc.tokenBalanceChanges.length > 0) {
        const tokenInfo = acc.tokenBalanceChanges[0];

        console.log("🔍 tokenInfo:", tokenInfo);

        if (excludedMints.includes(tokenInfo.mint)) {
          console.log("⚠️ Token escluso:", tokenInfo.mint);
          return res.status(200).json({ status: 'ignored excluded token' });
        }

        if (!tokenInfo.rawTokenAmount) {
          console.log("⚠️ Nessun rawTokenAmount, skip.");
          continue;
        }

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

    console.log("✅ Buyer:", buyer);
    console.log("✅ Token:", tokenMint);
    console.log("✅ Token amount:", tokenAmount);
    console.log("✅ Spent in SOL:", solSpent);

    if (!buyer || !tokenMint || !tokenAmount || !solSpent) {
      console.log("⚠️ Dati incompleti o non è un BUY.");
      return res.status(200).json({ status: 'not a buy or incomplete data' });
    }

    const amountFormatted = (Number(tokenAmount) / Math.pow(10, decimals)).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    });

    const solFormatted = `~${solSpent.toFixed(4)} SOL`;

    const content = `🆕 Buy detected on InternetMoneyMafia\n` +
      `💰 Buyer: ${buyer}\n` +
      `📦 Token: ${tokenMint}\n` +
      `📊 Amount: ${amountFormatted}\n` +
      `💵 Spent: ${solFormatted}`;

    const discordWebhookURL = "https://discord.com/api/webhooks/1364346213402546240/QKSJ3TTP6t31POZRovyn4XtMCEqw2wwCxDUJoF1xCG2h6HYOc-BMG8T5VSs7BLIQIC9l";

    const response = await fetch(discordWebhookURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    console.log("✅ Messaggio inviato a Discord");

    return res.status(200).json({ status: 'ok' });

  } catch (err) {
    console.error("❌ Errore nella funzione webhook:", err.message);
    console.error(err.stack);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
