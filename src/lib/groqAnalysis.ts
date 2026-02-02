// Direct Groq API integration for AI services
// Calls Groq API directly - no backend required

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

// Get Groq API key from environment
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Call Groq API directly
 */
async function callGroqAPI(messages: { role: string; content: string }[]): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY_NOT_CONFIGURED');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a few moments.');
    }
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Generate a mock analysis for demo/fallback
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

/**
 * Analyze a startup idea using Groq API
 */
export async function analyzeIdeaWithGroq(
  request: IdeaAnalysisRequest
): Promise<IdeaAnalysisResult> {
  // If no API key, return mock analysis
  if (!GROQ_API_KEY) {
    console.log('Groq API key not configured, using mock analysis');
    return generateMockAnalysis(request);
  }

  try {
    const prompt = `You are a startup analyst. Analyze this startup idea and provide a detailed assessment.

Title: ${request.title}
Description: ${request.description}
Target Market: ${request.targetMarket || 'General'}

Respond ONLY with a valid JSON object (no markdown, no code blocks, just pure JSON) with this exact structure:
{
  "score": <number between 0-100>,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3", "recommendation4"],
  "marketSize": "<estimated market size like '$10B TAM'>",
  "competition": "<competition level description>",
  "viability": "<High Viability|Medium Viability|Low Viability>"
}`;

    const content = await callGroqAPI([
      { role: 'system', content: 'You are a startup analyst expert. Always respond with valid JSON only, no markdown formatting.' },
      { role: 'user', content: prompt }
    ]);

    // Parse the JSON response
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(cleanedContent);

    return {
      score: data.score || 70,
      strengths: data.strengths || [],
      weaknesses: data.weaknesses || [],
      recommendations: data.recommendations || [],
      marketSize: data.marketSize || 'Unknown',
      competition: data.competition || 'Unknown',
      viability: data.viability || 'Medium Viability'
    };
  } catch (error) {
    console.error('Idea analysis error:', error);

    // Return mock analysis as fallback
    if (error instanceof Error && error.message === 'GROQ_API_KEY_NOT_CONFIGURED') {
      return generateMockAnalysis(request);
    }

    throw error;
  }
}

/**
 * Generate a startup idea using Groq API
 */
export async function generateIdeaWithGroq(): Promise<GeneratedIdea> {
  // If no API key, return a random mock idea
  if (!GROQ_API_KEY) {
    const mockIdeas = [
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

    return mockIdeas[Math.floor(Math.random() * mockIdeas.length)];
  }

  try {
    const prompt = `Generate a unique and innovative startup idea. Be creative and specific.

Respond ONLY with a valid JSON object (no markdown, no code blocks, just pure JSON) with this exact structure:
{
  "title": "<catchy startup name: brief description>",
  "description": "<detailed 2-3 sentence description of the product/service>",
  "targetMarket": "<primary target markets, comma separated>"
}`;

    const content = await callGroqAPI([
      { role: 'system', content: 'You are a creative startup idea generator. Always respond with valid JSON only, no markdown formatting.' },
      { role: 'user', content: prompt }
    ]);

    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(cleanedContent);

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
 * Improve a startup description using Groq API
 */
export async function improveDescriptionWithGroq(description: string): Promise<string> {
  // If no API key, return an enhanced version manually
  if (!GROQ_API_KEY) {
    // Simple enhancement - add structure if missing
    const enhanced = description.trim();
    if (enhanced.length < 100) {
      return `${enhanced} This solution addresses a clear market need by providing innovative technology that simplifies the user experience while delivering measurable value. Our approach focuses on scalability and user-centric design.`;
    }
    return enhanced;
  }

  try {
    const prompt = `Improve this startup description to be more compelling, clear, and professional. Keep the core idea but make it more engaging and investor-ready. Keep it concise (2-3 sentences max).

Original description: ${description}

Respond with ONLY the improved description text, no quotes or additional formatting.`;

    const content = await callGroqAPI([
      { role: 'system', content: 'You are a startup pitch expert. Improve descriptions to be clear, compelling, and concise.' },
      { role: 'user', content: prompt }
    ]);

    return content.trim() || description;
  } catch (error) {
    console.error('Description improvement error:', error);
    throw error;
  }
}
