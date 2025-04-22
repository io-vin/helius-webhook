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

    console.log("📦 Raw buffer length:", rawBody.length);
    console.log("📦 Raw buffer (hex):", rawBody.toString('hex'));
    console.log("📦 Raw buffer (utf8):", rawBody.toString('utf8'));

    return res.status(200).json({ message: 'Logged raw body for inspection' });

  } catch (err) {
    console.error("❌ Crash:", err.message);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
