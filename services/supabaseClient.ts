import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error(
    'Missing Supabase env vars: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) in the build environment / GitHub Actions secrets.'
  );
}

// Avoid crashing the whole app (blank screen) when env vars are missing at build time.
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (new Proxy(
      {},
      {
        get() {
          throw new Error(
            'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) as GitHub Actions secrets, then redeploy.'
          );
        },
      }
    ) as SupabaseClient);
