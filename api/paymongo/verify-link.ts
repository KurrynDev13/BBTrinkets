export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query || {};

  if (!id) {
    return res.status(400).json({ error: 'PayMongo Link ID is required.' });
  }

  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey) {
    return res.status(400).json({ error: 'PAYMONGO_SECRET_KEY is not configured.' });
  }

  try {
    const response = await fetch(`https://api.paymongo.com/v1/links/${id}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.errors?.[0]?.detail || 'Failed to verify PayMongo link',
        details: data
      });
    }

    const attr = data.data?.attributes || {};
    return res.status(200).json({
      id: data.data?.id,
      status: attr.status, // 'paid', 'unpaid', etc.
      amount: attr.amount ? attr.amount / 100 : 0,
      description: attr.description,
      payments: attr.payments || [],
      paid_at: attr.paid_at || (attr.payments?.[0]?.attributes?.paid_at)
    });
  } catch (error: any) {
    console.error('PayMongo verify link error:', error);
    return res.status(500).json({ error: error.message || 'Payment verification failed' });
  }
}
