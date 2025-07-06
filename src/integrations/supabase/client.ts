
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cidirsnetnzdngzykesu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpZGlyc25ldG56ZG5nenlrZXN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxODUxNDEsImV4cCI6MjA1MTc2MTE0MX0.4_HcKtmBvUoM0Qm7dBXN1RzYA3EwJ8pLs2Fg6IuTcVk';

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
