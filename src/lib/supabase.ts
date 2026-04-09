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
  console.warn('⚠️ Supabase credentials not configured. Please set up your .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  console.warn('📝 Check the .env.example file for setup instructions.');
}

// "Remember Me" preference key
const REMEMBER_ME_KEY = 'motif-remember-me';
const AUTH_STORAGE_KEY = 'motif-auth';

/** Set the remember-me preference (call before sign-in) */
export function setRememberMe(value: boolean) {
  localStorage.setItem(REMEMBER_ME_KEY, value ? 'true' : 'false');

  // If switching to "don't remember", move session from localStorage to sessionStorage
  if (!value) {
    const existing = localStorage.getItem(AUTH_STORAGE_KEY);
    if (existing) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, existing);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } else {
    // If switching to "remember", move session from sessionStorage to localStorage
    const existing = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (existing) {
      localStorage.setItem(AUTH_STORAGE_KEY, existing);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }
}

/** Read current remember-me preference (defaults to true) */
export function getRememberMe(): boolean {
  return localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
}

// Custom storage adapter: uses localStorage when "remember me" is on,
// sessionStorage when off. This lets the session expire on browser close.
const authStorage = {
  getItem: (key: string): string | null => {
    return getRememberMe()
      ? localStorage.getItem(key)
      : sessionStorage.getItem(key) ?? localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (getRememberMe()) {
      localStorage.setItem(key, value);
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
      localStorage.removeItem(key);
    }
  },
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

// Create Supabase client with session persistence
export const supabase = createClient(
  hasValidCredentials ? supabaseUrl : 'https://placeholder.supabase.co',
  hasValidCredentials ? supabaseAnonKey : 'placeholder-key',
  {
    auth: {
      persistSession: true,
      storageKey: AUTH_STORAGE_KEY,
      storage: authStorage,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Export a flag so UI can block sign-in when credentials are missing
export const supabaseConfigured = hasValidCredentials;

// Export the Supabase URL for storage URL construction
export const supabasePublicUrl = supabaseUrl;

/**
 * Resolve a case study image to a full public URL.
 *
 * Edge cases handled:
 * - null / undefined / empty string → null
 * - whitespace-only string → null
 * - already a full http/https URL → returned as-is (no double-wrapping)
 * - bare filename or path → constructed from VITE_SUPABASE_URL
 * - VITE_SUPABASE_URL not configured → null + console.warn (avoids broken URL)
 */
export function getCaseStudyImageUrl(image?: string | null): string | null {
  if (!image) return null;

  const trimmed = image.trim();
  if (!trimmed) return null;

  // Already a full URL — return unchanged
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) return trimmed;

  // Need the base URL to construct a storage path
  if (!supabaseUrl) {
    console.warn('[getCaseStudyImageUrl] VITE_SUPABASE_URL is not set; cannot resolve image:', trimmed);
    return null;
  }

  // Strip any accidental leading slash so we never end up with double slashes
  const path = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  return `${supabaseUrl}/storage/v1/object/public/case-studies/${path}`;
}
