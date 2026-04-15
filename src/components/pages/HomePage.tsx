import { motion } from 'motion/react';
import { Lightbulb, Target, Rocket, Users, TrendingUp, Bot, CheckCircle2, Send, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';

import { fetchCaseStudies, subscribeToCaseStudies } from '@/lib/caseStudyService';
import type { CaseStudy } from '@/lib/caseStudyService';
import { fetchTrendingIdeas, subscribeTrendingIdeas } from '@/lib/communityService';
import type { TrendingIdea } from '@/lib/communityService';

import { Button } from '../ui/button';
import { FeatureCard } from '../FeatureCard';
import { IdeaCard } from '../IdeaCard';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';

const features = [
  {
    icon: Lightbulb,
    title: 'AI Idea Analyzer',
    description: 'Get instant feedback on your startup idea with our advanced AI analysis engine.',
  },
  {
    icon: Target,
    title: 'Market Fit Finder',
    description: 'Discover your target audience and validate market demand in seconds.',
  },
  {
    icon: Rocket,
    title: 'Prototype Generator',
    description: 'Turn ideas into visual prototypes with AI-powered design tools.',
  },
  {
    icon: Users,
    title: 'Community Hub',
    description: 'Connect with fellow founders, share ideas, and get valuable feedback.',
  },
  {
    icon: TrendingUp,
    title: 'Growth Strategy Builder',
    description: 'Create a customized growth roadmap based on your unique business model.',
  },
  {
    icon: Bot,
    title: 'AI Mentor Assistant',
    description: 'Get 24/7 guidance from your personal AI startup mentor.',
  },
];



interface HomePageProps {
  onNavigate?: (page: string, caseId?: string) => void;
  isLoggedIn?: boolean;
}

// Renders the case study logo. Logo is a pre-resolved URL (from the service)
// or null — no URL construction needed here.
function FeaturedCaseImage({ logo, company }: { logo: string | null; company: string }) {
  const [error, setError] = useState(false);
  const initial = (company || '?').charAt(0).toUpperCase();

  if (logo && !error) {
    return (
      <img
        src={logo}
        alt={`${company} logo`}
        className="h-14 w-14 flex-shrink-0 rounded-lg object-cover ring-2 ring-primary/10"
        onError={() => {
          console.warn(`[FeaturedCaseImage] Image failed to load for "${company}":`, logo);
          setError(true);
        }}
      />
    );
  }
  return (
    <div
      className="h-14 w-14 flex-shrink-0 rounded-lg bg-primary/10 ring-2 ring-primary/10 flex items-center justify-center font-semibold text-lg text-primary/70 select-none"
      aria-label={`${company} logo placeholder`}
    >
      {initial}
    </div>
  );
}

// Skeleton for one trending idea card
function TrendingIdeaSkeleton() {
  return (
    <div className="rounded-[10px] border border-border/60 bg-card p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-14 w-14 flex-shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-4 w-3/4 rounded" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-14 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-14 w-14 flex-shrink-0 rounded-lg" />
      </div>
    </div>
  );
}

// Skeleton for one featured case card
function FeaturedCaseSkeleton() {
  return (
    <div className="glass-surface border-border/50 rounded-[16px] p-6 flex flex-col h-full">
      <div className="mb-4 flex gap-4 items-start">
        <Skeleton className="h-14 w-14 flex-shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-3 w-1/3 rounded" />
          <Skeleton className="h-5 w-3/4 rounded" />
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-2/3 rounded" />
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full ml-auto" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl mt-auto" />
    </div>
  );
}

export function HomePage({ onNavigate, isLoggedIn = false }: HomePageProps) {
  const [commentPanelOpen, setCommentPanelOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [featuredCases, setFeaturedCases] = useState<CaseStudy[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [casesError, setCasesError] = useState<string | null>(null);

  // Trending ideas state
  const [trendingIdeas, setTrendingIdeas] = useState<TrendingIdea[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingLastUpdated, setTrendingLastUpdated] = useState<Date | null>(null);
  const [trendingAnimKey, setTrendingAnimKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchCaseStudies(3).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        setCasesError(error);
      } else {
        setFeaturedCases(data);
      }
      setCasesLoading(false);
    });

    // Reflect background cache refreshes in the featured section.
    // The full dataset is received; we slice to the same limit used above.
    const unsubscribe = subscribeToCaseStudies((fresh) => {
      if (!cancelled) setFeaturedCases(fresh.slice(0, 3));
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTrending() {
      const { data } = await fetchTrendingIdeas(3);
      if (cancelled) return;
      setTrendingIdeas(data);
      setTrendingLoading(false);
      setTrendingLastUpdated(new Date());
      setTrendingAnimKey(k => k + 1);
    }

    loadTrending();

    // Realtime: re-fetch whenever community_ideas changes
    const unsubscribe = subscribeTrendingIdeas(() => {
      if (!cancelled) loadTrending();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const handleCommentClick = (idea: any) => {
    setSelectedIdea(idea);
    setCommentPanelOpen(true);
  };

  const handleSendComment = () => {
    if (newComment.trim()) {
      setNewComment('');
    }
  };

  // Mock comments data
  const mockComments = [
    {
      id: 1,
      author: 'Jordan Lee',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      message: 'This is a great idea! Have you considered integrating with existing calendar apps?',
      timestamp: '2 hours ago',
      replies: [
        {
          id: 11,
          author: 'Alex Kim',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
          message: 'Yes! Working on Google Calendar and Outlook integrations for v2.',
          timestamp: '1 hour ago',
        },
      ],
    },
    {
      id: 2,
      author: 'Sam Patel',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      message: "What's your monetization strategy? Freemium or subscription?",
      timestamp: '5 hours ago',
    },
    {
      id: 3,
      author: 'Maya Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      message: 'Love the AI angle. How accurate is the nutrition analysis?',
      timestamp: '1 day ago',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-lavender relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="mb-6 font-['Poppins'] text-4xl text-white md:text-6xl">
              Turn Your Ideas into Reality with AI
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-white/90">
              Validate, analyze, and launch your startup idea using AI and a community of
              innovators.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="text-primary shadow-lavender rounded-[16px] bg-white px-8 hover:bg-white/90"
                onClick={() => onNavigate?.(isLoggedIn ? 'Dashboard' : 'Auth')}
              >
                {isLoggedIn ? 'Go to Dashboard' : 'Start Free'}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem / Solution Section */}
      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:gap-16 md:grid-cols-2">
            {/* Problem Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <span className="text-primary text-sm font-medium tracking-wide uppercase">The Problem</span>
              <h2 className="text-2xl md:text-3xl font-semibold leading-tight">The Challenge Every Founder Faces</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Most startup ideas fail not because they're bad, but because founders skip
                  validation. Without proper market research and community feedback, even brilliant
                  ideas can miss the mark.
                </p>
                <p>
                  Traditional validation takes weeks or months. By then, your window of opportunity
                  might be gone.
                </p>
              </div>
            </motion.div>

            {/* Solution Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-4"
            >
              <span className="text-primary text-sm font-medium tracking-wide uppercase">The Solution</span>
              <h2 className="text-2xl md:text-3xl font-semibold leading-tight">How Motif Helps</h2>
              <div className="space-y-5 pt-1">
                <div className="flex gap-4">
                  <CheckCircle2 className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">AI-Powered Analysis</p>
                    <p className="text-muted-foreground text-sm">
                      Get instant insights on market fit, competition, and viability.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Community Support</p>
                    <p className="text-muted-foreground text-sm">
                      Tap into a network of experienced founders for feedback.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Rapid Prototyping</p>
                    <p className="text-muted-foreground text-sm">
                      Generate visual prototypes and pitch decks in minutes.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center"
          >
            <h2 className="mb-4">Powerful Features for Founders</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Everything you need to validate, build, and launch your startup idea with confidence.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center"
          >
            <h2 className="mb-4">How It Works</h2>
            <p className="text-muted-foreground">Four simple steps to validate your idea</p>
          </motion.div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
            {[
              {
                num: '01',
                title: 'Enter your idea',
                desc: 'Describe your startup concept in your own words',
              },
              {
                num: '02',
                title: 'Get instant AI insights',
                desc: 'Our AI analyzes market fit and potential',
              },
              {
                num: '03',
                title: 'Share with the community',
                desc: 'Get feedback from fellow founders',
              },
              {
                num: '04',
                title: 'Successfully deploy your product',
                desc: 'Launch with confidence using our roadmap',
              },
            ].map((step, index) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="gradient-lavender mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full font-['Poppins'] text-xl text-white">
                  {step.num}
                </div>
                <h3 className="mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Case Studies Section */}
      <section className="bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center"
          >
            <h2 className="mb-4">Real Business Challenges</h2>
            <p className="text-muted-foreground">
              Practice solving real-world startup problems and learn from the best
            </p>
          </motion.div>
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {casesLoading ? (
              <>
                <FeaturedCaseSkeleton />
                <FeaturedCaseSkeleton />
                <FeaturedCaseSkeleton />
              </>
            ) : casesError ? (
              <div className="col-span-full text-center py-12">
                <Target className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">{casesError}</p>
              </div>
            ) : featuredCases.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <BookOpen className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">No case studies published yet — check back soon.</p>
              </div>
            ) : (
              featuredCases.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="h-full"
                >
                  <Card className="glass-surface border-border/50 hover:shadow-lavender flex h-full flex-col transition-all hover:border-primary/30">
                    <CardContent className="flex flex-col p-6 h-full">
                      <div className="mb-4 flex gap-4 items-start">
                        <FeaturedCaseImage logo={item.logo} company={item.company} />
                        <div className="min-w-0 flex-1">
                          <p className="text-muted-foreground text-xs mb-1">{item.company}</p>
                          <h3 className="mb-2 font-semibold text-lg leading-tight">{item.title}</h3>
                          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{item.description}</p>
                        </div>
                      </div>
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <Badge
                          variant={item.difficulty === 'Easy' ? 'secondary' : item.difficulty === 'Medium' ? 'default' : 'destructive'}
                          className="rounded-full"
                        >
                          {item.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs rounded-full">
                          {item.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs rounded-full ml-auto">
                          {item.attempts} attempts
                        </Badge>
                      </div>
                      <Button
                        className="gradient-lavender shadow-lavender w-full rounded-xl text-white hover:opacity-90 hover:scale-105 transition-all mt-auto"
                        onClick={() => onNavigate?.('CaseDetail', item.id)}
                      >
                        Start the Challenge →
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
          <div className="text-center">
            <Button
              variant="outline"
              size="lg"
              className="rounded-[16px] px-8 border-2 hover:border-primary/50 hover:bg-primary/5 hover:text-foreground transition-all"
              onClick={() => onNavigate?.('Case Studies')}
            >
              View All Case Studies
            </Button>
          </div>
        </div>
      </section>

      {/* Community Preview Section — live trending from Supabase */}
      <section className="bg-muted/20 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center"
          >
            <h2 className="mb-2">Trending Ideas in the Community</h2>
            <div className="flex items-center justify-center gap-2">
              <p className="text-muted-foreground text-sm">See what other founders are building</p>
              {trendingLastUpdated && !trendingLoading && (
                <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Updated just now
                </span>
              )}
            </div>
          </motion.div>

          <div className="mx-auto mb-8 max-w-2xl space-y-3">
            {trendingLoading ? (
              <><TrendingIdeaSkeleton /><TrendingIdeaSkeleton /><TrendingIdeaSkeleton /></>
            ) : trendingIdeas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-16 text-center">
                <TrendingUp className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">
                  No trending ideas yet — be the first to share
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-[12px]"
                  onClick={() => onNavigate?.('Community')}
                >
                  Post an idea
                </Button>
              </div>
            ) : (
              trendingIdeas.map((idea, index) => (
                <motion.div
                  key={`${trendingAnimKey}-${idea.id}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="relative"
                >
                  {/* 🔥 Trending badge for top 3 */}
                  {index < 3 && (
                    <span className="absolute -top-2 -right-2 z-10 flex items-center gap-0.5 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      #{index + 1}
                    </span>
                  )}
                  <IdeaCard
                    title={idea.title}
                    tags={idea.tags}
                    author={idea.authorName}
                    authorAvatar={idea.authorAvatar}
                    upvotes={idea.upvotes}
                    comments_count={idea.commentsCount}
                    onCommentClick={() => handleCommentClick({
                      id: idea.id,
                      title: idea.title,
                      author: idea.authorName,
                      authorAvatar: idea.authorAvatar,
                      comments_count: idea.commentsCount,
                    })}
                  />
                </motion.div>
              ))
            )}
          </div>

          <div className="text-center">
            <Button
              variant="outline"
              size="lg"
              className="rounded-[16px] px-8"
              onClick={() => onNavigate?.('Community')}
            >
              Join the Community
            </Button>
          </div>
        </div>
      </section>

      {/* Sponsors Section */}
      <section className="bg-background py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-muted-foreground mb-6">Proudly sponsored by</p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {[1, 2, 3, 4].map(i => (
                <Badge
                  key={i}
                  variant="outline"
                  className="px-6 py-3 text-base text-muted-foreground border-dashed opacity-60 cursor-default select-none"
                >
                  Coming Soon
                </Badge>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sponsored Content Section */}
      <section className="bg-muted/20 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map(i => (
              <Card key={i} className="overflow-hidden border-dashed border-primary/20 opacity-60">
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[160px] gap-3 text-center">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Sponsored</p>
                  <p className="text-lg font-semibold text-muted-foreground">Coming Soon</p>
                  <p className="text-xs text-muted-foreground">This spot is available for sponsors</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comment Panel */}
      <Sheet open={commentPanelOpen} onOpenChange={setCommentPanelOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto border-l border-border bg-background sm:w-[500px]"
        >
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle className="text-xl font-semibold">
              Comments
            </SheetTitle>
          </SheetHeader>

          {selectedIdea && (
            <div className="mt-4 space-y-4">
              {/* Idea Summary */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <h4 className="mb-2 font-medium line-clamp-2">{selectedIdea.title}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedIdea.authorAvatar} alt={selectedIdea.author} />
                    <AvatarFallback className="text-xs">
                      {selectedIdea.author[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span>{selectedIdea.author}</span>
                  <span>·</span>
                  <span>{selectedIdea.comments_count} comments</span>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {mockComments.map((comment) => (
                  <div key={comment.id} className="space-y-3">
                    {/* Main Comment */}
                    <div className="rounded-lg border border-border bg-card p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.avatar} alt={comment.author} />
                          <AvatarFallback className="text-xs">
                            {comment.author[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm text-foreground/90 pl-10">
                        {comment.message}
                      </p>
                    </div>

                    {/* Nested Replies */}
                    {comment.replies &&
                      comment.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="ml-6 rounded-lg border border-border/50 bg-muted/20 p-3"
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={reply.avatar} alt={reply.author} />
                              <AvatarFallback className="text-xs">
                                {reply.author[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{reply.author}</span>
                            <span className="text-xs text-muted-foreground">{reply.timestamp}</span>
                          </div>
                          <p className="text-sm text-foreground/90 pl-9">
                            {reply.message}
                          </p>
                        </div>
                      ))}
                  </div>
                ))}
              </div>

              {/* Add Comment Input */}
              <div className="sticky bottom-0 rounded-lg border border-border bg-background p-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Share your feedback..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendComment()}
                    className="flex-1 text-sm"
                  />
                  <Button
                    onClick={handleSendComment}
                    disabled={!newComment.trim()}
                    size="sm"
                    className="gradient-lavender"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
