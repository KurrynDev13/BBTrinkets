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
    const { applicationId, userId, action, notes } = req.body || {};

    if (!applicationId || !userId || !action) {
      return res.status(400).json({ error: 'Missing required parameters (applicationId, userId, action).' });
    }

    const client = getSupabaseAdmin();
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

    return res.status(200).json({
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
}
