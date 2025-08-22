import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

console.log('Supabase Config:', { 
  url: url ? 'SET' : 'MISSING', 
  anonKey: anonKey ? 'SET' : 'MISSING',
  fullUrl: url,
  keyLength: anonKey?.length 
});

export const supabase = url && anonKey ? createClient(url, anonKey) : null;




