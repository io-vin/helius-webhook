export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || authHeader !== 'our') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('✅ Webhook ricevuto da Helius:', JSON.stringify(req.body, null, 2));

  // Risponde stampando a video il payload
  return res.status(200).json({
    status: 'ok',
    data: req.body,
  });
}
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Log degli header ricevuti per debug
  console.log("Headers ricevuti:", req.headers);

  // Supporta sia lowercase che uppercase
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || authHeader !== 'our') {
    console.log("Auth fallita. Header ricevuto:", authHeader);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('✅ Webhook ricevuto da Helius:', JSON.stringify(req.body, null, 2));

  // Puoi aggiungere qui qualsiasi altra logica (es. salvataggio su DB)

  return res.status(200).json({ status: 'ok' });
}
