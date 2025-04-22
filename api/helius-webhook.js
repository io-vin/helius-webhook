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

    // Logga headers per capire il Content-Type ricevuto
    console.log("🔍 HEADERS:", req.headers);

    // Ricevi il body grezzo
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
      return res.status(400).json({ error: 'Invalid JSON', body: bodyText });
    }

    // Mostra struttura per capire cosa contiene
    return res.status(200).json({
      message: 'Parsed successfully',
      keys: Object.keys(payload),
      preview: JSON.stringify(payload).slice(0, 500),
    });

  } catch (err) {
    console.error("❌ Fatal error:", err.message);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
