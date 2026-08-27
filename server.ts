import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

// Lazy initialize Supabase server client
function getSupabaseServer() {
  const rawUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const supabaseUrl = rawUrl.replace(/\/+$/, '');
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.VITE_SUPABASE_ANON_KEY || 
    process.env.SUPABASE_ANON_KEY || 
    ''
  ).trim();

  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON parser for API routes
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Admin Seller Applications: Action (Approve / Reject)
  app.post('/api/admin/applications/action', async (req, res) => {
    try {
      const { applicationId, userId, action, notes, callerEmail } = req.body || {};

      if (!applicationId || !userId || !action) {
        return res.status(400).json({ error: 'Missing required parameters (applicationId, userId, action).' });
      }

      const client = getSupabaseServer();
      const now = new Date().toISOString();
      const isApproved = action === 'approve';
      const targetStatus = isApproved ? 'approved' : 'rejected';
      const reviewNotes = notes || (isApproved ? 'Application approved by administrator.' : 'Application declined by administrator.');

      if (client) {
        // 1. Update seller_applications table
        await client
          .from('seller_applications')
          .update({
            status: targetStatus,
            review_notes: reviewNotes,
            reviewed_at: now
          })
          .eq('id', applicationId);

        // 2. Update user profiles table
        await client
          .from('profiles')
          .update({
            seller_status: targetStatus,
            role: isApproved ? 'seller' : 'buyer',
            updated_at: now
          })
          .eq('id', userId);
      }

      return res.json({
        success: true,
        status: targetStatus,
        applicationId,
        userId,
        reviewed_at: now
      });
    } catch (err: any) {
      console.error('Error processing application action:', err);
      return res.status(500).json({ error: err.message || 'Failed to update application status.' });
    }
  });

  // User: Check verification & profile status safely
  app.get('/api/user/status', async (req, res) => {
    try {
      const userId = (req.query.userId || '') as string;
      const userEmail = (req.query.email || '') as string;
      if (!userId && !userEmail) {
        return res.status(400).json({ error: 'userId or email is required' });
      }

      const client = getSupabaseServer();
      if (!client) {
        return res.json({ profile: null, application: null });
      }

      let profileQuery = client.from('profiles').select('*');
      if (userId) profileQuery = profileQuery.eq('id', userId);
      else if (userEmail) profileQuery = profileQuery.ilike('email', userEmail);

      let appQuery = client.from('seller_applications').select('*');
      if (userId) appQuery = appQuery.eq('user_id', userId);
      else if (userEmail) appQuery = appQuery.ilike('email', userEmail);

      const [{ data: profile }, { data: application }] = await Promise.all([
        profileQuery.maybeSingle(),
        appQuery.order('applied_at', { ascending: false }).limit(1).maybeSingle()
      ]);

      return res.json({
        profile: profile || null,
        application: application || null
      });
    } catch (err: any) {
      console.error('Error fetching user status:', err);
      return res.status(500).json({ error: err.message || 'Failed to fetch status' });
    }
  });

  // User: Acknowledge declined twin access and convert to collector account
  app.post('/api/user/acknowledge-declined', async (req, res) => {
    try {
      const { userId } = req.body || {};
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const client = getSupabaseServer();
      const now = new Date().toISOString();

      if (client) {
        // 1. Update user profile to regular collector
        await client
          .from('profiles')
          .update({
            role: 'buyer',
            seller_status: 'none',
            updated_at: now
          })
          .eq('id', userId);

        // 2. Remove or mark archived in seller_applications so it no longer triggers pending/rejected checks
        await client
          .from('seller_applications')
          .delete()
          .eq('user_id', userId);
      }

      return res.json({
        success: true,
        message: 'Account converted to collector successfully.',
        role: 'buyer',
        seller_status: 'none'
      });
    } catch (err: any) {
      console.error('Error acknowledging declined access:', err);
      return res.status(500).json({ error: err.message || 'Failed to convert account' });
    }
  });

  // User: Permanently delete account and all associated records from Supabase
  app.post('/api/user/delete-account', async (req, res) => {
    try {
      const { userId } = req.body || {};
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const authHeader = req.headers.authorization;
      const client = getSupabaseServer();

      // 1. Try deleting via RPC if token is available
      let rpcSuccess = false;
      if (authHeader) {
        try {
          const rawUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/+$/, '');
          const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
          if (rawUrl && anonKey) {
            const userClient = createClient(rawUrl, anonKey, {
              global: { headers: { Authorization: authHeader } }
            });
            const { error: rpcErr } = await userClient.rpc('delete_user_account');
            if (!rpcErr) {
              rpcSuccess = true;
            }
          }
        } catch (rpcE) {
          console.warn('RPC deletion note in server.ts:', rpcE);
        }
      }

      if (!rpcSuccess && client) {
        // 2. Delete user reviews
        await client.from('reviews').delete().eq('user_id', userId);

        // 3. Delete buyer orders and order items
        const { data: userOrders } = await client.from('orders').select('id').eq('buyer_id', userId);
        if (userOrders && userOrders.length > 0) {
          const orderIds = userOrders.map((o: any) => o.id);
          await client.from('order_items').delete().in('order_id', orderIds);
          await client.from('orders').delete().eq('buyer_id', userId);
        }

        // 4. Delete user seller products if any
        await client.from('products').delete().eq('seller_id', userId);

        // 5. Delete seller applications
        await client.from('seller_applications').delete().eq('user_id', userId);

        // 6. Delete profile record
        await client.from('profiles').delete().eq('id', userId);

        // 7. Delete from Supabase Auth via admin API if available
        try {
          if (client.auth && client.auth.admin && typeof client.auth.admin.deleteUser === 'function') {
            await client.auth.admin.deleteUser(userId);
          }
        } catch (authAdminErr) {
          console.warn('Supabase auth.admin.deleteUser warning (requires SUPABASE_SERVICE_ROLE_KEY):', authAdminErr);
        }
      }

      return res.json({
        success: true,
        message: 'Account and associated records deleted permanently from Supabase.'
      });
    } catch (err: any) {
      console.error('Error deleting user account:', err);
      return res.status(500).json({ error: err.message || 'Failed to delete account' });
    }
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
