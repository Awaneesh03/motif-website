import { useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  Presentation,
  Sparkles,
  Download,
  RefreshCw,
  CheckCircle,
  Lightbulb,
  Target,
  Users,
  TrendingUp,
} from 'lucide-react';
import Groq from 'groq-sdk';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';

// Groq API Key - Use environment variable or fallback
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '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';

interface PitchCreatorPageProps {
  onNavigate?: (page: string) => void;
}

export function PitchCreatorPage({ onNavigate }: PitchCreatorPageProps) {
  const [formData, setFormData] = useState({
    ideaName: '',
    problem: '',
    solution: '',
    audience: '',
    market: '',
    usp: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [generatedSlides, setGeneratedSlides] = useState<any>(null);

  const handleGeneratePitch = async () => {
    setIsGenerating(true);

    try {
      // Initialize Groq client with constant API key
      const groq = new Groq({
        apiKey: GROQ_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      // Create a detailed prompt for the AI
      const prompt = `You are an expert startup pitch consultant who has helped 100+ startups raise funding. Generate a professional, investor-ready pitch deck based on the following startup information.

STARTUP DETAILS:
Idea Name: ${formData.ideaName}
Problem Statement: ${formData.problem}
Solution: ${formData.solution}
Target Audience: ${formData.audience || 'General market - needs specification'}
Market Opportunity: ${formData.market || 'To be researched'}
Unique Selling Proposition: ${formData.usp || 'To be defined'}

CRITICAL INSTRUCTIONS:
1. Analyze the provided information carefully and identify key insights
2. Create compelling, specific content that directly relates to THIS startup (not generic advice)
3. Use concrete language and avoid vague statements
4. Include relevant numbers, metrics, or market data where applicable
5. Make each slide tell a story that builds investor confidence
6. Focus on what makes THIS idea unique and valuable

Generate a comprehensive pitch deck with exactly 6 slides in VALID JSON format (return ONLY JSON, no extra text):

{
  "slides": [
    {
      "title": "The Problem",
      "content": "<2-3 sentences describing the specific problem this startup solves, using real pain points and market gaps. Be concrete and relatable.>",
      "icon": "problem"
    },
    {
      "title": "Our Solution",
      "content": "<2-3 sentences explaining how ${formData.ideaName} solves the problem uniquely. Highlight the innovative approach and key differentiators.>",
      "icon": "solution"
    },
    {
      "title": "Market Opportunity",
      "content": "<2-3 sentences covering market size, growth trends, and target customer segments. Include specific market data or estimates if available.>",
      "icon": "market"
    },
    {
      "title": "The Product",
      "content": "<2-3 sentences describing core features, user experience, and value delivery. Explain what users will actually get.>",
      "icon": "product"
    },
    {
      "title": "Why Now",
      "content": "<2-3 sentences explaining market timing, current trends, and catalysts that make this the perfect moment for this solution.>",
      "icon": "solution"
    },
    {
      "title": "Business Model",
      "content": "<2-3 sentences detailing revenue streams, pricing strategy, and path to profitability. Be specific about how money is made.>",
      "icon": "market"
    }
  ]
}

Remember: Return ONLY the JSON object, no additional text or explanations.`;

      // Call Groq API with better model and lower temperature for more precise results
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert startup pitch consultant. You provide specific, actionable, investor-ready pitch content. Always respond with valid JSON only, no extra text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.3-70b-versatile', // Better model for more precise results
        temperature: 0.3, // Lower temperature for more focused, consistent output
        max_tokens: 2048,
      });

      const response = chatCompletion.choices[0]?.message?.content || '';

      // Try to parse the JSON response
      let pitchData;
      try {
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          pitchData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', response);
        // Fallback: Create basic slides from form data
        pitchData = {
          slides: [
            {
              title: 'The Problem',
              content: formData.problem || 'Market gap that needs addressing',
              icon: 'problem',
            },
            {
              title: 'Our Solution',
              content: formData.solution || 'Innovative approach to solving the problem',
              icon: 'solution',
            },
            {
              title: 'Market Opportunity',
              content: formData.market || 'Large and growing addressable market',
              icon: 'market',
            },
            {
              title: 'The Product',
              content: `${formData.ideaName}: ${formData.usp || 'Unique product offering'}`,
              icon: 'product',
            },
          ],
        };
        toast.warning('AI response format unexpected. Using basic pitch template.');
      }

      setGeneratedSlides(pitchData);
      setShowPitchModal(true);
      toast.success('Pitch deck generated successfully!');
    } catch (error) {
      console.error('Pitch generation error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate pitch. Please try again.'
      );
      setIsGenerating(false);
      return;
    }

    setIsGenerating(false);
  };

  // Validation checks
  const isIdeaNameValid = formData.ideaName.trim().length >= 3;
  const isProblemValid = formData.problem.trim().length >= 20;
  const isSolutionValid = formData.solution.trim().length >= 20;
  const isFormValid = isIdeaNameValid && isProblemValid && isSolutionValid;

  const slideIcons: Record<string, any> = {
    problem: Target,
    solution: Lightbulb,
    market: TrendingUp,
    product: Sparkles,
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="via-background to-background border-border relative overflow-hidden border-b bg-gradient-to-br from-[#C9A7EB]/20 py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="gradient-lavender mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
              <Presentation className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-gradient-lavender mb-4">Create Your Startup Pitch with AI</h1>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Turn your idea into a professional presentation in minutes. Our AI helps you craft a
              compelling pitch deck.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Input Form - Left Column */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <Card className="glass-surface border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="text-primary h-5 w-5" />
                    Pitch Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Idea Name */}
                  <div className="space-y-2">
                    <Label htmlFor="ideaName">Idea Name *</Label>
                    <Input
                      id="ideaName"
                      placeholder="e.g., AI-powered Fitness Coach"
                      value={formData.ideaName}
                      onChange={e => setFormData({ ...formData, ideaName: e.target.value })}
                      className="h-12 rounded-xl"
                      maxLength={100}
                    />
                    <p className="text-muted-foreground text-xs">
                      {isIdeaNameValid ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span>Minimum 3 characters ({formData.ideaName.length}/100)</span>
                      )}
                    </p>
                  </div>

                  {/* Problem */}
                  <div className="space-y-2">
                    <Label htmlFor="problem">Problem Statement *</Label>
                    <Textarea
                      id="problem"
                      placeholder="What problem does your idea solve?"
                      value={formData.problem}
                      onChange={e => setFormData({ ...formData, problem: e.target.value })}
                      className="min-h-[100px] resize-none rounded-xl"
                      maxLength={500}
                    />
                    <p className="text-muted-foreground text-xs">
                      {isProblemValid ? (
                        <span className="text-green-600">✓ {formData.problem.length}/500 characters</span>
                      ) : (
                        <span>Minimum 20 characters ({formData.problem.length}/500)</span>
                      )}
                    </p>
                  </div>

                  {/* Solution */}
                  <div className="space-y-2">
                    <Label htmlFor="solution">Your Solution *</Label>
                    <Textarea
                      id="solution"
                      placeholder="How does your idea solve this problem?"
                      value={formData.solution}
                      onChange={e => setFormData({ ...formData, solution: e.target.value })}
                      className="min-h-[100px] resize-none rounded-xl"
                      maxLength={500}
                    />
                    <p className="text-muted-foreground text-xs">
                      {isSolutionValid ? (
                        <span className="text-green-600">✓ {formData.solution.length}/500 characters</span>
                      ) : (
                        <span>Minimum 20 characters ({formData.solution.length}/500)</span>
                      )}
                    </p>
                  </div>

                  {/* Target Audience */}
                  <div className="space-y-2">
                    <Label htmlFor="audience">Target Audience</Label>
                    <Input
                      id="audience"
                      placeholder="e.g., Busy professionals aged 25-40"
                      value={formData.audience}
                      onChange={e => setFormData({ ...formData, audience: e.target.value })}
                      className="h-12 rounded-xl"
                    />
                  </div>

                  {/* Market Size */}
                  <div className="space-y-2">
                    <Label htmlFor="market">Market Opportunity</Label>
                    <Input
                      id="market"
                      placeholder="e.g., $10B fitness tech market"
                      value={formData.market}
                      onChange={e => setFormData({ ...formData, market: e.target.value })}
                      className="h-12 rounded-xl"
                    />
                  </div>

                  {/* USP */}
                  <div className="space-y-2">
                    <Label htmlFor="usp">Unique Selling Proposition</Label>
                    <Textarea
                      id="usp"
                      placeholder="What makes your solution unique?"
                      value={formData.usp}
                      onChange={e => setFormData({ ...formData, usp: e.target.value })}
                      className="min-h-[80px] resize-none rounded-xl"
                    />
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGeneratePitch}
                    disabled={!isFormValid || isGenerating}
                    className="gradient-lavender shadow-lavender h-12 w-full rounded-xl hover:opacity-90"
                  >
                    {isGenerating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                        />
                        Generating Pitch...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Pitch
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tips & Info - Right Column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Card className="glass-surface border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-4 text-sm">
                  <div className="flex gap-2">
                    <CheckCircle className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                    <p>Keep your problem statement clear and concise</p>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                    <p>Focus on the unique value you bring</p>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                    <p>Use data to support your market claims</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-surface border-border/50 bg-gradient-to-br from-[#C9A7EB]/10 to-[#B084E8]/10">
                <CardContent className="pt-6">
                  <div className="space-y-2 text-center">
                    <Sparkles className="text-primary mx-auto h-8 w-8" />
                    <p className="text-muted-foreground text-sm">
                      AI will generate a professional pitch deck based on your inputs
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Learning Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12"
          >
            <Card className="glass-surface border-border/50">
              <CardHeader>
                <CardTitle>Learn What Makes a Great Pitch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="flex gap-3">
                    <div className="gradient-lavender flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="mb-1">Problem First</h4>
                      <p className="text-muted-foreground text-sm">
                        Start with a clear problem that resonates with your audience
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="gradient-lavender flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                      <Lightbulb className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="mb-1">Simple Solution</h4>
                      <p className="text-muted-foreground text-sm">
                        Explain your solution in terms anyone can understand
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="gradient-lavender flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="mb-1">Show Traction</h4>
                      <p className="text-muted-foreground text-sm">
                        Include metrics and validation to build credibility
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 text-center">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => onNavigate?.('Resources')}
                  >
                    View Full Pitch Guide
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Pitch Output Modal */}
      <Dialog open={showPitchModal} onOpenChange={setShowPitchModal}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Your AI-Generated Pitch</DialogTitle>
            <DialogDescription>
              Review your pitch deck slides. You can download or regenerate as needed.
            </DialogDescription>
          </DialogHeader>
          {generatedSlides && (
            <div className="space-y-4 py-4">
              {/* Slides Preview */}
              {generatedSlides.slides.map((slide: any, index: number) => {
                const IconComponent = slideIcons[slide.icon];
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="glass-surface border-border/50">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="gradient-lavender flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl">
                            {IconComponent && <IconComponent className="h-6 w-6 text-white" />}
                          </div>
                          <div className="flex-1">
                            <Badge variant="outline" className="mb-2">
                              Slide {index + 1}
                            </Badge>
                            <h4 className="mb-2">{slide.title}</h4>
                            <p className="text-muted-foreground text-sm">{slide.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowPitchModal(false)}
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={handleGeneratePitch}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
                <Button className="gradient-lavender shadow-lavender flex-1 rounded-xl hover:opacity-90">
                  <Download className="mr-2 h-4 w-4" />
                  Download Slides
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
