import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../lib/supabase';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
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
  Upload,
  X,
  File,
  RefreshCw,
} from 'lucide-react';

// Set up PDF.js worker
GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Progress } from '../ui/progress';
import { analyzeIdeaWithGroq, generateIdeaWithGroq, improveDescriptionWithGroq } from '../../lib/groqAnalysis';

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
  
  // Storage key for persisting form data (sessionStorage = cleared on new tab)
  const FORM_STORAGE_KEY = 'motif-idea-analyser-form';
  
  // Clear old localStorage data (migration to sessionStorage)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(FORM_STORAGE_KEY);
    }
  }, []);
  
  // Load saved form data from sessionStorage (only persists within same tab)
  const getSavedFormData = () => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = sessionStorage.getItem(FORM_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };
  
  const savedData = getSavedFormData();
  
  const [ideaTitle, setIdeaTitle] = useState(savedData?.ideaTitle || '');
  const [ideaDescription, setIdeaDescription] = useState(savedData?.ideaDescription || '');
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(savedData?.selectedMarkets || []);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(savedData?.analysisResult || null);
  const [showDemoReportModal, setShowDemoReportModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImprovingDescription, setIsImprovingDescription] = useState(false);

  // Animated analysis progress state
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const analysisTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analysisStartRef = useRef<number>(0);

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Persist form data to sessionStorage whenever it changes (cleared on new tab)
  useEffect(() => {
    const formData = {
      ideaTitle,
      ideaDescription,
      selectedMarkets,
      analysisResult,
    };
    sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
  }, [ideaTitle, ideaDescription, selectedMarkets, analysisResult]);

  // Drive staged progress while the API call is in-flight.
  // Stages:  0–20% | 20–40% | 40–60% | 60–80% | 80–95%
  // Each stage fills with quadratic ease-out over its allotted duration.
  // Stage 4 fills slowly (30 s budget) and waits for the API.
  // Progress jumps to 100% only when the API responds (see handleAnalyze).
  useEffect(() => {
    if (!isAnalyzing) {
      // Clear timer but keep progress value — the exit animation (300 ms)
      // should still show whatever progress was reached, not snap to 0.
      if (analysisTimerRef.current) {
        clearInterval(analysisTimerRef.current);
        analysisTimerRef.current = null;
      }
      return;
    }

    // New analysis starting — reset to zero
    setAnalysisStep(0);
    setAnalysisProgress(0);
    analysisStartRef.current = Date.now();

    // Duration each stage is allowed before advancing (ms)
    const STAGE_DURATIONS = [3000, 5000, 6000, 6000]; // stages 0–3
    // Percentage ceiling for each stage (index 4 = open-ended last stage)
    const STAGE_CAPS = [20, 40, 60, 80, 95];
    const TOTAL_STAGED_MS = STAGE_DURATIONS.reduce((a, b) => a + b, 0); // 20 000 ms

    analysisTimerRef.current = setInterval(() => {
      const totalElapsed = Date.now() - analysisStartRef.current;

      // Determine which stage we're in and how far through it
      let stage = STAGE_DURATIONS.length; // 4 = last open-ended stage
      let stageElapsed = totalElapsed - TOTAL_STAGED_MS; // default for stage 4
      let cumulative = 0;

      for (let i = 0; i < STAGE_DURATIONS.length; i++) {
        if (totalElapsed < cumulative + STAGE_DURATIONS[i]) {
          stage = i;
          stageElapsed = totalElapsed - cumulative;
          break;
        }
        cumulative += STAGE_DURATIONS[i];
      }

      setAnalysisStep(stage);

      const stageMin = stage === 0 ? 0 : (STAGE_CAPS[stage - 1] ?? 80);
      const stageMax = STAGE_CAPS[Math.min(stage, STAGE_CAPS.length - 1)] ?? 95;
      // Last stage fills very slowly (30 s budget) so it never actually reaches 95%
      const stageDuration = stage < STAGE_DURATIONS.length ? STAGE_DURATIONS[stage] : 30000;

      // Quadratic ease-out: fast start → natural deceleration at the cap
      const t = Math.min(1, stageElapsed / stageDuration);
      const eased = 1 - (1 - t) * (1 - t);
      const p = stageMin + (stageMax - stageMin) * eased;

      setAnalysisProgress(Math.round(p * 10) / 10);
    }, 100); // 100 ms tick — smooth at 60 fps

    return () => {
      if (analysisTimerRef.current) {
        clearInterval(analysisTimerRef.current);
        analysisTimerRef.current = null;
      }
    };
  }, [isAnalyzing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Predefined target market options
  const MARKET_OPTIONS = [
    'B2B',
    'B2C',
    'SaaS',
    'Students',
    'Enterprises',
    'Creators',
    'SMBs',
    'Developers',
    'Healthcare',
    'E-commerce',
  ];

  const ANALYSIS_STAGES = [
    { label: 'Reading your idea', detail: 'Parsing title, description and market context', Icon: FileText },
    { label: 'Evaluating market opportunity', detail: 'Sizing TAM / SAM and growth trajectory', Icon: TrendingUp },
    { label: 'Scanning competition', detail: 'Mapping the competitive landscape and positioning gaps', Icon: Users },
    { label: 'Scoring execution & risk', detail: 'Weighing feasibility against known risk factors', Icon: Zap },
    { label: 'Generating VC-grade insights', detail: 'Compiling strengths, weaknesses and recommendations', Icon: Sparkles },
  ] as const;

  const COMMUNITY_STORAGE_KEY = 'motif-community-ideas';

  const normalizeIdeaValue = (value: string) =>
    value.trim().replace(/\s+/g, ' ').toLowerCase();

  const buildTagsFromTargetMarket = (markets: string[]) => {
    return markets.length > 0 ? markets.slice(0, 3) : ['General'];
  };

  const toggleMarket = (market: string) => {
    setSelectedMarkets(prev =>
      prev.includes(market)
        ? prev.filter(m => m !== market)
        : prev.length < 3 ? [...prev, market] : prev
    );
  };

  // Sanitize extracted text to remove characters that cause PostgreSQL errors
  const sanitizeExtractedText = (text: string): string => {
    return text
      .replace(/\0/g, '') // Remove null bytes — PostgreSQL rejects these in TEXT columns
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars (keep \t \n \r)
      .trim();
  };

  // File upload handlers
  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  };

  const handleFileSelect = async (file: File) => {
    const allowedTypes = ['application/pdf', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or text file');
      return;
    }

    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    setIsExtracting(true);

    try {
      let extractedText = '';
      
      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPDF(file);
      } else {
        extractedText = await file.text();
      }

      if (!extractedText || extractedText.length < 50) {
        toast.error('Could not extract enough text from the file. Please try a different file or enter details manually.');
        setUploadedFile(null);
        return;
      }

      // Sanitize to remove null bytes and control chars that cause PostgreSQL save failures
      const sanitized = sanitizeExtractedText(extractedText);

      // Truncate if too long (backend accepts up to 10000 chars)
      const truncatedText = sanitized.length > 10000
        ? sanitized.substring(0, 10000)
        : sanitized;

      // Try to extract a title from the first line or use filename
      const lines = sanitized.split('\n').filter(l => l.trim());
      const potentialTitle = lines[0]?.substring(0, 100) || file.name.replace(/\.[^/.]+$/, '');
      
      setIdeaTitle(potentialTitle.length > 5 ? potentialTitle : file.name.replace(/\.[^/.]+$/, ''));
      setIdeaDescription(truncatedText);
      
      toast.success('Document content extracted! Review and click "Analyze" to get insights.');
    } catch (error) {
      console.error('Error extracting text:', error);
      toast.error('Failed to extract text from file. Please try again.');
      setUploadedFile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setIdeaTitle('');
    setIdeaDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearForm = () => {
    setIdeaTitle('');
    setIdeaDescription('');
    setSelectedMarkets([]);
    setAnalysisResult(null);
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    sessionStorage.removeItem(FORM_STORAGE_KEY);
    toast.success('Form cleared');
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

  const handleAnalyze = async (forceReanalyze: boolean = false) => {
    console.log('[IdeaAnalyser] handleAnalyze called, forceReanalyze:', forceReanalyze);
    console.log('[IdeaAnalyser] Form valid:', isFormValid, 'User:', !!user);
    
    if (!isFormValid) {
      toast.error('Please fill in all required fields with minimum lengths');
      return;
    }

    if (!user) {
      toast.error('Please login to analyze your idea');
      return;
    }

    setIsAnalyzing(true);
    let apiCallSucceeded = false; // tracks whether the full AI call completed (not a cache hit)
    console.log('[IdeaAnalyser] Starting analysis...');

    try {
      const normalizedTitle = normalizeIdeaValue(ideaTitle);
      const normalizedDescription = normalizeIdeaValue(ideaDescription);
      const normalizedMarket = selectedMarkets.join(', ').trim().replace(/\s+/g, ' ').toLowerCase();

      // Skip cache check if force re-analyze is requested
      if (!forceReanalyze) {
        console.log('[IdeaAnalyser] Checking for existing analyses...');
        const { data: existingAnalyses, error: existingError } = await supabase
          .from('idea_analyses')
          .select(
            'id, idea_title, idea_description, target_market, score, strengths, weaknesses, recommendations, market_size, competition, viability'
          )
          .eq('user_id', user.id);

        console.log('[IdeaAnalyser] Existing analyses:', existingAnalyses?.length, 'Error:', existingError);

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
      } else {
        console.log('[IdeaAnalyser] Force re-analyze requested, skipping cache');
        // Delete old cached results for this idea to ensure fresh analysis
        const normalizedTitle = normalizeIdeaValue(ideaTitle);
        const { data: existingAnalyses } = await supabase
          .from('idea_analyses')
          .select('id, idea_title')
          .eq('user_id', user.id);
        
        if (existingAnalyses) {
          const matchingIds = existingAnalyses
            .filter(a => normalizeIdeaValue(a.idea_title) === normalizedTitle)
            .map(a => a.id);
          
          if (matchingIds.length > 0) {
            console.log('[IdeaAnalyser] Deleting old cached analyses:', matchingIds);
            await supabase.from('idea_analyses').delete().in('id', matchingIds);
          }
        }
      }

      // Call backend API for analysis (backend also persists the result)
      console.log('[IdeaAnalyser] Calling analyzeIdeaWithGroq...');
      const analysisData = await analyzeIdeaWithGroq({
        title: ideaTitle,
        description: ideaDescription,
        targetMarket: selectedMarkets.length > 0 ? selectedMarkets.join(', ') : null,
      });

      console.log('[IdeaAnalyser] Analysis result received:', analysisData);
      setAnalysisResult(analysisData);
      apiCallSucceeded = true;
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('[IdeaAnalyser] Analysis error caught in component:', error);
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
      // Jump to 100% only when the full AI call succeeded (not on cache hits or errors).
      // setAnalysisProgress and setIsAnalyzing are batched by React 18, so the loading
      // card shows 100% for exactly its 300 ms exit animation before unmounting.
      if (apiCallSucceeded) setAnalysisProgress(100);
      setIsAnalyzing(false);
    }
  };

  const handleImproveDescription = async () => {
    if (!ideaDescription.trim()) {
      toast.error('Please enter a description first');
      return;
    }

    setIsImprovingDescription(true);
    try {
      const improvedDescription = await improveDescriptionWithGroq(ideaDescription);
      setIdeaDescription(improvedDescription);
      toast.success('Description improved with AI!');
    } catch (error) {
      console.error('Improvement error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to improve description';

      if (errorMessage.includes('Rate limit') || errorMessage.includes('rate_limit')) {
        toast.error('Rate limit exceeded. Please try again in a few moments.');
      } else if (errorMessage.includes('API key')) {
        toast.error('AI service is not configured. Please contact support.');
      } else {
        toast.error('Failed to improve description. Please try again.');
      }
    } finally {
      setIsImprovingDescription(false);
    }
  };

  const handleGenerateIdea = async () => {
    setIsGenerating(true);
    try {
      const generatedIdea = await generateIdeaWithGroq();

      setIdeaTitle(generatedIdea.title);
      setIdeaDescription(generatedIdea.description);
      // Parse target market from generated idea - try to match with predefined options
      const generatedMarkets = generatedIdea.targetMarket?.split(/[,&]/).map(m => m.trim()) || [];
      const matchedMarkets = MARKET_OPTIONS.filter(opt => 
        generatedMarkets.some(gm => gm.toLowerCase().includes(opt.toLowerCase()))
      ).slice(0, 3);
      setSelectedMarkets(matchedMarkets.length > 0 ? matchedMarkets : ['B2C']);
      toast.success('New idea generated! Click "Analyze" to see its potential.');
    } catch (error) {
      console.error('Generation error:', error);
      // Fallback to mock idea if API fails
      const mockIdeas = [
        {
          title: "EcoTrack: Carbon Footprint Gamification",
          description: "A mobile app that tracks daily activities and calculates carbon footprint in real-time. Users earn points and rewards for eco-friendly choices, competing with friends to lower their impact.",
          markets: ["B2C", "Students"]
        },
        {
          title: "SkillSwap: Local Learning Marketplace",
          description: "A hyper-local platform connecting neighbors who want to teach skills (cooking, coding, gardening) with those who want to learn. No money changes hands; it's a time-banking system.",
          markets: ["B2C", "Creators"]
        },
        {
          title: "MediMatch: AI Health Assistant for Seniors",
          description: "Voice-activated AI companion for elderly users that reminds them of medications, tracks symptoms, and alerts family members of any anomalies. Designed with extreme simplicity.",
          markets: ["B2C", "Healthcare"]
        }
      ];
      const randomIdea = mockIdeas[Math.floor(Math.random() * mockIdeas.length)];

      setIdeaTitle(randomIdea.title);
      setIdeaDescription(randomIdea.description);
      setSelectedMarkets(randomIdea.markets);

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
      tags: buildTagsFromTargetMarket(selectedMarkets),
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
      <section className="relative overflow-hidden border-b border-border/50 bg-gradient-to-b from-[#C9A7EB]/15 via-background to-background py-8 md:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="gradient-lavender mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-gradient-lavender mb-2 text-2xl md:text-3xl font-bold">AI Idea Analyser</h1>
            <p className="text-muted-foreground mx-auto max-w-xl text-sm md:text-base">
              Get instant AI-powered feedback on your startup idea. Analyze market potential,
              competition, and viability in seconds.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-6 md:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Input Form - Left Column */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-8"
            >
              <Card className="glass-card border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                      <Sparkles className="text-primary h-4 w-4" />
                      Tell Us About Your Idea
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {(ideaTitle || ideaDescription || analysisResult) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearForm}
                          className="rounded-lg text-muted-foreground hover:text-destructive w-fit h-8 px-3"
                        >
                          <X className="mr-1.5 h-3.5 w-3.5" />
                          Clear
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onNavigate?.('saved-ideas')}
                        className="rounded-lg text-muted-foreground hover:text-foreground w-fit h-8 px-3"
                      >
                        <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
                        Saved Ideas
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-2">
                  {/* Idea Generator Banner */}
                  <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5 p-4 border border-primary/10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                          <Lightbulb className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">Stuck for ideas?</h4>
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

                  {/* File Upload Zone */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Pitch Deck or Document (Optional)
                    </Label>
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => !uploadedFile && fileInputRef.current?.click()}
                      className={`
                        relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                        transition-all duration-200
                        ${isDragging 
                          ? 'border-primary bg-primary/5' 
                          : uploadedFile 
                            ? 'border-green-500/50 bg-green-500/5' 
                            : 'border-border hover:border-primary/50 hover:bg-muted/30'
                        }
                        ${isExtracting ? 'pointer-events-none opacity-70' : ''}
                      `}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                      
                      {isExtracting ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          <p className="text-sm text-muted-foreground">Extracting content...</p>
                        </div>
                      ) : uploadedFile ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                              <File className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-sm">{uploadedFile.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(uploadedFile.size / 1024).toFixed(1)} KB - Content extracted
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeUploadedFile();
                            }}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <Upload className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Drop your file here or click to browse</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Supports PDF and TXT files (max 10MB)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    {uploadedFile && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Content extracted! Review below and click "Analyze My Idea" to get insights.
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or enter manually</span>
                    </div>
                  </div>

                  {/* Idea Title */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ideaTitle" className="text-sm font-medium">Idea Title *</Label>
                    <Input
                      id="ideaTitle"
                      placeholder="e.g., AI-powered fitness coach for busy professionals"
                      value={ideaTitle}
                      onChange={e => setIdeaTitle(e.target.value)}
                      className="h-11 rounded-lg"
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
                  <div className="space-y-1.5">
                    <Label htmlFor="ideaDescription" className="text-sm font-medium">Detailed Description *</Label>
                    <Textarea
                      id="ideaDescription"
                      placeholder="Example: A platform that helps students manage study schedules with AI reminders."
                      value={ideaDescription}
                      onChange={e => setIdeaDescription(e.target.value)}
                      className="min-h-[140px] resize-none rounded-lg"
                      maxLength={10000}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground text-xs">
                        {ideaDescription.length >= 20 ? (
                          <span className="text-green-600">✓ {ideaDescription.length}/10000 characters</span>
                        ) : (
                          <span>Minimum 20 characters ({ideaDescription.length}/10000)</span>
                        )}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleImproveDescription}
                        disabled={!ideaDescription.trim() || isImprovingDescription}
                        className="text-primary hover:text-primary h-auto px-2 py-1"
                      >
                        {isImprovingDescription ? (
                          <>
                            <Zap className="mr-1.5 h-3.5 w-3.5 animate-pulse" />
                            <span className="text-xs">Improving...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                            <span className="text-xs">Improve with AI</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Target Market */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Target Market (Optional - select up to 3)</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {MARKET_OPTIONS.map((market) => (
                        <button
                          key={market}
                          type="button"
                          onClick={() => toggleMarket(market)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            selectedMarkets.includes(market)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                          }`}
                        >
                          {market}
                        </button>
                      ))}
                    </div>
                    {selectedMarkets.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {selectedMarkets.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Analyze Button */}
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={() => handleAnalyze(false)}
                      disabled={!isFormValid || isAnalyzing}
                      className="gradient-lavender shadow-lavender h-11 flex-1 rounded-lg hover:opacity-90"
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
                    {analysisResult && (
                      <Button
                        onClick={() => handleAnalyze(true)}
                        disabled={!isFormValid || isAnalyzing}
                        variant="outline"
                        className="h-11 rounded-lg border-primary/30 hover:bg-primary/10"
                        title="Get a fresh analysis with updated AI"
                      >
                        <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats - Right Column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-4 space-y-4"
            >
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Platform Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pb-4">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground text-sm">Ideas Analyzed</span>
                    <span className="font-semibold">12,450</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground text-sm">Success Rate</span>
                    <span className="font-semibold text-green-600">67%</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground text-sm">Avg. Score</span>
                    <span className="font-semibold">72/100</span>
                  </div>
                </CardContent>
              </Card>

              <div className="rounded-lg bg-gradient-to-br from-[#C9A7EB]/8 to-[#B084E8]/8 p-4 border border-primary/10">
                <div className="flex items-start gap-3">
                  <div className="gradient-lavender flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Our AI analyzes market data, competition, and trends to give you actionable insights.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Animated Analysis Loading State ─────────────────────── */}
          <AnimatePresence mode="wait">
            {isAnalyzing && (
              <motion.div
                key="analyzing-state"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mt-12"
              >
                <Card className="glass-card border-primary/20 overflow-hidden">
                  {/* Sliding shimmer bar at the top */}
                  <div className="relative h-0.5 w-full overflow-hidden bg-primary/10">
                    <motion.div
                      className="absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-transparent via-primary/70 to-transparent"
                      animate={{ x: ['-100%', '350%'] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>

                  <CardContent className="p-6 sm:p-8">
                    {/* Header row */}
                    <div className="mb-6 flex items-center gap-3">
                      {/* Icon with live dot */}
                      <div className="relative flex-shrink-0">
                        <div className="gradient-lavender flex h-11 w-11 items-center justify-center rounded-xl shadow-lavender">
                          <motion.div
                            animate={{ rotate: [0, 14, -14, 0] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            <Sparkles className="h-5 w-5 text-white" />
                          </motion.div>
                        </div>
                        {/* Ping dot */}
                        <span className="absolute -right-1 -top-1 flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">AI is analysing your idea</p>
                        <p className="text-muted-foreground text-xs truncate">"{ideaTitle}"</p>
                      </div>

                      {/* Live progress counter */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-mono font-semibold text-primary tabular-nums">
                          {Math.round(analysisProgress)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Step {analysisStep + 1} / {ANALYSIS_STAGES.length}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="relative mb-6 h-2 w-full overflow-hidden rounded-full bg-muted">
                      {/* Fill — plain div + CSS transition so width always tracks state */}
                      <div
                        className="absolute inset-y-0 left-0 h-full rounded-full bg-gradient-to-r from-primary via-purple-500 to-[#06b6d4]"
                        style={{ width: `${analysisProgress}%`, transition: 'width 120ms linear' }}
                      />
                      {/* Sheen — fixed [-10%→110%] loop, never restarted by state changes */}
                      <motion.div
                        className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                        animate={{ left: ['-10%', '110%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 0.4 }}
                      />
                    </div>

                    {/* Stages checklist */}
                    <div className="space-y-1">
                      {ANALYSIS_STAGES.map((stage, i) => {
                        const isActive = i === analysisStep;
                        const isDone = i < analysisStep;
                        const StageIcon = stage.Icon;

                        return (
                          <motion.div
                            key={i}
                            animate={{ opacity: isDone ? 0.45 : isActive ? 1 : 0.28 }}
                            transition={{ duration: 0.4 }}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-300 ${
                              isActive ? 'bg-primary/5 border border-primary/15' : ''
                            }`}
                          >
                            {/* Status icon */}
                            <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                              isDone
                                ? 'bg-green-500/10 text-green-600'
                                : isActive
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground/50'
                            }`}>
                              {isDone ? (
                                <CheckCircle className="h-3.5 w-3.5" />
                              ) : isActive ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                                >
                                  <StageIcon className="h-3.5 w-3.5" />
                                </motion.div>
                              ) : (
                                <StageIcon className="h-3.5 w-3.5" />
                              )}
                            </div>

                            {/* Label + expandable detail */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-snug ${
                                isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
                              }`}>
                                {stage.label}
                              </p>
                              <AnimatePresence>
                                {isActive && (
                                  <motion.p
                                    key={`detail-${i}`}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.22 }}
                                    className="overflow-hidden text-xs text-muted-foreground"
                                  >
                                    {stage.detail}
                                  </motion.p>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Typing dots when active */}
                            {isActive && (
                              <div className="flex flex-shrink-0 items-center gap-0.5">
                                {[0, 1, 2].map(n => (
                                  <motion.span
                                    key={n}
                                    className="block h-1.5 w-1.5 rounded-full bg-primary"
                                    animate={{ opacity: [0.2, 1, 0.2] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: n * 0.25 }}
                                  />
                                ))}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    <p className="mt-5 text-center text-xs text-muted-foreground">
                      Our VC scoring model evaluates 6 dimensions · typically 10–30 s
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analysis Results */}
          {analysisResult && !isAnalyzing && (
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
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
                    <div className="text-center md:text-left">
                      <h3 className="mb-1">Ready to validate your idea?</h3>
                      <p className="text-muted-foreground text-sm">
                        Join our community and get feedback from fellow founders
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
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

          {/* How It Works - When no results and not loading */}
          {!analysisResult && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-12"
            >
              <h2 className="mb-4 text-center">How Our AI Analysis Works</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
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
            <h2 className="mb-4 text-center">See how AI analyzes your idea</h2>
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
