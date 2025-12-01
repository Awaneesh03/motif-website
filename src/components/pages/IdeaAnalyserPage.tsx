import { useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../contexts/UserContext';
import {
  Sparkles,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Zap,
  FileText,
  Download,
  FolderOpen,
} from 'lucide-react';

import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Progress } from '../ui/progress';
import Groq from 'groq-sdk';

// Groq API Key - Use environment variable or fallback
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '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';

interface AnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  marketSize: string;
  competition: string;
  viability: string;
}

interface IdeaAnalyserPageProps {
  onNavigate?: (page: string) => void;
}

export function IdeaAnalyserPage({ onNavigate }: IdeaAnalyserPageProps) {
  const { user } = useUser();
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDescription, setIdeaDescription] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showDemoReportModal, setShowDemoReportModal] = useState(false);

  // Validation checks
  const isTitleValid = ideaTitle.trim().length >= 5;
  const isDescriptionValid = ideaDescription.trim().length >= 20;
  const isFormValid = isTitleValid && isDescriptionValid;

  const handleAnalyze = async () => {
    if (!isFormValid) {
      toast.error('Please fill in all required fields with minimum lengths');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Initialize Groq client with constant API key
      const groq = new Groq({
        apiKey: GROQ_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      // Create a detailed prompt for the AI
      const prompt = `You are a senior startup analyst and venture capital advisor with 15+ years of experience evaluating startups. Analyze the following startup idea comprehensively and provide an honest, data-driven assessment.

STARTUP IDEA DETAILS:
Title: ${ideaTitle}
Description: ${ideaDescription}
Target Market: ${targetMarket || 'Not specified - needs definition'}

ANALYSIS FRAMEWORK:
Evaluate this idea based on:
1. Market Opportunity - Size, growth trends, accessibility
2. Problem-Solution Fit - How well does it address a real pain point?
3. Competitive Landscape - Existing solutions, barriers to entry
4. Execution Feasibility - Technical complexity, resource requirements
5. Business Model Potential - Revenue opportunities, scalability
6. Risk Factors - Regulatory, technical, market risks

SCORING GUIDELINES:
- 85-100: Exceptional idea with clear market need and strong execution potential
- 70-84: Strong idea with good potential, some areas need work
- 55-69: Decent concept but significant challenges to address
- 40-54: Weak idea with major flaws or limited market potential
- 0-39: Fundamental issues that likely prevent success

Provide your analysis in VALID JSON format (return ONLY JSON, no extra text):

{
  "score": <number between 0-100 based on thorough analysis>,
  "strengths": [
    "<Specific strength 1 with concrete reasoning>",
    "<Specific strength 2 with concrete reasoning>",
    "<Specific strength 3 with concrete reasoning>",
    "<Specific strength 4 if applicable>"
  ],
  "weaknesses": [
    "<Specific weakness 1 with impact assessment>",
    "<Specific weakness 2 with impact assessment>",
    "<Specific weakness 3 if applicable>"
  ],
  "recommendations": [
    "<Actionable recommendation 1 - be specific about what to do>",
    "<Actionable recommendation 2 - be specific about what to do>",
    "<Actionable recommendation 3 - be specific about what to do>",
    "<Actionable recommendation 4 - be specific about what to do>",
    "<Actionable recommendation 5 if applicable>"
  ],
  "marketSize": "<Estimate the Total Addressable Market (TAM) with specific numbers or ranges. Include market growth rate if relevant.>",
  "competition": "<Identify 2-3 key competitors or alternative solutions. Assess competitive intensity (low/medium/high) and explain why.>",
  "viability": "<Honest assessment of execution feasibility covering: technical complexity, required resources, time to market, and key success factors.>"
}

BE SPECIFIC AND HONEST. Avoid generic statements. Base your analysis on the actual details provided about THIS specific idea.`;

      // Call Groq API with better model and parameters
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert startup analyst providing detailed, honest assessments. Always respond with valid JSON only, no extra text. Be specific and actionable in your analysis.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.3-70b-versatile', // Better model for more precise analysis
        temperature: 0.3, // Lower temperature for more consistent, focused analysis
        max_tokens: 1500, // More tokens for detailed analysis
      });

      const response = chatCompletion.choices[0]?.message?.content || '';

      // Try to parse the JSON response
      let analysisData;
      try {
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', response);
        // Fallback: Create a basic analysis from the text response
        analysisData = {
          score: 75,
          strengths: ['Detailed concept', 'Market opportunity identified'],
          weaknesses: ['Needs more market validation'],
          recommendations: [
            'Conduct user interviews',
            'Build a minimal viable product',
            'Test with early adopters',
          ],
          marketSize: 'Requires market research',
          competition: 'Needs competitive analysis',
          viability: response.substring(0, 100) + '...',
        };
        toast.warning('AI response format unexpected. Using basic analysis.');
      }

      setAnalysisResult(analysisData);
      
      // Save analysis to database if user is logged in
      if (user) {
        try {
          const { error: dbError } = await supabase
            .from('idea_analyses')
            .insert({
              user_id: user.id,
              idea_title: ideaTitle,
              idea_description: ideaDescription,
              target_market: targetMarket || null,
              score: analysisData.score,
              strengths: analysisData.strengths,
              weaknesses: analysisData.weaknesses,
              recommendations: analysisData.recommendations,
              market_size: analysisData.marketSize,
              competition: analysisData.competition,
              viability: analysisData.viability,
            });

          if (dbError) {
            console.error('Error saving analysis to database:', dbError);
            toast.warning('Analysis completed but failed to save to your account');
          } else {
            toast.success('Analysis complete and saved to your account!');
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
          toast.success('Analysis complete!');
        }
      } else {
        toast.success('Analysis complete! Sign in to save your analyses.');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to analyze idea. Please try again.'
      );
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'from-green-500/20 to-emerald-500/20';
    if (score >= 60) return 'from-yellow-500/20 to-amber-500/20';
    return 'from-red-500/20 to-orange-500/20';
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header Section */}
      <section className="via-background to-background border-border relative overflow-hidden border-b bg-gradient-to-br from-[#C9A7EB]/20 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="gradient-lavender mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
              <Lightbulb className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-gradient-lavender mb-4">AI Idea Analyser</h1>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Get instant AI-powered feedback on your startup idea. Analyze market potential,
              competition, and viability in seconds.
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
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="text-primary h-5 w-5" />
                      Tell Us About Your Idea
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate?.('saved-ideas')}
                      className="rounded-xl"
                    >
                      <FolderOpen className="mr-2 h-4 w-4" />
                      View Saved Ideas
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Idea Title */}
                  <div className="space-y-2">
                    <Label htmlFor="ideaTitle">Idea Title *</Label>
                    <Input
                      id="ideaTitle"
                      placeholder="e.g., AI-powered fitness coach for busy professionals"
                      value={ideaTitle}
                      onChange={e => setIdeaTitle(e.target.value)}
                      className="h-12 rounded-xl"
                      maxLength={100}
                    />
                    <p className="text-muted-foreground text-xs">
                      {ideaTitle.length >= 5 ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span>Minimum 5 characters ({ideaTitle.length}/100)</span>
                      )}
                    </p>
                  </div>

                  {/* Idea Description */}
                  <div className="space-y-2">
                    <Label htmlFor="ideaDescription">Detailed Description *</Label>
                    <Textarea
                      id="ideaDescription"
                      placeholder="Example: A platform that helps students manage study schedules with AI reminders."
                      value={ideaDescription}
                      onChange={e => setIdeaDescription(e.target.value)}
                      className="min-h-[160px] resize-none rounded-xl"
                      maxLength={1000}
                    />
                    <p className="text-muted-foreground text-xs">
                      {ideaDescription.length >= 20 ? (
                        <span className="text-green-600">✓ {ideaDescription.length}/1000 characters</span>
                      ) : (
                        <span>Minimum 20 characters ({ideaDescription.length}/1000)</span>
                      )}
                    </p>
                  </div>

                  {/* Target Market */}
                  <div className="space-y-2">
                    <Label htmlFor="targetMarket">Target Market (Optional)</Label>
                    <Input
                      id="targetMarket"
                      placeholder="e.g., Working professionals aged 25-40"
                      value={targetMarket}
                      onChange={e => setTargetMarket(e.target.value)}
                      className="h-12 rounded-xl"
                      maxLength={200}
                    />
                  </div>

                  {/* Analyze Button */}
                  <Button
                    onClick={handleAnalyze}
                    disabled={!isFormValid || isAnalyzing}
                    className="gradient-lavender shadow-lavender h-12 w-full rounded-xl hover:opacity-90"
                  >
                    {isAnalyzing ? (
                      <>
                        <Zap className="mr-2 h-4 w-4 animate-pulse" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Analyze My Idea
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats - Right Column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Analysis Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Ideas Analyzed</span>
                    <span className="font-medium">12,450</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Success Rate</span>
                    <span className="font-medium text-green-600">67%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Avg. Score</span>
                    <span className="font-medium">72/100</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50 bg-gradient-to-br from-[#C9A7EB]/10 to-[#B084E8]/10">
                <CardContent className="pt-6">
                  <div className="space-y-2 text-center">
                    <Sparkles className="text-primary mx-auto h-8 w-8" />
                    <p className="text-muted-foreground text-sm">
                      Our AI analyzes market data, competition, and trends to give you actionable
                      insights.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Analysis Results */}
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 space-y-6"
            >
              {/* Score Card */}
              <Card
                className={`glass-card border-border/50 bg-gradient-to-br ${getScoreBg(analysisResult.score)}`}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                    <div className="text-center md:text-left">
                      <h3 className="mb-2">Overall Viability Score</h3>
                      <p className="text-muted-foreground">
                        Based on market analysis, competition, and execution feasibility
                      </p>
                    </div>
                    <div className="text-center">
                      <div className={`text-6xl ${getScoreColor(analysisResult.score)}`}>
                        {analysisResult.score}
                      </div>
                      <div className="text-muted-foreground">out of 100</div>
                      <Progress value={analysisResult.score} className="mt-4 h-2 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card className="glass-card border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="gradient-lavender flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 text-sm">Market Size</div>
                        <div className="font-medium">{analysisResult.marketSize}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="gradient-lavender flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 text-sm">Competition</div>
                        <div className="font-medium">{analysisResult.competition}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="gradient-lavender flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 text-sm">Viability</div>
                        <div className="font-medium">{analysisResult.viability}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="glass-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {analysisResult.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="glass-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-600">
                      <AlertCircle className="h-5 w-5" />
                      Areas to Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {analysisResult.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                          <span className="text-sm">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="text-primary h-5 w-5" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {analysisResult.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5 flex-shrink-0">
                          {index + 1}
                        </Badge>
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card className="glass-card border-border/50 bg-gradient-to-br from-[#C9A7EB]/10 to-[#B084E8]/10">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                    <div>
                      <h3 className="mb-1">Ready to validate your idea?</h3>
                      <p className="text-muted-foreground text-sm">
                        Join our community and get feedback from fellow founders
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="rounded-xl">
                        Save Report
                      </Button>
                      <Button className="gradient-lavender rounded-xl hover:opacity-90">
                        Share in Community
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* How It Works - When no results */}
          {!analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-12"
            >
              <h2 className="mb-8 text-center">How Our AI Analysis Works</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card className="glass-card border-border/50 text-center">
                  <CardContent className="pt-6">
                    <div className="gradient-lavender mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mb-2 text-base">Market Analysis</h3>
                    <p className="text-muted-foreground text-sm">
                      We analyze market size, growth trends, and addressable opportunities
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-card border-border/50 text-center">
                  <CardContent className="pt-6">
                    <div className="gradient-lavender mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mb-2 text-base">Competition Check</h3>
                    <p className="text-muted-foreground text-sm">
                      Identify competitors and find your unique positioning
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-card border-border/50 text-center">
                  <CardContent className="pt-6">
                    <div className="gradient-lavender mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mb-2 text-base">Viability Score</h3>
                    <p className="text-muted-foreground text-sm">
                      Get an overall score based on multiple success factors
                    </p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Demo Section - See how AI analyzes your idea */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12"
          >
            <h2 className="mb-8 text-center">See how AI analyzes your idea</h2>
            <Card className="glass-card border-border/50 hover:border-primary/50 hover:shadow-lavender transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col gap-6 md:flex-row">
                  <div className="flex-1">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="mb-2">AI-Powered Personal Finance Assistant</h3>
                        <div className="mb-3 flex flex-wrap gap-2">
                          <Badge variant="outline" className="rounded-full">
                            Fintech
                          </Badge>
                          <Badge variant="outline" className="rounded-full">
                            Automation
                          </Badge>
                          <Badge variant="outline" className="rounded-full">
                            Productivity
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4 text-sm">
                      An AI-powered mobile app that automatically categorizes expenses, provides
                      personalized budgeting recommendations, and sends smart alerts to help users
                      achieve their financial goals. The app learns from user behavior to offer
                      increasingly accurate insights over time.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        className="gradient-lavender shadow-lavender rounded-xl hover:opacity-90"
                        onClick={() => setShowDemoReportModal(true)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        View Report
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4 md:w-32 md:flex-col md:gap-2">
                    <div className="text-center">
                      <div className="mb-1 text-4xl text-green-600">85</div>
                      <div className="text-muted-foreground text-xs">Score</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Demo Idea Report Modal */}
      <Dialog open={showDemoReportModal} onOpenChange={setShowDemoReportModal}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>AI Analysis Report</DialogTitle>
            <DialogDescription>
              Comprehensive analysis for AI-Powered Personal Finance Assistant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Idea Overview */}
            <div>
              <h4 className="mb-3 flex items-center gap-2">
                <Lightbulb className="text-primary h-5 w-5" />
                Idea Overview
              </h4>
              <Card className="glass-surface border-border/50">
                <CardContent className="text-muted-foreground p-4 text-sm">
                  An AI-powered mobile app targeting millennials and Gen Z users who want to improve
                  their financial literacy and achieve savings goals. The app uses machine learning
                  to provide personalized insights.
                </CardContent>
              </Card>
            </div>

            {/* Market Analysis */}
            <div>
              <h4 className="mb-3 flex items-center gap-2">
                <TrendingUp className="text-primary h-5 w-5" />
                Market Analysis
              </h4>
              <Card className="glass-surface border-border/50">
                <CardContent className="space-y-2 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Market Size:</span>
                    <span>$12B (TAM)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Growth Rate:</span>
                    <span className="text-green-600">+18% YoY</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Market Maturity:</span>
                    <span>Growing</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Competitor Insights */}
            <div>
              <h4 className="mb-3 flex items-center gap-2">
                <Users className="text-primary h-5 w-5" />
                Competitor Insights
              </h4>
              <Card className="glass-surface border-border/50">
                <CardContent className="p-4">
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Mint and YNAB dominate but lack AI personalization</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Opportunity for better mobile-first UX with gamification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Few competitors focus on behavioral finance insights</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Feasibility Score */}
            <div>
              <h4 className="mb-3 flex items-center gap-2">
                <Target className="text-primary h-5 w-5" />
                Feasibility Score
              </h4>
              <Card className="glass-surface border-border/50 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-2xl text-green-600">85%</span>
                    <Badge className="border-0 bg-green-500 text-white">High Viability</Badge>
                  </div>
                  <Progress value={85} className="mb-2 h-2" />
                  <p className="text-muted-foreground text-sm">
                    Strong market demand, proven business model, and manageable technical complexity
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* AI Recommendations */}
            <div>
              <h4 className="mb-3 flex items-center gap-2">
                <Sparkles className="text-primary h-5 w-5" />
                AI Recommendations
              </h4>
              <Card className="glass-surface border-border/50">
                <CardContent className="space-y-3 p-4">
                  <div className="flex gap-3">
                    <Badge variant="outline" className="flex-shrink-0">
                      1
                    </Badge>
                    <p className="text-muted-foreground text-sm">
                      Focus on one specific user persona initially (e.g., freelancers with irregular
                      income)
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Badge variant="outline" className="flex-shrink-0">
                      2
                    </Badge>
                    <p className="text-muted-foreground text-sm">
                      Partner with banks for secure API access to simplify onboarding
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowDemoReportModal(false)}
              >
                Close
              </Button>
              <Button className="gradient-lavender shadow-lavender flex-1 rounded-xl hover:opacity-90">
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
