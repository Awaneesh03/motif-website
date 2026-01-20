// Backend API integration for idea analysis
// All AI logic is handled by the Spring Boot backend

import { apiClient, AnalysisResponse } from './api-client';

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
 * Generate a startup idea using the backend API
 * Backend endpoint: POST /api/ai/generate-idea
 */
export async function generateIdeaWithGroq(): Promise<GeneratedIdea> {
  try {
    const response = await apiClient.post<GeneratedIdea>('/api/ai/generate-idea', {});
    return response;
  } catch (error) {
    console.error('Idea generation error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate idea. Please ensure the backend is running.');
  }
}

/**
 * Analyze a startup idea using the backend API
 * Backend endpoint: POST /api/ai/analyze-idea
 */
export async function analyzeIdeaWithGroq(
  request: IdeaAnalysisRequest
): Promise<IdeaAnalysisResult> {
  try {
    const response = await apiClient.post<AnalysisResponse>('/api/ai/analyze-idea', {
      title: request.title,
      description: request.description,
      targetMarket: request.targetMarket || undefined,
    });

    return {
      score: response.score,
      strengths: response.strengths,
      weaknesses: response.weaknesses,
      recommendations: response.recommendations,
      marketSize: response.marketSize,
      competition: response.competition,
      viability: response.viability,
    };
  } catch (error) {
    console.error('Idea analysis error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to analyze idea. Please ensure the backend is running.');
  }
}
