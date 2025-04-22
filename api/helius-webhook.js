export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const authHeader = req.headers['authorization'];
    if (authHeader !== 'our') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    console.log('Ricevuto webhook da Helius:', req.body);
  
    // Qui puoi fare altro, tipo salvare su database, inviare alert, ecc.
  
    return res.status(200).json({ status: 'ok' });
  }
  