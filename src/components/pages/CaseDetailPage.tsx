import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Clock,
  Save,
  Send,
  Bold,
  Italic,
  List,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { DifficultyBadge } from '../DifficultyBadge';
import { LeaderboardWidget } from '../LeaderboardWidget';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { StarRating } from '../ui/star-rating';
import { supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api-client';

interface CaseDetailPageProps {
  onNavigate?: (page: string) => void;
}

export function CaseDetailPage({ onNavigate }: CaseDetailPageProps) {
  const { caseId } = useParams<{ caseId: string }>();
  const [solution, setSolution] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [evaluationData, setEvaluationData] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [caseData, setCaseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback mock data for when case is not found
  const defaultCase = {
    id: '1',
    company: 'PayStream',
    logo: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=100&h=100&fit=crop',
    title: 'Scaling User Acquisition',
    description:
      "PayStream is a B2B SaaS platform that helps companies manage their workflow automation. They've found initial product-market fit with 100 paying customers, but growth has plateaued.",
    problem:
      'The company needs to grow from 100 to 1000 users in 3 months with only $5,000 marketing budget. Traditional paid advertising channels are too expensive for their current CAC:LTV ratio. The team consists of 2 founders and 1 developer - no dedicated marketing expertise.',
    difficulty: 'Medium' as const,
    category: 'Marketing',
    tags: ['Growth', 'Marketing', 'B2B', 'SaaS'],
    estimatedTime: '45 minutes',
    reward: '500 points',
    publishedDate: 'Nov 5, 2025',
  };

  // Fetch case study from Supabase
  useEffect(() => {
    const fetchCaseStudy = async () => {
      if (!caseId) {
        console.warn('[CaseDetailPage] No caseId provided');
        setCaseData(defaultCase);
        setIsLoading(false);
        return;
      }

      console.log('[CaseDetailPage] Fetching case study with ID:', caseId);
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('case_studies')
          .select('*')
          .eq('id', caseId)
          .single();

        console.log('[CaseDetailPage] Query result:', { data, error });

        if (error || !data) {
          console.error('[CaseDetailPage] Case study not found:', error);
          // Set caseData to null to show not found message
          setCaseData(null);
        } else {
          console.log('[CaseDetailPage] Raw data from DB:', JSON.stringify(data, null, 2));
          
          // Transform DB data to component format
          const mapDifficulty = (d: string): 'Easy' | 'Medium' | 'Hard' => {
            switch (d) {
              case 'Beginner': return 'Easy';
              case 'Intermediate': return 'Medium';
              case 'Advanced': return 'Hard';
              default: return 'Medium';
            }
          };

          const transformedData = {
            id: data.id,
            company: data.company || 'Case Study',
            logo: data.image_url || 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=100&h=100&fit=crop',
            title: data.title || 'Untitled Case Study',
            description: data.background || data.problem_statement || 'No description available',
            problem: data.problem_statement || 'No problem statement available',
            difficulty: mapDifficulty(data.difficulty),
            category: data.category || 'General',
            tags: Array.isArray(data.tags) ? data.tags : (typeof data.tags === 'string' ? data.tags.split(',').map((t: string) => t.trim()) : []),
            estimatedTime: '45 minutes',
            reward: '500 points',
            publishedDate: data.created_at ? new Date(data.created_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            }) : 'Unknown date',
            // Additional fields from DB
            constraints: data.constraints || '',
            expectedOutcome: data.expected_outcome || '',
            hints: data.hints || [],
            solution: data.solution || '',
          };
          
          console.log('[CaseDetailPage] Transformed data:', transformedData);
          setCaseData(transformedData);
        }
      } catch (err) {
        console.error('[CaseDetailPage] Error fetching case study:', err);
        setCaseData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaseStudy();
  }, [caseId]);

  // Auto-save simulation
  useEffect(() => {
    if (solution.length > 0) {
      const timer = setTimeout(() => {
        setIsSaving(true);
        setTimeout(() => {
          setIsSaving(false);
          setLastSaved(new Date());
        }, 500);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [solution]);

  const handleSaveDraft = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 500);
  };

  interface CaseEvaluationResponse {
    score: number;
    verdict: string;
    feedback: string[];
    strengths: string[];
    improvements: string[];
  }

  const evaluateSolutionWithAI = async (userSolution: string) => {
    try {
      const response = await apiClient.post<CaseEvaluationResponse>('/api/ai/evaluate-case', {
        caseTitle: caseData.title,
        company: caseData.company,
        problem: caseData.problem,
        solution: userSolution,
      });
      return response;
    } catch (error) {
      console.error('AI evaluation error:', error);
      // Fallback to a basic evaluation based on solution length and keywords
      return getFallbackEvaluation(userSolution);
    }
  };

  const getFallbackEvaluation = (solution: string) => {
    const words = solution.split(/\s+/).length;
    const hasStrategy = /strateg|plan|approach|method/i.test(solution);
    const hasMetrics = /metric|kpi|measure|track|analytics/i.test(solution);
    const hasBudget = /budget|cost|spend|allocat|investment/i.test(solution);
    const hasTimeline = /timeline|week|month|phase|quarter/i.test(solution);

    let score = 60; // Base score

    if (words > 100) score += 10;
    if (words > 200) score += 5;
    if (hasStrategy) score += 10;
    if (hasMetrics) score += 10;
    if (hasBudget) score += 10;
    if (hasTimeline) score += 5;

    score = Math.min(score, 100);

    const feedback = [];
    const strengths = [];
    const improvements = [];

    if (hasStrategy) {
      strengths.push('Clear strategic approach identified');
    } else {
      improvements.push('Add more strategic thinking and overall approach');
    }

    if (hasMetrics) {
      strengths.push('Good focus on metrics and measurement');
    } else {
      improvements.push('Include specific KPIs and success metrics');
    }

    if (hasBudget) {
      strengths.push('Budget considerations addressed');
    } else {
      improvements.push('Provide detailed budget allocation breakdown');
    }

    if (words < 100) {
      improvements.push('Expand your solution with more detailed analysis');
    }

    feedback.push(...strengths, ...improvements.slice(0, 3 - strengths.length));

    return {
      score,
      verdict: score >= 70 ? 'Pass' : 'Try Again',
      feedback: feedback.slice(0, 3),
      strengths,
      improvements,
    };
  };

  const handleSubmit = async () => {
    setIsEvaluating(true);

    try {
      const evaluation = await evaluateSolutionWithAI(solution);
      setEvaluationData(evaluation);
      setShowEvaluationModal(true);
    } catch (error) {
      console.error('Evaluation error:', error);
      // Show error to user
      alert('Failed to evaluate solution. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleBack = () => {
    if (solution.length > 10 && !lastSaved) {
      setShowExitWarning(true);
    } else {
      onNavigate?.('CaseStudies');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading case study...</p>
        </div>
      </div>
    );
  }

  // Safety check for caseData
  if (!caseData) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Case study not found</h2>
          <Button variant="outline" onClick={() => onNavigate?.('CaseStudies')}>
            Back to Case Studies
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="border-border border-b bg-gradient-to-r from-[#C9A7EB]/10 to-transparent">
        <div className="mx-auto max-w-[1140px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={caseData.logo}
                alt={caseData.company}
                className="h-16 w-16 rounded-lg object-cover"
              />
              <div>
                <h1 className="mb-2">{caseData.title}</h1>
                <p className="text-muted-foreground">{caseData.company}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleBack} className="rounded-xl">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Button>
              <Button
                className="gradient-lavender shadow-lavender rounded-xl hover:opacity-90"
                onClick={() =>
                  document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Start Solving
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <DifficultyBadge difficulty={caseData.difficulty} />
            {caseData.tags.map((tag: string) => (
              <Badge key={tag} variant="outline" className="rounded-lg">
                {tag}
              </Badge>
            ))}
            <Badge variant="secondary" className="ml-auto rounded-lg">
              {caseData.publishedDate}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-[1140px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Problem Overview */}
            <Card className="glass-surface border-border/50">
              <CardContent className="p-6">
                <h2 className="mb-4">Problem Overview</h2>
                <p className="text-muted-foreground mb-6">{caseData.description}</p>
                <div className="glass-surface border-border/30 rounded-xl border p-4">
                  <h3 className="mb-3">The Challenge</h3>
                  <p className="text-muted-foreground leading-relaxed">{caseData.problem}</p>
                </div>
              </CardContent>
            </Card>

            {/* Info Bar */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="glass-surface border-border/50">
                <CardContent className="p-4 text-center">
                  <Clock className="text-primary mx-auto mb-2 h-5 w-5" />
                  <p className="text-muted-foreground text-sm">Estimated Time</p>
                  <p>{caseData.estimatedTime}</p>
                </CardContent>
              </Card>
              <Card className="glass-surface border-border/50">
                <CardContent className="p-4 text-center">
                  <DifficultyBadge difficulty={caseData.difficulty} className="mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">Difficulty</p>
                  <p>{caseData.difficulty}</p>
                </CardContent>
              </Card>
              <Card className="glass-surface border-border/50">
                <CardContent className="p-4 text-center">
                  <Badge className="mx-auto mb-2 bg-[#A9F5D0] text-[#0E1020]">
                    {caseData.reward}
                  </Badge>
                  <p className="text-muted-foreground text-sm">Reward</p>
                  <p>Points</p>
                </CardContent>
              </Card>
            </div>

            {/* Workspace Panel */}
            <Card id="workspace" className="glass-surface border-border/50">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2>Your Solution</h2>
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    {isSaving ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="border-primary h-3 w-3 rounded-full border-2 border-t-transparent"
                        />
                        <span>Saving...</span>
                      </>
                    ) : lastSaved ? (
                      <span>Saved {lastSaved.toLocaleTimeString()}</span>
                    ) : null}
                  </div>
                </div>

                {/* Editor Toolbar */}
                <div className="bg-muted/30 mb-4 flex gap-2 rounded-lg p-2">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <List className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </div>

                {/* Editor */}
                <Textarea
                  value={solution}
                  onChange={e => setSolution(e.target.value)}
                  placeholder="Describe your solution strategy here...&#10;&#10;Consider:&#10;• What channels would you prioritize?&#10;• How would you allocate the $5k budget?&#10;• What metrics would you track?&#10;• What's your 90-day execution plan?"
                  className="mb-4 min-h-[300px] resize-none rounded-xl"
                />

                {/* Submission Controls */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    className="rounded-xl"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                  </Button>
                  <Button
                    className="gradient-lavender shadow-lavender flex-1 rounded-xl hover:opacity-90"
                    onClick={handleSubmit}
                    disabled={solution.length < 50 || isEvaluating}
                  >
                    {isEvaluating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                        />
                        Evaluating...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Solution
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <LeaderboardWidget
              onViewLeaderboard={() => {
                // Navigate to Case Studies page with leaderboard tab active
                window.scrollTo(0, 0);
                onNavigate?.('Case Studies');
                // After navigation, we can use a URL parameter or state to show leaderboard tab
                setTimeout(() => {
                  // Trigger leaderboard tab selection if on Case Studies page
                  const event = new CustomEvent('showLeaderboard');
                  window.dispatchEvent(event);
                }, 100);
              }}
            />

            {/* Progress Card */}
            <Card className="glass-surface border-border/50">
              <CardContent className="p-6">
                <Tabs defaultValue="history">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="badges">Badges</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="report">Report</TabsTrigger>
                  </TabsList>
                  <TabsContent value="history" className="mt-4">
                    <div className="space-y-3">
                      <div className="text-muted-foreground py-8 text-center text-sm">
                        No previous attempts
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="badges" className="mt-4">
                    <div className="text-muted-foreground py-8 text-center text-sm">
                      Complete cases to earn badges
                    </div>
                  </TabsContent>
                  <TabsContent value="notes" className="mt-4">
                    <Textarea
                      placeholder="Add your notes here..."
                      className="min-h-[120px] resize-none rounded-xl"
                    />
                  </TabsContent>
                  <TabsContent value="report" className="mt-4">
                    {evaluationData ? (
                      <div className="space-y-4">
                        {/* Case Summary */}
                        <div>
                          <h4 className="mb-2 text-sm">Case Summary</h4>
                          <Card className="glass-surface border-border/30">
                            <CardContent className="text-muted-foreground p-3 text-xs">
                              Completed on {new Date().toLocaleDateString()}
                            </CardContent>
                          </Card>
                        </div>

                        {/* AI Evaluation */}
                        <div>
                          <h4 className="mb-2 text-sm">AI Evaluation</h4>
                          <Card className="glass-surface border-border/30">
                            <CardContent className="p-3">
                              <div className="mb-3 text-center">
                                <div className="text-gradient-lavender mb-1 text-2xl">
                                  {evaluationData.score}
                                </div>
                                <Progress value={evaluationData.score} className="h-1.5" />
                              </div>
                              <div className="text-muted-foreground space-y-1 text-xs">
                                {evaluationData.feedback.map((item: string, i: number) => (
                                  <div key={i} className="flex gap-1">
                                    <span className="text-primary">•</span>
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Improvement Suggestions */}
                        <div>
                          <h4 className="mb-2 text-sm">Suggestions</h4>
                          <Card className="glass-surface border-border/30">
                            <CardContent className="text-muted-foreground space-y-2 p-3 text-xs">
                              <div className="flex gap-2">
                                <CheckCircle2 className="text-primary mt-0.5 h-3 w-3 flex-shrink-0" />
                                <span>Consider more specific metrics and KPIs</span>
                              </div>
                              <div className="flex gap-2">
                                <CheckCircle2 className="text-primary mt-0.5 h-3 w-3 flex-shrink-0" />
                                <span>Add competitive analysis details</span>
                              </div>
                              <div className="flex gap-2">
                                <CheckCircle2 className="text-primary mt-0.5 h-3 w-3 flex-shrink-0" />
                                <span>Include risk mitigation strategies</span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Export Button */}
                        <Button
                          variant="outline"
                          className="h-8 w-full rounded-xl text-xs"
                          title="Export as PDF (mock)"
                        >
                          Export Report
                        </Button>
                      </div>
                    ) : (
                      <div className="text-muted-foreground py-8 text-center text-sm">
                        Complete the case to view your report
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Evaluation Modal */}
      <Dialog open={showEvaluationModal} onOpenChange={setShowEvaluationModal}>
        <DialogContent className="sm:max-w-[500px]">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <DialogHeader>
              <DialogTitle className="text-center text-2xl">
                Your Submission Has Been Evaluated
              </DialogTitle>
            </DialogHeader>
            {evaluationData && (
              <div className="space-y-6 py-6">
                {/* Score */}
                <div className="text-center">
                  <div className="text-gradient-lavender mb-2 text-5xl">{evaluationData.score}</div>
                  <p className="text-muted-foreground">out of 100</p>
                  <Progress value={evaluationData.score} className="mt-4" />
                </div>

                {/* Verdict */}
                <div className="text-center">
                  {evaluationData.verdict === 'Pass' ? (
                    <div className="flex items-center justify-center gap-2 text-[#A9F5D0]">
                      <CheckCircle2 className="h-6 w-6" />
                      <span className="text-xl">Passed!</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-[#FFD19C]">
                      <AlertCircle className="h-6 w-6" />
                      <span className="text-xl">Try Again</span>
                    </div>
                  )}
                </div>

                {/* Strengths */}
                {evaluationData.strengths && evaluationData.strengths.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      Strengths:
                    </h4>
                    <ul className="space-y-2">
                      {evaluationData.strengths.map((item: string, index: number) => (
                        <li key={index} className="text-muted-foreground flex gap-2 text-sm">
                          <span className="text-green-600 dark:text-green-400">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Areas for Improvement */}
                {evaluationData.improvements && evaluationData.improvements.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <AlertCircle className="h-5 w-5" />
                      Areas for Improvement:
                    </h4>
                    <ul className="space-y-2">
                      {evaluationData.improvements.map((item: string, index: number) => (
                        <li key={index} className="text-muted-foreground flex gap-2 text-sm">
                          <span className="text-orange-600 dark:text-orange-400">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* General Feedback */}
                {evaluationData.feedback && evaluationData.feedback.length > 0 && (
                  <div className="space-y-2">
                    <h4>Overall Feedback:</h4>
                    <ul className="space-y-2">
                      {evaluationData.feedback.map((item: string, index: number) => (
                        <li key={index} className="text-muted-foreground flex gap-2 text-sm">
                          <span className="text-primary">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* User Rating Section */}
                <div className="space-y-3 border-t pt-4">
                  <h4>Rate this case study:</h4>
                  <div className="flex flex-col items-center gap-3">
                    <StarRating 
                      rating={userRating}
                      onRatingChange={setUserRating}
                      size="lg"
                    />
                    {userRating > 0 && (
                      <p className="text-sm text-muted-foreground text-center">
                        Thank you for your feedback! This helps us improve our case studies.
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowEvaluationModal(false)}
                    className="flex-1 rounded-xl"
                  >
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary flex-1 rounded-xl hover:text-white"
                  >
                    View Leaderboard
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Exit Warning Modal */}
      <Dialog open={showExitWarning} onOpenChange={setShowExitWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Progress</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to leave?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex gap-3">
            <Button
              className="gradient-lavender flex-1 rounded-xl hover:opacity-90"
              onClick={() => setShowExitWarning(false)}
            >
              Stay
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-xl"
              onClick={() => {
                setShowExitWarning(false);
                onNavigate?.('CaseStudies');
              }}
            >
              Leave
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
