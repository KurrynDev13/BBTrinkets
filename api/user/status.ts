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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const userId = (req.query?.userId || '') as string;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const client = getSupabaseAdmin();
    if (!client) {
      return res.status(200).json({ profile: null, application: null });
    }

    const [{ data: profile }, { data: application }] = await Promise.all([
      client.from('profiles').select('*').eq('id', userId).maybeSingle(),
      client.from('seller_applications').select('*').eq('user_id', userId).maybeSingle()
    ]);

    return res.status(200).json({ profile, application });
  } catch (err: any) {
    console.error('Error fetching user status:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch status' });
  }
}
