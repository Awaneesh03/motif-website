// Backend API integration for AI services
// All AI calls are routed through the secure backend

import { API_CONFIG, getAuthHeaders } from './apiConfig';

export interface IdeaAnalysisRequest {
  title: string;
  description: string;
  targetMarket?: string | null;
}

export interface IdeaAnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  marketSize: string;
  competition: string;
  viability: string;
}

export interface GeneratedIdea {
  title: string;
  description: string;
  targetMarket: string;
}

/**
 * Analyze a startup idea using backend API
 */
export async function analyzeIdeaWithGroq(
  request: IdeaAnalysisRequest
): Promise<IdeaAnalysisResult> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.analyzeIdea}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: request.title,
        description: request.description,
        targetMarket: request.targetMarket || ''
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to analyze idea' }));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform backend response to match frontend interface
    return {
      score: data.score || 0,
      strengths: data.strengths || [],
      weaknesses: data.weaknesses || [],
      recommendations: data.recommendations || [],
      marketSize: data.marketSize || 'Unknown',
      competition: data.competition || 'Unknown',
      viability: data.viability || 'Medium'
    };
  } catch (error) {
    console.error('Idea analysis error:', error);
    throw error;
  }
}

/**
 * Generate a startup idea using backend API
 */
export async function generateIdeaWithGroq(): Promise<GeneratedIdea> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.generateIdea}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to generate idea' }));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      title: data.title || '',
      description: data.description || '',
      targetMarket: data.targetMarket || ''
    };
  } catch (error) {
    console.error('Idea generation error:', error);
    throw error;
  }
}

/**
 * Improve a startup description using backend API
 */
export async function improveDescriptionWithGroq(description: string): Promise<string> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.improveDescription}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ description })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to improve description' }));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.message || description;
  } catch (error) {
    console.error('Description improvement error:', error);
    throw error;
  }
}
