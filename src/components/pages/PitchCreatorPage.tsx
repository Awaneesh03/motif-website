import { useState, useEffect } from 'react';
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
  TrendingUp,
  FolderOpen,
  Loader2,
  FileText,
} from 'lucide-react';
import jsPDF from 'jspdf';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../contexts/UserContext';
import { apiClient, PitchResponse, PitchSlideContent } from '../../lib/api-client';

interface SavedIdea {
  id: string;
  idea_title: string;
  idea_description: string;
  target_market: string | null;
  market_size: string | null;
  recommendations: string[] | null;
}

interface PitchCreatorPageProps {
  onNavigate?: (page: string) => void;
}

export function PitchCreatorPage({ onNavigate }: PitchCreatorPageProps) {
  const { user } = useUser();
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

  // Saved ideas state
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);

  // Fetch the user's saved analyses to pre-fill the form
  useEffect(() => {
    if (!user?.id) return;
    const fetchSavedIdeas = async () => {
      setIsLoadingIdeas(true);
      try {
        const { data } = await supabase
          .from('idea_analyses')
          .select('id, idea_title, idea_description, target_market, market_size, recommendations')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setSavedIdeas(data ?? []);
      } catch {
        // Silent fail — selector just stays empty
      } finally {
        setIsLoadingIdeas(false);
      }
    };
    fetchSavedIdeas();
  }, [user?.id]);

  // Pre-fill form when user selects a saved idea
  const handleSelectIdea = (ideaId: string) => {
    const idea = savedIdeas.find(i => i.id === ideaId);
    if (!idea) return;

    // Use the first two recommendations as a starting point for the solution field
    const recs = Array.isArray(idea.recommendations) ? idea.recommendations : [];
    const solutionHint = recs.slice(0, 2).join('. ').substring(0, 500);

    setFormData({
      ideaName: (idea.idea_title || '').substring(0, 100),
      problem: (idea.idea_description || '').substring(0, 500),
      solution: solutionHint,
      audience: (idea.target_market || '').substring(0, 100),
      market: (idea.market_size || '').substring(0, 100),
      usp: '',
    });
    toast.success(`Loaded "${idea.idea_title}" — fill in the solution field and generate your pitch.`);
  };

  const inferIconFromTitle = (title: string): string => {
    const lower = title.toLowerCase();
    if (lower.includes('problem')) return 'problem';
    if (lower.includes('solution')) return 'solution';
    if (lower.includes('market')) return 'market';
    if (lower.includes('product')) return 'product';
    if (lower.includes('business') || lower.includes('model') || lower.includes('revenue')) return 'business';
    if (lower.includes('ask') || lower.includes('investment') || lower.includes('funding')) return 'ask';
    return 'product';
  };

  const handleGeneratePitch = async () => {
    setIsGenerating(true);

    try {
      let pitchData;

      try {
        const response = await apiClient.postLong<PitchResponse>('/api/ai/generate-pitch', {
          ideaName: formData.ideaName,
          problem: formData.problem,
          solution: formData.solution,
          audience: formData.audience || null,
          market: formData.market || null,
          usp: formData.usp || null,
        });

        pitchData = {
          slides: response.slides.map((slide: PitchSlideContent) => ({
            title: slide.title,
            content: slide.content,
            bulletPoints: slide.bulletPoints,
            icon: inferIconFromTitle(slide.title),
          })),
          speakerNotes: response.speakerNotes,
        };
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.toLowerCase().includes('failed to fetch') ||
            error.message.toLowerCase().includes('network') ||
            error.message.toLowerCase().includes('timed out') ||
            error.message.toLowerCase().includes('waking up'))
        ) {
          pitchData = {
            slides: [
              { title: 'The Problem', content: formData.problem, icon: 'problem' },
              { title: 'Our Solution', content: formData.solution, icon: 'solution' },
              { title: 'Market Opportunity', content: formData.market || 'Large and growing addressable market', icon: 'market' },
              { title: 'The Product', content: `${formData.ideaName}: ${formData.usp || 'Unique product offering'}`, icon: 'product' },
            ],
          };
        } else {
          throw error;
        }
      }

      setGeneratedSlides(pitchData);
      setShowPitchModal(true);
      toast.success('Pitch deck generated!');

      // Save pitch to Supabase
      if (user?.id) {
        try {
          const { data: ideaData, error: ideaError } = await supabase
            .from('idea_analyses')
            .insert({
              idea_title: formData.ideaName,
              idea_description: formData.problem,
              target_market: formData.market || null,
              user_id: user.id,
              score: 0,
              strengths: [],
              weaknesses: [],
              recommendations: [],
              market_size: formData.market || null,
              competition: null,
              viability: null,
            })
            .select()
            .single();

          if (!ideaError && ideaData) {
            await supabase.from('pitches').insert({
              user_id: user.id,
              idea_id: ideaData.id,
              title: formData.ideaName,
            });
          }
        } catch (saveError) {
          console.error('Failed to save pitch to database:', saveError);
        }
      }
    } catch (error) {
      console.error('Pitch generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate pitch. Please try again.');
      setIsGenerating(false);
      return;
    }

    setIsGenerating(false);
  };

  // Validation
  const isIdeaNameValid = formData.ideaName.trim().length >= 3;
  const isProblemValid = formData.problem.trim().length >= 20;
  const isSolutionValid = formData.solution.trim().length >= 20;
  const isFormValid = isIdeaNameValid && isProblemValid && isSolutionValid;

  const slideIcons: Record<string, any> = {
    problem: Target,
    solution: Lightbulb,
    market: TrendingUp,
    product: Sparkles,
    business: Presentation,
    ask: Target,
  };

  // --- PDF Download ---
  const handleDownloadPDF = () => {
    if (!generatedSlides) {
      toast.error('No pitch deck to download');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();   // 297 mm
    const pageH = doc.internal.pageSize.getHeight();  // 210 mm
    const margin = 22;

    // ── Cover page ──────────────────────────────────────────────────
    doc.setFillColor(201, 167, 235);         // lavender #C9A7EB
    doc.rect(0, 0, pageW, pageH, 'F');

    doc.setFillColor(150, 90, 210);          // darker accent strip at bottom
    doc.rect(0, pageH - 18, pageW, 18, 'F');

    // Idea name
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(34);
    const titleLines = doc.splitTextToSize(formData.ideaName, pageW - margin * 2);
    doc.text(titleLines, pageW / 2, pageH / 2 - 14, { align: 'center' });

    // Subtitle
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.text('AI-Generated Pitch Deck', pageW / 2, pageH / 2 + (titleLines.length - 1) * 12 + 6, { align: 'center' });

    // Footer
    doc.setFontSize(9);
    doc.text(
      `Generated by Motif  ·  ${new Date().toLocaleDateString()}`,
      pageW / 2,
      pageH - 7,
      { align: 'center' }
    );

    // ── Slide pages ─────────────────────────────────────────────────
    generatedSlides.slides.forEach((slide: any, index: number) => {
      doc.addPage();

      // Header bar
      doc.setFillColor(201, 167, 235);
      doc.rect(0, 0, pageW, 16, 'F');

      // Slide counter (top-right)
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(
        `${index + 1} / ${generatedSlides.slides.length}`,
        pageW - margin,
        10,
        { align: 'right' }
      );

      // Slide title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 20, 60);
      doc.text(slide.title, margin, 34);

      // Divider
      doc.setDrawColor(201, 167, 235);
      doc.setLineWidth(0.6);
      doc.line(margin, 39, pageW - margin, 39);

      // Content text
      let y = 52;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(70, 50, 100);
      if (slide.content) {
        const contentLines = doc.splitTextToSize(slide.content, pageW - margin * 2);
        doc.text(contentLines, margin, y);
        y += contentLines.length * 6 + 8;
      }

      // Bullet points
      if (slide.bulletPoints?.length) {
        slide.bulletPoints.forEach((point: string) => {
          if (y > pageH - 22) return;
          // Bullet dot
          doc.setFillColor(150, 90, 210);
          doc.circle(margin + 2.5, y - 2, 1.5, 'F');
          // Bullet text
          doc.setTextColor(60, 40, 90);
          doc.setFontSize(10);
          const bLines = doc.splitTextToSize(point, pageW - margin * 2 - 10);
          doc.text(bLines, margin + 8, y);
          y += bLines.length * 5.5 + 4;
        });
      }

      // Footer strip
      doc.setFillColor(240, 230, 250);
      doc.rect(0, pageH - 10, pageW, 10, 'F');
      doc.setFontSize(7);
      doc.setTextColor(130, 100, 180);
      doc.text('Motif — Your AI-Powered Startup Companion', pageW / 2, pageH - 3.5, { align: 'center' });
    });

    const filename = `${formData.ideaName.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}_Pitch_Deck.pdf`;
    doc.save(filename);
    toast.success('PDF downloaded!');
  };

  const handleRegeneratePitch = async () => {
    if (!isFormValid) {
      toast.error('Please fill in all required fields');
      return;
    }
    await handleGeneratePitch();
  };

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#C9A7EB]/15 via-background to-background py-6 sm:py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 text-center sm:flex-row sm:gap-4 sm:text-left"
          >
            <div className="gradient-lavender flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl shadow-lavender">
              <Presentation className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-gradient-lavender text-xl sm:text-2xl">Create Your Startup Pitch</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Turn your idea into a professional pitch deck in minutes
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-6 sm:py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Input Form */}
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

                  {/* ── Load from Saved Idea ── */}
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />
                      <Label className="text-sm font-medium">Load from a Saved Analysis (Optional)</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Select one of your previously analyzed ideas to auto-fill the form below.
                    </p>
                    {isLoadingIdeas ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading your ideas...
                      </div>
                    ) : savedIdeas.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-1">
                        No saved analyses found.{' '}
                        <button
                          type="button"
                          onClick={() => onNavigate?.('Idea Analyser')}
                          className="text-primary underline underline-offset-2"
                        >
                          Analyze an idea first
                        </button>
                      </p>
                    ) : (
                      <Select onValueChange={handleSelectIdea}>
                        <SelectTrigger className="rounded-lg bg-background">
                          <SelectValue placeholder="Select a saved idea…" />
                        </SelectTrigger>
                        <SelectContent>
                          {savedIdeas.map(idea => (
                            <SelectItem key={idea.id} value={idea.id}>
                              {idea.idea_title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

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

            {/* Tips & Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <Card className="glass-surface border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3 text-sm">
                  <div className="flex gap-2">
                    <CheckCircle className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p>Keep your problem statement clear and concise</p>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p>Focus on the unique value you bring</p>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p>Use data to support your market claims</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-surface border-border/50 bg-gradient-to-br from-[#C9A7EB]/10 to-[#B084E8]/10">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground text-sm text-left">
                      AI generates a 10-slide deck. Download as a styled PDF ready to share with investors.
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
            className="mt-8"
          >
            <Card className="glass-surface border-border/50">
              <CardHeader>
                <CardTitle>Learn What Makes a Great Pitch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
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
                  <Button variant="outline" className="rounded-xl" onClick={() => onNavigate?.('Resources')}>
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
              Review your pitch deck slides. Download as PDF or regenerate as needed.
            </DialogDescription>
          </DialogHeader>
          {generatedSlides && (
            <div className="space-y-4 py-4">
              {/* Slides Preview */}
              {generatedSlides.slides.map((slide: any, index: number) => {
                const IconComponent = slideIcons[slide.icon] ?? Sparkles;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <Card className="glass-surface border-border/50">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="gradient-lavender flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl">
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <Badge variant="outline" className="mb-2 text-xs">
                              Slide {index + 1}
                            </Badge>
                            <h4 className="mb-1.5 text-sm font-semibold">{slide.title}</h4>
                            <p className="text-muted-foreground text-sm">{slide.content}</p>
                            {slide.bulletPoints?.length > 0 && (
                              <ul className="mt-2 space-y-1">
                                {slide.bulletPoints.map((point: string, i: number) => (
                                  <li key={i} className="text-muted-foreground text-sm flex gap-2">
                                    <span className="text-primary flex-shrink-0">–</span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowPitchModal(false)}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={handleRegeneratePitch}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="mr-2 h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                      />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </>
                  )}
                </Button>
                <Button
                  className="gradient-lavender shadow-lavender flex-1 rounded-xl hover:opacity-90"
                  onClick={handleDownloadPDF}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
