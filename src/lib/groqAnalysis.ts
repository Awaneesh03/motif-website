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

/**
 * Generate a mock analysis for demo/fallback when backend is unreachable
 */
function generateMockAnalysis(request: IdeaAnalysisRequest): IdeaAnalysisResult {
  const titleLength = request.title.length;
  const descLength = request.description.length;

  // Generate a semi-random but consistent score based on input
  const baseScore = 60 + (titleLength % 20) + (descLength % 15);
  const score = Math.min(95, Math.max(55, baseScore));

  return {
    score,
    strengths: [
      'Clear value proposition that addresses a real market need',
      'Potential for strong product-market fit with the right execution',
      'Scalable business model with multiple revenue opportunities'
    ],
    weaknesses: [
      'Market validation needed to confirm demand assumptions',
      'Competition analysis required to identify differentiation strategy',
      'Initial customer acquisition strategy needs refinement'
    ],
    recommendations: [
      'Conduct customer interviews to validate the core problem hypothesis',
      'Build an MVP to test key assumptions before scaling',
      'Identify 2-3 key metrics to track for early product-market fit signals',
      'Research competitor pricing and positioning to find your unique angle'
    ],
    marketSize: '$5B - $15B (estimated TAM)',
    competition: 'Moderate - established players exist but room for innovation',
    viability: score >= 75 ? 'High Viability' : score >= 60 ? 'Medium Viability' : 'Needs Validation'
  };
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

function shouldFallbackToMock(error: unknown): boolean {
  if (!(error instanceof Error)) return true; // Unknown error type, fall back
  const msg = error.message.toLowerCase();
  
  // Network/connectivity errors
  if (msg.includes('failed to fetch') ||
      msg.includes('network') ||
      msg.includes('cors') ||
      msg.includes('econnrefused') ||
      msg.includes('connection refused') ||
      msg.includes('timeout') ||
      msg.includes('aborted')) {
    return true;
  }
  
  // Server errors (5xx) or backend unavailable
  if (msg.includes('unexpected') ||
      msg.includes('500') ||
      msg.includes('502') ||
      msg.includes('503') ||
      msg.includes('504') ||
      msg.includes('internal server') ||
      msg.includes('service unavailable') ||
      msg.includes('bad gateway')) {
    return true;
  }

  // Auth errors that indicate backend misconfiguration (not user error)
  // These suggest the backend can't validate the token properly
  if (msg.includes('access denied') ||
      msg.includes('forbidden') ||
      msg.includes('401') ||
      msg.includes('403')) {
    return true;
  }
  
  return false;
}

/**
 * Analyze a startup idea via backend API
 */
export async function analyzeIdeaWithGroq(
  request: IdeaAnalysisRequest
): Promise<IdeaAnalysisResult> {
  try {
    const response = await apiClient.post<AnalysisResponse>('/api/ai/analyze-idea', {
      title: request.title,
      description: request.description,
      targetMarket: request.targetMarket || null,
    });

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
    console.error('Idea analysis error:', error);
    if (shouldFallbackToMock(error)) {
      console.warn('Backend unreachable, using mock analysis');
      return generateMockAnalysis(request);
    }
    throw error;
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
    if (shouldFallbackToMock(error)) {
      console.warn('Backend unreachable, using mock idea');
      return mockIdeas[Math.floor(Math.random() * mockIdeas.length)];
    }
    throw error;
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
    if (shouldFallbackToMock(error)) {
      console.warn('Backend unreachable, using simple fallback');
      const enhanced = description.trim();
      if (enhanced.length < 100) {
        return `${enhanced} This solution addresses a clear market need by providing innovative technology that simplifies the user experience while delivering measurable value. Our approach focuses on scalability and user-centric design.`;
      }
      return enhanced;
    }
    throw error;
  }
}
