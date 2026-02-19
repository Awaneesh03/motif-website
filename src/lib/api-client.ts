import { supabase } from './supabase';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
console.log('[ApiClient] Backend URL:', BACKEND_URL);

/**
 * API Client for communicating with the Java Spring Boot backend
 * Handles authentication, error handling, and request/response formatting
 */
class ApiClient {
  /**
   * Get the current Supabase auth token
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Make an authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    console.log('[ApiClient] Token available:', !!token);

    if (!token) {
      throw new Error('Authentication required. Please login first.');
    }

    const url = `${BACKEND_URL}${endpoint}`;
    console.log('[ApiClient] Making request to:', url);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`
        }));

        throw new Error(errorData.message || 'Request failed');
      }

      // Parse JSON response
      const data = await response.json();
      return data as T;

    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      if (error instanceof Error) {
        // Re-throw with more context if it's a generic error
        if (error.message === 'Failed to fetch') {
          throw new Error('Failed to fetch - backend server may be unavailable');
        }
        throw error;
      }
      throw new Error('An unexpected error occurred - backend may be unavailable');
    }
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Type definitions for API responses
export interface AnalysisResponse {
  analysisId: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  marketSize: string;
  competition: string;
  viability: string;
  timestamp: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  timestamp: string;
}

export interface IdeaResponse {
  title: string;
  description: string;
  targetMarket: string;
}

export interface CaseEvaluationResponse {
  score: number;
  verdict: string;
  feedback: string[];
  strengths: string[];
  improvements: string[];
  timestamp?: string;
}

export interface PitchSlideContent {
  title: string;
  content: string;
  bulletPoints: string[];
}

export interface PitchResponse {
  slides: PitchSlideContent[];
  speakerNotes: string;
}
