// AI services - routes all calls through the backend API
import { apiClient, AnalysisResponse, ChatResponse, IdeaResponse } from './api-client';

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


const mockIdeas: GeneratedIdea[] = [
  {
    title: "EcoTrack: Carbon Footprint Gamification",
    description: "A mobile app that tracks daily activities and calculates carbon footprint in real-time. Users earn points and rewards for eco-friendly choices, competing with friends and communities to lower their environmental impact. Features include smart home integration, sustainable product recommendations, and carbon offset marketplace.",
    targetMarket: "B2C, Students, Sustainability"
  },
  {
    title: "SkillSwap: Peer Learning Marketplace",
    description: "A hyper-local platform connecting people who want to teach skills (cooking, coding, music, languages) with those who want to learn. Uses a time-banking system where 1 hour of teaching earns 1 hour of learning any skill. AI matches learners with teachers based on location, schedule, and learning style.",
    targetMarket: "B2C, Students, Creators"
  },
  {
    title: "MediMind: AI Health Companion for Seniors",
    description: "Voice-activated AI companion for elderly users that manages medication reminders, tracks health vitals, facilitates telehealth appointments, and alerts family members of anomalies. Designed with extreme simplicity and large, accessible interfaces. Integrates with wearables and smart home devices.",
    targetMarket: "B2C, Healthcare"
  },
  {
    title: "FreelanceFlow: AI Project Manager",
    description: "An intelligent project management tool specifically for freelancers and small agencies. Uses AI to estimate project timelines, automate client communication, generate invoices, and predict cash flow. Integrates with popular tools like Slack, Notion, and banking apps.",
    targetMarket: "B2B, Freelancers, SMBs"
  },
  {
    title: "LocalBite: Farm-to-Table Discovery",
    description: "A platform connecting local farmers, food artisans, and restaurants with consumers. Features include seasonal produce subscriptions, virtual farm tours, recipe suggestions based on available local ingredients, and a marketplace for farm-fresh products with same-day delivery.",
    targetMarket: "B2C, E-commerce, Sustainability"
  }
];


/**
 * Analyze a startup idea via backend API
 */
export async function analyzeIdeaWithGroq(
  request: IdeaAnalysisRequest
): Promise<IdeaAnalysisResult> {
  console.log('[IdeaAnalysis] Starting analysis for:', request.title);
  try {
    console.log('[IdeaAnalysis] Calling backend API (long timeout)...');
    
    // Truncate to match backend validation limits
    const truncatedTitle = request.title?.substring(0, 100) || 'Untitled';
    const truncatedDescription = request.description?.substring(0, 10000) || '';
    const truncatedMarket = request.targetMarket?.substring(0, 200) || null;
    
    console.log('[IdeaAnalysis] Title length:', truncatedTitle.length, 'Desc length:', truncatedDescription.length);
    
    // Use postLong for 2-minute timeout since AI analysis takes time
    const response = await apiClient.postLong<AnalysisResponse>('/api/ai/analyze-idea', {
      title: truncatedTitle,
      description: truncatedDescription,
      targetMarket: truncatedMarket,
    });
    console.log('[IdeaAnalysis] Backend response received:', response);

    return {
      score: response.score ?? 70,
      strengths: response.strengths || [],
      weaknesses: response.weaknesses || [],
      recommendations: response.recommendations || [],
      marketSize: response.marketSize || 'Unknown',
      competition: response.competition || 'Unknown',
      viability: response.viability || 'Medium Viability',
    };
  } catch (error) {
    console.error('[IdeaAnalysis] Error occurred:', error);
    // Throw error instead of silently falling back to mock data
    // This ensures user sees real analysis or a clear error
    const errorMessage = error instanceof Error ? error.message : 'Backend analysis failed';
    console.error('[IdeaAnalysis] Throwing error to user:', errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Generate a startup idea via backend API
 */
export async function generateIdeaWithGroq(): Promise<GeneratedIdea> {
  try {
    const response = await apiClient.post<IdeaResponse>('/api/ai/generate-idea', {});

    return {
      title: response.title || '',
      description: response.description || '',
      targetMarket: response.targetMarket || '',
    };
  } catch (error) {
    console.error('Idea generation error:', error);
    console.warn('Backend unreachable, using mock idea');
    return mockIdeas[Math.floor(Math.random() * mockIdeas.length)];
  }
}

/**
 * Improve a startup description via backend API
 */
export async function improveDescriptionWithGroq(description: string): Promise<string> {
  try {
    const response = await apiClient.post<ChatResponse>('/api/ai/improve-description', {
      description,
    });

    return response.message?.trim() || description;
  } catch (error) {
    console.error('Description improvement error:', error);
    console.warn('Backend unreachable, using simple fallback');
    const enhanced = description.trim();
    if (enhanced.length < 100) {
      return `${enhanced} This solution addresses a clear market need by providing innovative technology that simplifies the user experience while delivering measurable value. Our approach focuses on scalability and user-centric design.`;
    }
    return enhanced;
  }
}
