// API configuration for backend integration
import { supabase } from './supabase';

export const API_CONFIG = {
  // Development
  DEV_URL: 'http://localhost:8080',

  // Production (update this with your deployed backend URL)
  PROD_URL: import.meta.env.VITE_BACKEND_URL || 'https://your-backend-url.com',

  get baseURL() {
    return import.meta.env.DEV ? this.DEV_URL : this.PROD_URL;
  },

  endpoints: {
    chat: '/api/ai/chat',
    analyzeIdea: '/api/ai/analyze-idea',
    generateIdea: '/api/ai/generate-idea',
    improveDescription: '/api/ai/improve-description',
    generatePitch: '/api/ai/generate-pitch',
  }
};

/**
 * Helper to get auth headers with Supabase JWT token
 * @returns Headers with Authorization bearer token
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated. Please login to continue.');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  };
}
