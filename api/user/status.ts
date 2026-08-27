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
    const userEmail = (req.query?.email || '') as string;
    if (!userId && !userEmail) {
      return res.status(400).json({ error: 'userId or email is required' });
    }

    const client = getSupabaseAdmin();
    if (!client) {
      return res.status(200).json({ profile: null, application: null });
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

    return res.status(200).json({ profile, application });
  } catch (err: any) {
    console.error('Error fetching user status:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch status' });
  }
}
