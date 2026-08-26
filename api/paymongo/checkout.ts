import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, description, remarks } = req.body || {};
    const secretKey = process.env.PAYMONGO_SECRET_KEY;

    if (!secretKey) {
      return res.status(400).json({ 
        error: 'PAYMONGO_SECRET_KEY is not configured in Vercel environment variables. Please add PAYMONGO_SECRET_KEY in Vercel project settings.' 
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required.' });
    }

    const response = await fetch('https://api.paymongo.com/v1/links', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: Math.round(Number(amount) * 100), // Paymongo accepts amounts in cents
            description: description || 'B&B Trinkets Purchase',
            remarks: remarks || ''
          }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.errors?.[0]?.detail || 'Failed to create Paymongo link',
        details: data
      });
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Paymongo checkout serverless error:', error);
    return res.status(500).json({ error: error.message || 'Payment link creation failed' });
  }
}
