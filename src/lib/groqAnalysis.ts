// Direct Groq API integration for idea analysis
// This bypasses the need for a backend server

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

export async function generateIdeaWithGroq(): Promise<GeneratedIdea> {
  if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
    throw new Error('Groq API key is not configured. Please add VITE_GROQ_API_KEY to your .env file.');
  }

  const prompt = `Generate a unique, innovative, and viable startup idea.
Provide the response in valid JSON format with the following fields:
{
  "title": "Catchy startup name or title",
  "description": "Detailed description of the problem and solution (at least 2 sentences)",
  "targetMarket": "Specific target audience"
}
Make it sound professional and exciting.`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a creative startup ideator. Generate unique business ideas. Return ONLY valid JSON, no markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }

    const idea = JSON.parse(jsonMatch[0]);

    if (!idea.title || !idea.description || !idea.targetMarket) {
      throw new Error('Invalid idea structure from AI');
    }

    return idea;
  } catch (error) {
    console.error('Groq idea generation error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate idea');
  }
}

export async function analyzeIdeaWithGroq(
  request: IdeaAnalysisRequest
): Promise<IdeaAnalysisResult> {
  if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
    throw new Error('Groq API key is not configured. Please add VITE_GROQ_API_KEY to your .env file.');
  }

  const prompt = `Analyze this startup idea and provide a detailed assessment in JSON format:

Title: ${request.title}
Description: ${request.description}
${request.targetMarket ? `Target Market: ${request.targetMarket}` : ''}

Provide your analysis in the following JSON format (return ONLY valid JSON, no other text):
{
  "score": <number between 0-100>,
  "strengths": [<array of 3-5 strength points as strings>],
  "weaknesses": [<array of 3-5 weakness points as strings>],
  "recommendations": [<array of 3-5 actionable recommendations as strings>],
  "marketSize": "<brief assessment of market size and opportunity>",
  "competition": "<brief assessment of competitive landscape>",
  "viability": "<brief assessment of overall viability>"
}

Be constructive, specific, and actionable in your feedback.`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert startup analyst. Analyze business ideas and provide structured feedback. Always return valid JSON only, with no markdown formatting or extra text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Extract JSON from response (handle markdown code blocks if present)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Validate response structure
    if (
      typeof analysis.score !== 'number' ||
      !Array.isArray(analysis.strengths) ||
      !Array.isArray(analysis.weaknesses) ||
      !Array.isArray(analysis.recommendations)
    ) {
      throw new Error('Invalid analysis structure from AI');
    }

    return {
      score: Math.min(100, Math.max(0, analysis.score)),
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      recommendations: analysis.recommendations,
      marketSize: analysis.marketSize || 'Not assessed',
      competition: analysis.competition || 'Not assessed',
      viability: analysis.viability || 'Not assessed',
    };
  } catch (error) {
    console.error('Groq analysis error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to analyze idea');
  }
}
