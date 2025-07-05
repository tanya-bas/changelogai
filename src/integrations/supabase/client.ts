
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cidirsnetnzdngzykesu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpZGlyc25ldG56ZG5nenlrZXN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NDE3NjcsImV4cCI6MjA2NzMxNzc2N30.9cZtDvReRDlNUVjbntfROUgpn2_07HOrwEzXV8xTtFg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
