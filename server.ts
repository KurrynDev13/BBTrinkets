import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON parser for API routes, EXCEPT for Paymongo webhook which needs raw body for signature verification if strictly implemented.
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Paymongo: Create a Checkout Link
  app.post('/api/paymongo/checkout', async (req, res) => {
    try {
      const { amount, description, remarks } = req.body || {};
      const secretKey = process.env.PAYMONGO_SECRET_KEY;

      if (!secretKey) {
        return res.status(400).json({ error: 'PAYMONGO_SECRET_KEY is not configured on the server. Please add it to your environment variables.' });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'A valid amount is required.' });
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

      res.json(data);
    } catch (error: any) {
      console.error('Paymongo checkout error:', error);
      res.status(500).json({ error: error.message || 'Payment link creation failed' });
    }
  });

  // Paymongo: Verify Link Status
  app.get('/api/paymongo/verify-link', async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) {
        return res.status(400).json({ error: 'PayMongo Link ID is required.' });
      }

      const secretKey = process.env.PAYMONGO_SECRET_KEY;
      if (!secretKey) {
        return res.status(400).json({ error: 'PAYMONGO_SECRET_KEY is not configured on the server.' });
      }

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
      res.json({
        id: data.data?.id,
        status: attr.status,
        amount: attr.amount ? attr.amount / 100 : 0,
        description: attr.description,
        payments: attr.payments || [],
        paid_at: attr.paid_at || (attr.payments?.[0]?.attributes?.paid_at)
      });
    } catch (error: any) {
      console.error('PayMongo verify link error:', error);
      res.status(500).json({ error: error.message || 'Payment verification failed' });
    }
  });

  // Paymongo Webhook Endpoint
  app.post('/api/paymongo/webhook', (req, res) => {
    console.log('Received Paymongo Webhook:', req.body);
    // In a real application, verify the webhook signature here using req.headers['paymongo-signature']
    
    const event = req.body.data;
    if (event && event.type === 'link.payment.paid') {
      const paymentInfo = event.attributes.data;
      console.log(`Payment successful for link: ${paymentInfo.attributes.description}, Amount: ${paymentInfo.attributes.amount}`);
      // Here you would typically update the Supabase 'orders' table to set status = 'paid'
    }

    res.status(200).send('Webhook received');
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
