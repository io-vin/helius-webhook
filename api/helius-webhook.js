export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // 👇 LOG FONDAMENTALE: copia e incolla su console e qui in chat
    console.log("🔥 PAYLOAD GREZZO 🔥", JSON.stringify(payload, null, 2));

    return res.status(200).json({ message: 'Payload ricevuto', payloadType: typeof payload });
  } catch (err) {
    console.error("❌ Errore nella funzione webhook:", err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
