export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!payload || !Array.isArray(payload.accountData)) {
      return res.status(400).json({ error: 'Invalid payload format: expected "accountData" as an array' });
    }

    const accountData = payload.accountData;

    let buyer = null;
    let tokenMint = null;
    let tokenAmount = null;
    let decimals = null;
    let solSpent = null;

    for (const acc of accountData) {
      if (acc.tokenBalanceChanges && acc.tokenBalanceChanges.length > 0) {
        const tokenInfo = acc.tokenBalanceChanges[0];
        buyer = tokenInfo.userAccount;
        tokenMint = tokenInfo.mint;
        tokenAmount = tokenInfo.rawTokenAmount.tokenAmount;
        decimals = tokenInfo.rawTokenAmount.decimals;
      }

      if (acc.account === buyer && acc.nativeBalanceChange < 0) {
        solSpent = Math.abs(acc.nativeBalanceChange) / 1e9;
      }
    }

    if (!buyer || !tokenMint || !tokenAmount) {
      return res.status(400).json({ error: 'Missing required token transfer info' });
    }

    const amountFormatted = (Number(tokenAmount) / Math.pow(10, decimals)).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    });

    const solFormatted = solSpent ? `~${solSpent.toFixed(4)} SOL` : 'N/A';

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

    return res.status(200).json({ status: 'ok' });

  } catch (err) {
    console.error("❌ Errore nella funzione webhook:", err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
