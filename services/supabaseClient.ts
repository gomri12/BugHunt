import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://owkiedqwocevobswbfge.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93a2llZHF3b2Nldm9ic3diZmdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNTU4NzksImV4cCI6MjA4MDkzMTg3OX0.yxs3JwAdgZmMJbJcwCTrhG29Kl4mQtVl6FoVDErrtYk';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


