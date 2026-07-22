// Supabase client — browser/client-side singleton.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const DEFAULT_SUPABASE_URL = "https://tvwntkdzosfbgjjhpxrb.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_QdTrcaDXnwVPu0MN_Y1QGQ_nhshIpWM";

const SUPABASE_URL = 
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 
  (typeof process !== "undefined" && process.env && process.env.SUPABASE_URL) || 
  DEFAULT_SUPABASE_URL;

const SUPABASE_PUBLISHABLE_KEY = 
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) || 
  (typeof process !== "undefined" && process.env && process.env.SUPABASE_PUBLISHABLE_KEY) || 
  DEFAULT_SUPABASE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
});
