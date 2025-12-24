import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use the variable name exactly as it appears in your .env.local
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY; 

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // This captures the session after the refresh
    flowType: 'pkce',         // This ensures a more reliable login on localhost
  }
});