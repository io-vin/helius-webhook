import { buffer } from 'micro';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const rawBody = await buffer(req);
    const bodyText = rawBody.toString('utf8').trim();

    console.log("📦 Raw buffer length:", rawBody.length);
    console.log("📦 Raw buffer (utf8):", bodyText);

    if (!bodyText || bodyText.length < 5) {
      return res.status(400).json({
        error: 'Empty or invalid JSON body',
        length: rawBody.length,
        contentType: req.headers['content-type'] || 'N/A',
      });
    }

    let payload;
    try {
      payload = JSON.parse(bodyText);
    } catch (err) {
      console.error("❌ JSON parse error:", err.message);
      return res.status(400).json({ error: 'Invalid JSON format', body: bodyText });
    }

    if (!Array.isArray(payload) || !payload[0]?.accountData) {
      console.log("❌ Payload format not valid:", JSON.stringify(payload, null, 2));
      return res.status(400).json({ error: 'Invalid payload format: expected array with accountData' });
    }

    const accountData = payload[0].accountData;

    const excludedMints = [
      'So11111111111111111111111111111111111111112',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
    ];

    let buyer = null;
    let tokenMint = null;
    let tokenAmount = null;
    let decimals = null;
    let solSpent = null;

    for (const acc of accountData) {
      if (acc.tokenBalanceChanges && acc.tokenBalanceChanges.length > 0) {
        const tokenInfo = acc.tokenBalanceChanges[0];

        if (excludedMints.includes(tokenInfo.mint)) {
          return res.status(200).json({ status: 'ignored excluded token' });
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

    if (!buyer || !tokenMint || !tokenAmount || !solSpent) {
      return res.status(200).json({ status: 'not a buy or incomplete data' });
    }

    const amountFormatted = (Number(tokenAmount) / Math.pow(10, decimals)).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    });

    const solFormatted = `~${solSpent.toFixed(4)} SOL`;

    const tokenEmbed = {
      title: '🆕 Token detect by InternetMoneyMafia',
      color: 0x00ff00,
      fields: [
        {
          name: 'Contract Address',
          value: `\`\`\`\n${tokenMint}\n\`\`\``,
        },
        {
          name: 'Buyer',
          value: buyer,
        },
        {
          name: 'Amount',
          value: `${amountFormatted}`,
        },
        {
          name: 'Spent',
          value: solFormatted,
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Ouro Bot'
      }
    };

    const pnlEmbed = {
      title: '📈 New Trade Registered',
      color: 0x3498db,
      fields: [
        { name: 'Buyer', value: buyer },
        { name: 'Token', value: tokenMint },
        { name: 'Amount', value: amountFormatted },
        { name: 'Spent (SOL)', value: solFormatted }
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'PnL Tracker' }
    };

    const tokenWebhookURL = "https://discord.com/api/webhooks/1364346213402546240/QKSJ3TTP6t31POZRovyn4XtMCEqw2wwCxDUJoF1xCG2h6HYOc-BMG8T5VSs7BLIQIC9l";
    const pnlWebhookURL = "https://discord.com/api/webhooks/1364588645641879602/UscCZVbcMbol-IhZ0OM_1dj1fhS6IGe9YNKnHNt8CtWpXozMfVm5UU0f9SfdptbUquBo";

    await fetch(tokenWebhookURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [tokenEmbed] }),
    });

    await fetch(pnlWebhookURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [pnlEmbed] }),
    });

    return res.status(200).json({ status: 'ok' });

  } catch (err) {
    console.error("❌ Errore nella funzione webhook:", err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
