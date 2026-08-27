import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const rawUrl = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  ).trim();
  const supabaseUrl = rawUrl.replace(/\/+$/, '');

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
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
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
    const { userId } = req.body || {};
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const client = getSupabaseAdmin();
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

      // 2. Remove seller application so it no longer triggers pending/rejected checks
      await client
        .from('seller_applications')
        .delete()
        .eq('user_id', userId);
    }

    return res.status(200).json({
      success: true,
      message: 'Account converted to collector successfully.',
      role: 'buyer',
      seller_status: 'none'
    });
  } catch (err: any) {
    console.error('Error acknowledging declined access:', err);
    return res.status(500).json({ error: err.message || 'Failed to convert account' });
  }
}
