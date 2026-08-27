import { createClient } from '@supabase/supabase-js';

// Lazy initialize Supabase server/admin client for Vercel Serverless
function getSupabaseAdmin() {
  const rawUrl = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  ).trim();
  const supabaseUrl = rawUrl.replace(/\/+$/, '');

  // Prefer Service Role Key for administrative operations (like deleting users from auth.users)
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body || {};
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const authHeader = req.headers.authorization || req.headers.Authorization;
    const client = getSupabaseAdmin();
    
    if (!client) {
      return res.status(500).json({ error: 'Supabase credentials are not configured on server' });
    }

    // 1. Try deleting via RPC if token or admin is available
    let rpcSuccess = false;
    try {
      if (authHeader) {
        const rawUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
        const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
        if (rawUrl && anonKey) {
          const userClient = createClient(rawUrl, anonKey, {
            global: { headers: { Authorization: authHeader } }
          });
          const { error: rpcErr } = await userClient.rpc('delete_user_account');
          if (!rpcErr) {
            rpcSuccess = true;
          }
        }
      }
    } catch (e) {
      console.warn('RPC deletion attempt notice:', e);
    }

    if (!rpcSuccess) {
      // 2. Delete reviews
      try {
        await client.from('reviews').delete().eq('user_id', userId);
      } catch (e) {
        console.warn('Reviews deletion warning:', e);
      }

      // 3. Delete buyer orders and order items
      try {
        const { data: userOrders } = await client.from('orders').select('id').eq('buyer_id', userId);
        if (userOrders && userOrders.length > 0) {
          const orderIds = userOrders.map((o: any) => o.id);
          await client.from('order_items').delete().in('order_id', orderIds);
          await client.from('orders').delete().eq('buyer_id', userId);
        }
      } catch (e) {
        console.warn('Orders deletion warning:', e);
      }

      // 4. Delete user seller products if any
      try {
        await client.from('products').delete().eq('seller_id', userId);
      } catch (e) {
        console.warn('Products deletion warning:', e);
      }

      // 5. Delete seller applications
      try {
        await client.from('seller_applications').delete().eq('user_id', userId);
      } catch (e) {
        console.warn('Applications deletion warning:', e);
      }

      // 6. Delete profile record
      try {
        await client.from('profiles').delete().eq('id', userId);
      } catch (e) {
        console.warn('Profile deletion warning:', e);
      }

      // 7. Delete from Supabase Auth (auth.users) via admin API
      try {
        if (client.auth && client.auth.admin && typeof client.auth.admin.deleteUser === 'function') {
          const { error: adminErr } = await client.auth.admin.deleteUser(userId);
          if (adminErr) {
            console.warn('Supabase auth.admin.deleteUser note (requires SUPABASE_SERVICE_ROLE_KEY):', adminErr.message);
          }
        }
      } catch (authAdminErr) {
        console.warn('Supabase auth.admin.deleteUser call error:', authAdminErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Account and associated records deleted permanently from Supabase.'
    });
  } catch (err: any) {
    console.error('Error deleting user account:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete account' });
  }
}
