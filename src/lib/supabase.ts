import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if we have valid Supabase credentials
const hasValidCredentials = 
  supabaseUrl && 
  supabaseUrl !== 'https://your-project.supabase.co' && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'your_supabase_anon_key_here';

if (!hasValidCredentials) {
  console.warn('⚠️ Supabase credentials not configured. Please set up your .env file with valid Supabase URL and Anon Key.');
  console.warn('📝 Check the .env.example file for setup instructions.');
}

// Create Supabase client with fallback URL for development
export const supabase = createClient(
  hasValidCredentials ? supabaseUrl : 'https://placeholder.supabase.co',
  hasValidCredentials ? supabaseAnonKey : 'placeholder-key'
);
