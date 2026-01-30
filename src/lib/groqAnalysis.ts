// Frontend Groq API integration for idea analysis
// Calls Groq API directly from the browser

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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
 * Call Groq API with a prompt
 */
async function callGroqAPI(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key is not configured. Please add VITE_GROQ_API_KEY to your .env file.');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(error.error?.message || `Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Improve a startup description for clarity and impact
 */
export async function improveDescriptionWithGroq(description: string): Promise<string> {
  const systemPrompt = `You are an expert copywriter specializing in startup pitches. Improve startup descriptions for clarity, impact, and persuasiveness while maintaining the core idea. Keep it concise (2-4 sentences).`;

  const userPrompt = `Improve this startup description for clarity and impact. Return ONLY the improved description, no additional text or formatting:

${description}`;

  try {
    const response = await callGroqAPI(systemPrompt, userPrompt);
    return response.trim();
  } catch (error) {
    console.error('Description improvement error:', error);
    throw error;
  }
}

/**
 * Generate a startup idea using Groq AI
 */
export async function generateIdeaWithGroq(): Promise<GeneratedIdea> {
  const systemPrompt = `You are a creative startup idea generator. Generate innovative, practical startup ideas that solve real problems. Always respond in valid JSON format only, no additional text.`;

  const userPrompt = `Generate a unique startup idea. Return ONLY a JSON object with this exact structure:
{
  "title": "Catchy startup name",
  "description": "2-3 sentence description of the problem and solution",
  "targetMarket": "Primary target audience (e.g., B2B, B2C, Students, Enterprises)"
}`;

  try {
    const response = await callGroqAPI(systemPrompt, userPrompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Idea generation error:', error);
    throw error;
  }
}

/**
 * Analyze a startup idea using Groq AI
 */
export async function analyzeIdeaWithGroq(
  request: IdeaAnalysisRequest
): Promise<IdeaAnalysisResult> {
  const systemPrompt = `You are an expert startup analyst and venture capital advisor. Analyze startup ideas thoroughly and provide actionable feedback. Always respond in valid JSON format only, no additional text.`;

  const userPrompt = `Analyze this startup idea:

Title: ${request.title}
Description: ${request.description}
Target Market: ${request.targetMarket || 'Not specified'}

Provide a comprehensive analysis. Return ONLY a JSON object with this exact structure:
{
  "score": <number from 1-100 representing overall viability>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "marketSize": "Brief market size assessment (e.g., '$50B global market')",
  "competition": "Brief competitive landscape analysis",
  "viability": "Brief overall viability assessment"
}`;

  try {
    const response = await callGroqAPI(systemPrompt, userPrompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      score: typeof parsed.score === 'number' ? parsed.score : 50,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      marketSize: parsed.marketSize || 'Market size analysis unavailable',
      competition: parsed.competition || 'Competition analysis unavailable',
      viability: parsed.viability || 'Viability assessment unavailable',
    };
  } catch (error) {
    console.error('Idea analysis error:', error);
    throw error;
  }
}
