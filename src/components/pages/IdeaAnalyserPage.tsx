import { useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../lib/supabase';
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
import { analyzeIdeaWithGroq, generateIdeaWithGroq } from '../../lib/groqAnalysis';

interface AnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  marketSize: string;
  competition: string;
  viability: string;
}

interface CommunityIdea {
  title: string;
  description: string;
  upvotes: number;
  comments: number;
  tags: string[];
  author: string;
  authorAvatar?: string;
  createdAt: string;
}

interface IdeaAnalyserPageProps {
  onNavigate?: (page: string) => void;
}

export function IdeaAnalyserPage({ onNavigate }: IdeaAnalyserPageProps) {
  const { user, profile, displayName } = useUser();
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDescription, setIdeaDescription] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showDemoReportModal, setShowDemoReportModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const COMMUNITY_STORAGE_KEY = 'motif-community-ideas';

  const normalizeIdeaValue = (value: string) =>
    value.trim().replace(/\s+/g, ' ').toLowerCase();

  const buildTagsFromTargetMarket = (market: string) => {
    const tags = market
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
      .slice(0, 3);
    return tags.length > 0 ? tags : ['General'];
  };

  const saveCommunityIdea = (idea: CommunityIdea) => {
    if (typeof window === 'undefined') return false;

    try {
      const stored = localStorage.getItem(COMMUNITY_STORAGE_KEY);
      const existing: CommunityIdea[] = stored ? JSON.parse(stored) : [];
      const normalizedTitle = normalizeIdeaValue(idea.title);
      const normalizedDescription = normalizeIdeaValue(idea.description);

      const duplicate = existing.some(
        existingIdea =>
          normalizeIdeaValue(existingIdea.title) === normalizedTitle &&
          normalizeIdeaValue(existingIdea.description) === normalizedDescription
      );

      if (duplicate) return false;

      localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify([idea, ...existing]));
      return true;
    } catch (error) {
      console.error('Failed to save community idea:', error);
      return false;
    }
  };

  // Validation checks
  const isTitleValid = ideaTitle.trim().length >= 5;
  const isDescriptionValid = ideaDescription.trim().length >= 20;
  const isFormValid = isTitleValid && isDescriptionValid;

  const handleAnalyze = async () => {
    if (!isFormValid) {
      toast.error('Please fill in all required fields with minimum lengths');
      return;
    }

    if (!user) {
      toast.error('Please login to analyze your idea');
      return;
    }

    setIsAnalyzing(true);

    try {
      const normalizedTitle = normalizeIdeaValue(ideaTitle);
      const normalizedDescription = normalizeIdeaValue(ideaDescription);
      const normalizedMarket = normalizeIdeaValue(targetMarket || '');

      const { data: existingAnalyses, error: existingError } = await supabase
        .from('idea_analyses')
        .select(
          'id, idea_title, idea_description, target_market, score, strengths, weaknesses, recommendations, market_size, competition, viability'
        )
        .eq('user_id', user.id);

      if (!existingError && existingAnalyses && existingAnalyses.length > 0) {
        const match = existingAnalyses.find(analysis =>
          normalizeIdeaValue(analysis.idea_title) === normalizedTitle &&
          normalizeIdeaValue(analysis.idea_description) === normalizedDescription &&
          normalizeIdeaValue(analysis.target_market || '') === normalizedMarket
        );

        if (match) {
          setAnalysisResult({
            score: match.score ?? 0,
            strengths: Array.isArray(match.strengths) ? match.strengths : [],
            weaknesses: Array.isArray(match.weaknesses) ? match.weaknesses : [],
            recommendations: Array.isArray(match.recommendations) ? match.recommendations : [],
            marketSize: match.market_size || '',
            competition: match.competition || '',
            viability: match.viability || '',
          });
          toast.success('Loaded your saved analysis from the vault.');
          return;
        }
      }

      // Call Groq AI directly for analysis
      const analysisData = await analyzeIdeaWithGroq({
        title: ideaTitle,
        description: ideaDescription,
        targetMarket: targetMarket || null,
      });

      setAnalysisResult(analysisData);

      const { error: insertError } = await supabase
        .from('idea_analyses')
        .insert({
          user_id: user.id,
          idea_title: ideaTitle.trim(),
          idea_description: ideaDescription.trim(),
          target_market: targetMarket.trim() || null,
          score: analysisData.score,
          strengths: analysisData.strengths,
          weaknesses: analysisData.weaknesses,
          recommendations: analysisData.recommendations,
          market_size: analysisData.marketSize,
          competition: analysisData.competition,
          viability: analysisData.viability,
        });

      if (insertError) {
        console.error('Failed to save analysis:', insertError);
        toast.error('Analysis complete, but failed to save to your vault.');
      } else {
        toast.success('Analysis complete and saved to your vault.');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze idea. Please try again.';

      if (errorMessage.includes('Rate limit') || errorMessage.includes('rate_limit')) {
        toast.error('Rate limit exceeded. Please try again in a few moments.');
      } else if (errorMessage.includes('API key')) {
        toast.error('AI service is not configured. Please contact support.');
      } else {
        toast.error(errorMessage);
      }
      return;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateIdea = async () => {
    setIsGenerating(true);
    try {
      const generatedIdea = await generateIdeaWithGroq();

      setIdeaTitle(generatedIdea.title);
      setIdeaDescription(generatedIdea.description);
      setTargetMarket(generatedIdea.targetMarket);
      toast.success('New idea generated! Click "Analyze" to see its potential.');
    } catch (error) {
      console.error('Generation error:', error);
      // Fallback to mock idea if API fails
      const mockIdeas = [
        {
          title: "EcoTrack: Carbon Footprint Gamification",
          description: "A mobile app that tracks daily activities and calculates carbon footprint in real-time. Users earn points and rewards for eco-friendly choices, competing with friends to lower their impact.",
          targetMarket: "Environmentally conscious millennials and Gen Z"
        },
        {
          title: "SkillSwap: Local Learning Marketplace",
          description: "A hyper-local platform connecting neighbors who want to teach skills (cooking, coding, gardening) with those who want to learn. No money changes hands; it's a time-banking system.",
          targetMarket: "Community-focused urban residents"
        },
        {
          title: "MediMatch: AI Health Assistant for Seniors",
          description: "Voice-activated AI companion for elderly users that reminds them of medications, tracks symptoms, and alerts family members of any anomalies. Designed with extreme simplicity.",
          targetMarket: "Seniors 70+ and their caregivers"
        }
      ];
      const randomIdea = mockIdeas[Math.floor(Math.random() * mockIdeas.length)];

      setIdeaTitle(randomIdea.title);
      setIdeaDescription(randomIdea.description);
      setTargetMarket(randomIdea.targetMarket);

      toast.success('Generated a sample idea for you!');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download analysis report as PDF/Text
  const handleDownloadReport = (isDemoReport: boolean = false) => {
    const reportData = isDemoReport ? {
      title: 'AI-Powered Personal Finance Assistant',
      score: 85,
      strengths: [
        'Strong market demand with proven business model',
        'AI personalization differentiates from existing solutions',
        'Mobile-first approach aligns with user behavior trends'
      ],
      weaknesses: [
        'Competitive market with established players like Mint and YNAB',
        'User acquisition costs may be high in fintech space',
        'Requires bank API integrations which can be complex'
      ],
      recommendations: [
        'Focus on one specific user persona initially (e.g., freelancers with irregular income)',
        'Partner with banks for secure API access to simplify onboarding'
      ],
      marketSize: '$12B (TAM)',
      competition: 'Moderate - established players but room for innovation',
      viability: 'High Viability'
    } : {
      title: ideaTitle,
      score: analysisResult?.score || 0,
      strengths: analysisResult?.strengths || [],
      weaknesses: analysisResult?.weaknesses || [],
      recommendations: analysisResult?.recommendations || [],
      marketSize: analysisResult?.marketSize || '',
      competition: analysisResult?.competition || '',
      viability: analysisResult?.viability || ''
    };

    // Create text content for download
    const reportContent = `
STARTUP IDEA ANALYSIS REPORT
Generated by IdeaForge AI
========================================

IDEA: ${reportData.title}

OVERALL VIABILITY SCORE: ${reportData.score}/100

MARKET SIZE
${reportData.marketSize}

COMPETITION LEVEL
${reportData.competition}

VIABILITY ASSESSMENT
${reportData.viability}

========================================
STRENGTHS
========================================
${reportData.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

========================================
AREAS TO ADDRESS
========================================
${reportData.weaknesses.map((w, i) => `${i + 1}. ${w}`).join('\n')}

========================================
AI RECOMMENDATIONS
========================================
${reportData.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

========================================
Report generated on: ${new Date().toLocaleDateString()}

Powered by IdeaForge - Your AI-Powered Startup Companion
    `.trim();

    // Create and download the file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportData.title.replace(/[^a-z0-9]/gi, '_')}_Analysis_Report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Report downloaded successfully!');
  };

  // Save/Download report
  const handleSaveReport = () => {
    if (!analysisResult) {
      toast.error('No analysis to save');
      return;
    }

    // Download the report as a file
    handleDownloadReport(false);
  };

  const handleShareToCommunity = () => {
    if (!user) {
      toast.error('Please login to share your idea');
      return;
    }

    if (!analysisResult) {
      toast.error('Analyze your idea before sharing');
      return;
    }

    if (!isFormValid) {
      toast.error('Please fill in all required fields before sharing');
      return;
    }

    const authorName = profile?.name?.trim() || displayName?.trim() || 'Founder';
    const newIdea: CommunityIdea = {
      title: ideaTitle.trim(),
      description: ideaDescription.trim(),
      tags: buildTagsFromTargetMarket(targetMarket),
      upvotes: 0,
      comments: 0,
      author: authorName,
      authorAvatar: profile?.avatar || undefined,
      createdAt: new Date().toISOString(),
    };

    const saved = saveCommunityIdea(newIdea);
    if (saved) {
      toast.success('Shared to the community!');
    } else {
      toast.info('This idea is already shared in the community.');
    }
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
                  {/* Idea Generator Banner */}
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 p-4 border border-primary/10">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                          <Lightbulb className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Stuck for ideas?</h4>
                          <p className="text-xs text-muted-foreground">Let AI spark your imagination</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleGenerateIdea}
                        disabled={isGenerating}
                        variant="secondary"
                        size="sm"
                        className="w-full sm:w-auto bg-background/80 hover:bg-background shadow-sm"
                      >
                        {isGenerating ? (
                          <>
                            <Zap className="mr-2 h-3.5 w-3.5 animate-pulse text-primary" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
                            Generate Random Idea
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

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
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={handleSaveReport}
                      >
                        Save Report
                      </Button>
                      <Button
                        onClick={handleShareToCommunity}
                        disabled={!analysisResult}
                        title={!analysisResult ? 'Analyze your idea to enable sharing.' : undefined}
                        className="gradient-lavender rounded-xl"
                      >
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
              <Button
                className="gradient-lavender shadow-lavender flex-1 rounded-xl hover:opacity-90"
                onClick={() => handleDownloadReport(true)}
              >
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
