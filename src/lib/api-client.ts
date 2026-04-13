import { supabase } from './supabase';

// Use environment variable in production, localhost fallback only in dev
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.DEV ? 'http://localhost:8080' : '');
if (import.meta.env.DEV) console.log('[ApiClient] Backend URL:', BACKEND_URL);

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
    options: RequestInit = {},
    timeoutMs: number = 30000,  // Default 30s timeout
    externalSignal?: AbortSignal
  ): Promise<T> {
    const token = await this.getAuthToken();

    if (!token) {
      throw new Error('Authentication required. Please login first.');
    }

    // Bail immediately if the caller already cancelled before we even started
    if (externalSignal?.aborted) {
      throw new DOMException('Request cancelled by user.', 'AbortError');
    }

    const url = `${BACKEND_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    // Create AbortController for timeout; also forward external cancellation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const onExternalAbort = () => controller.abort();
    externalSignal?.addEventListener('abort', onExternalAbort);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', onExternalAbort);

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
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', onExternalAbort);
      if (import.meta.env.DEV) console.error(`API request failed: ${endpoint}`, error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          // Distinguish user-cancelled from server timeout
          if (externalSignal?.aborted) {
            throw new DOMException('Request cancelled by user.', 'AbortError');
          }
          throw new Error('Request timed out. The AI analysis is taking longer than expected. Please try again.');
        }
        // Re-throw with more context if it's a generic error
        if (error.message === 'Failed to fetch') {
          throw new Error('Failed to fetch - backend server may be unavailable. Please try again in a few seconds.');
        }
        throw error;
      }
      throw new Error('An unexpected error occurred - backend may be unavailable');
    }
  }

  /**
   * POST request that does NOT require authentication.
   * Use for public endpoints like /api/contact.
   */
  async publicPost<T>(endpoint: string, body: unknown, timeoutMs = 10_000): Promise<T> {
    const url = `${BACKEND_URL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(errorData.message || 'Request failed');
      }
      return response.json() as Promise<T>;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  }

  /**
   * POST request.
   * Automatically retries on cold-start "Failed to fetch" errors (server sleeping).
   * onWakeUp is called before each retry so the UI can update its status message.
   *
   * Retry schedule: 8 s → 15 s → 20 s (3 attempts total after the first failure).
   * During each wait, aborts immediately if the external signal fires.
   */
  async post<T>(
    endpoint: string,
    body: any,
    timeoutMs?: number,
    signal?: AbortSignal,
    onWakeUp?: (attempt: number, totalAttempts: number) => void
  ): Promise<T> {
    const RETRY_DELAYS = [8_000, 15_000, 20_000];
    const isColdStart = (e: unknown) =>
      e instanceof Error &&
      (e.message === 'Failed to fetch' ||
        e.message.includes('Failed to fetch') ||
        e.message.includes('backend server may be unavailable') ||
        e.message.includes('NetworkError') ||
        e.message.includes('network'));

    let lastError: unknown;

    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      // Bail immediately if caller cancelled
      if (signal?.aborted) throw new DOMException('Request cancelled by user.', 'AbortError');

      try {
        return await this.request<T>(endpoint, {
          method: 'POST',
          body: JSON.stringify(body),
        }, timeoutMs, signal);
      } catch (err) {
        lastError = err;

        // Don't retry on user cancellation or non-network errors
        if (err instanceof DOMException && err.name === 'AbortError') throw err;
        if (!isColdStart(err)) throw err;
        if (attempt === RETRY_DELAYS.length) break; // exhausted all retries

        const delay = RETRY_DELAYS[attempt];
        if (import.meta.env.DEV)
          console.warn(`[ApiClient] Cold start detected, retrying in ${delay / 1000}s (attempt ${attempt + 1}/${RETRY_DELAYS.length})`);

        onWakeUp?.(attempt + 1, RETRY_DELAYS.length);

        // Wait for the retry delay, but abort early if the signal fires
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, delay);
          signal?.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('Request cancelled by user.', 'AbortError'));
          }, { once: true });
        });
      }
    }

    throw lastError;
  }

  /**
   * POST request for long-running operations (3 minute timeout, 1 auto-retry)
   * Used for AI analysis/generation that can take 60-120s on cold starts
   */
  async postLong<T>(endpoint: string, body: any): Promise<T> {
    const timeoutMs = 180000; // 3 minutes
    try {
      return await this.request<T>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      }, timeoutMs);
    } catch (error) {
      // On timeout or network failure, automatically retry once
      if (error instanceof Error &&
        (error.name === 'AbortError' ||
          error.message.includes('timed out') ||
          error.message.includes('Failed to fetch'))) {
        if (import.meta.env.DEV) console.warn('[ApiClient] First attempt failed, retrying once...', error.message);
        return this.request<T>(endpoint, {
          method: 'POST',
          body: JSON.stringify(body),
        }, timeoutMs);
      }
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, timeoutMs?: number): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    }, timeoutMs);
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
   * PATCH request (partial update)
   */
  async patch<T>(endpoint: string, body: any = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
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

  /**
   * POST request with SSE streaming response.
   * onChunk is called for each text token received.
   * onDone is called when the stream ends.
   * onError is called on failure.
   */
  async streamPost(
    endpoint: string,
    body: any,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const token = await this.getAuthToken();
    if (!token) {
      onError(new Error('Authentication required. Please login first.'));
      return;
    }

    const url = `${BACKEND_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`
        }));
        onError(new Error(errorData.message || 'Stream request failed'));
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError(new Error('No response body available for streaming'));
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onDone();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (data && data !== '[DONE]') {
              try {
                // Backend sends JSON: {"content": " How"}
                const parsed = JSON.parse(data);
                if (parsed.content) onChunk(parsed.content);
              } catch {
                // Fallback for non-JSON data
                onChunk(data);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Stream request failed: ${endpoint}`, error);
      onError(error instanceof Error ? error : new Error('Stream failed'));
    }
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

export interface CaseEvaluationBreakdown {
  clarity: number;
  strategy: number;
  feasibility: number;
  depth: number;
}

export interface CaseEvaluationResponse {
  score: number;
  /** "Keep Trying" | "Good Effort" | "Strong Solution" */
  verdict: string;
  feedback: string[];
  strengths: string[];
  improvements: string[];
  breakdown?: CaseEvaluationBreakdown;
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
