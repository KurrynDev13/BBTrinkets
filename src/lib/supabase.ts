import { createClient } from '@supabase/supabase-js';

// Normalize URL in case /rest/v1, /auth/v1, or trailing slashes were included by accident
const rawUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co').trim();
const supabaseUrl = rawUrl
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/auth\/v1\/?$/i, '')
  .replace(/\/+$/, '');

const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key').trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

