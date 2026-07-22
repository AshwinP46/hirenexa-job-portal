// Supabase client — browser/client-side singleton with hardcoded production fallbacks.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const DEFAULT_SUPABASE_URL = "https://tvwntkdzosfbgjjhpxrb.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_QdTrcaDXnwVPu0MN_Y1QGQ_nhshIpWM";

function createSupabaseClient() {
  const SUPABASE_URL = 
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 
    (typeof process !== "undefined" && process.env && process.env.SUPABASE_URL) || 
    DEFAULT_SUPABASE_URL;

  const SUPABASE_PUBLISHABLE_KEY = 
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) || 
    (typeof process !== "undefined" && process.env && process.env.SUPABASE_PUBLISHABLE_KEY) || 
    DEFAULT_SUPABASE_KEY;

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
