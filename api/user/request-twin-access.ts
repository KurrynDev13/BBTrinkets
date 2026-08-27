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
    const { 
      userId, 
      email, 
      fullName, 
      gcash, 
      shopName, 
      craftCategory, 
      portfolioUrl, 
      bio 
    } = req.body || {};

    if (!userId || !email) {
      return res.status(400).json({ error: 'userId and email are required.' });
    }

    const client = getSupabaseAdmin();
    const now = new Date().toISOString();
    const isAdmin = email.trim().toLowerCase() === 'rhymnoorioque@gmail.com';
    const targetStatus = isAdmin ? 'approved' : 'pending';
    const cleanFullName = fullName?.trim() || email.split('@')[0];
    const cleanShop = shopName?.trim() || 'B&B Twin Artists Studio';
    const cleanCategory = craftCategory?.trim() || 'Pins & Artwork';
    const cleanGcash = gcash?.trim() || '09000000000';

    let savedProfile = null;
    let savedApplication = null;

    if (client) {
      // 1. Upsert Profile
      const { data: profData, error: profErr } = await client
        .from('profiles')
        .upsert({
          id: userId,
          role: 'seller',
          email: email.trim(),
          full_name: cleanFullName,
          gcash_number: cleanGcash,
          seller_status: targetStatus,
          is_admin: isAdmin,
          shop_name: cleanShop,
          craft_category: cleanCategory,
          portfolio_url: portfolioUrl?.trim() || '',
          bio: bio?.trim() || '',
          updated_at: now
        })
        .select()
        .maybeSingle();

      if (profErr) {
        console.warn('Profile upsert warning:', profErr.message);
      } else {
        savedProfile = profData;
      }

      // 2. Upsert Seller Application (if not admin)
      if (!isAdmin) {
        // Check existing application
        const { data: existingApp } = await client
          .from('seller_applications')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (existingApp?.id) {
          const { data: updatedApp, error: appErr } = await client
            .from('seller_applications')
            .update({
              full_name: cleanFullName,
              email: email.trim(),
              gcash_number: cleanGcash,
              shop_name: cleanShop,
              craft_category: cleanCategory,
              portfolio_url: portfolioUrl?.trim() || '',
              bio_or_experience: bio?.trim() || '',
              status: 'pending',
              applied_at: now
            })
            .eq('id', existingApp.id)
            .select()
            .maybeSingle();

          if (!appErr) savedApplication = updatedApp;
        } else {
          const { data: newApp, error: appErr } = await client
            .from('seller_applications')
            .insert({
              user_id: userId,
              full_name: cleanFullName,
              email: email.trim(),
              gcash_number: cleanGcash,
              shop_name: cleanShop,
              craft_category: cleanCategory,
              portfolio_url: portfolioUrl?.trim() || '',
              bio_or_experience: bio?.trim() || '',
              status: 'pending',
              applied_at: now
            })
            .select()
            .maybeSingle();

          if (!appErr) savedApplication = newApp;
        }
      }

      // 3. Update auth user metadata if possible
      try {
        if (client.auth && client.auth.admin && typeof client.auth.admin.updateUserById === 'function') {
          await client.auth.admin.updateUserById(userId, {
            user_metadata: {
              role: 'seller',
              seller_status: targetStatus,
              full_name: cleanFullName,
              shop_name: cleanShop,
              craft_category: cleanCategory
            }
          });
        }
      } catch (authErr) {
        console.warn('Auth admin update metadata warning:', authErr);
      }
    }

    return res.status(200).json({
      success: true,
      status: targetStatus,
      profile: savedProfile,
      application: savedApplication
    });
  } catch (err: any) {
    console.error('Error submitting twin access request:', err);
    return res.status(500).json({ error: err.message || 'Failed to submit twin access request' });
  }
}
