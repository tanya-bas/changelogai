
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dynamic-responder.supabase.co';
const supabaseAnonKey = 'your-new-anon-key-here'; // You'll need to get this from your Supabase dashboard

// Get the current origin, fallback to a default if not available
const getRedirectUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/email-confirmed`;
  }
  // Fallback URL - you should replace this with your actual deployed URL
  return 'https://your-app.lovable.app/email-confirmed';
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Re-enable this to handle email confirmation
    flowType: 'pkce' // Use PKCE flow for better security
  }
});

// Export the redirect URL for use in signup
export const emailRedirectUrl = getRedirectUrl();
