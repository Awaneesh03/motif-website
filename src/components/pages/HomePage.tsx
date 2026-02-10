import { motion } from 'motion/react';
import { Lightbulb, Target, Rocket, Users, TrendingUp, Bot, CheckCircle2, MessageCircle, Send } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../ui/button';
import { FeatureCard } from '../FeatureCard';
import { IdeaCard } from '../IdeaCard';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
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


const communityIdeas = [
  {
    title: 'AI-powered meal planning app for busy professionals',
    upvotes: 234,
    comments: 45,
    tags: ['AI', 'HealthTech', 'Mobile'],
    author: 'Alex Kim',
  },
  {
    title: 'Blockchain-based freelancer marketplace with escrow',
    upvotes: 189,
    comments: 32,
    tags: ['Web3', 'Marketplace', 'Fintech'],
    author: 'Jordan Lee',
  },
  {
    title: 'No-code platform for building internal tools',
    upvotes: 156,
    comments: 28,
    tags: ['SaaS', 'No-Code', 'B2B'],
    author: 'Sam Patel',
  },
];

interface HomePageProps {
  onNavigate?: (page: string) => void;
  isLoggedIn?: boolean;
}

export function HomePage({ onNavigate, isLoggedIn = false }: HomePageProps) {
  const [commentPanelOpen, setCommentPanelOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<any>(null);
  const [newComment, setNewComment] = useState('');

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
              <Button
                size="lg"
                variant="outline"
                className="text-white rounded-[16px] border-white px-8 hover:bg-white/10"
                onClick={() => onNavigate?.('Features')}
              >
                Explore Features
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem / Solution Section */}
      <section className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-6">The Challenge Every Founder Faces</h2>
              <p className="text-muted-foreground mb-4">
                Most startup ideas fail not because they're bad, but because founders skip
                validation. Without proper market research and community feedback, even brilliant
                ideas can miss the mark.
              </p>
              <p className="text-muted-foreground">
                Traditional validation takes weeks or months. By then, your window of opportunity
                might be gone.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-6">How Motif Helps</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="text-primary mt-1 h-6 w-6 flex-shrink-0" />
                  <div>
                    <p className="font-medium">AI-Powered Analysis</p>
                    <p className="text-muted-foreground">
                      Get instant insights on market fit, competition, and viability.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="text-primary mt-1 h-6 w-6 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Community Support</p>
                    <p className="text-muted-foreground">
                      Tap into a network of experienced founders for feedback.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="text-primary mt-1 h-6 w-6 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Rapid Prototyping</p>
                    <p className="text-muted-foreground">
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
            {[
              {
                id: '1',
                company: 'PayStream',
                logo: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=100&h=100&fit=crop',
                title: 'Scaling User Acquisition',
                description: 'Grow from 100 to 1000 users with $5k budget',
                difficulty: 'Medium',
                category: 'Marketing',
                attempts: 234,
              },
              {
                id: '2',
                company: 'DevHub',
                logo: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=100&h=100&fit=crop',
                title: 'Product-Market Fit Crisis',
                description: 'Find the right market for your AI tool',
                difficulty: 'Hard',
                category: 'Product',
                attempts: 189,
              },
              {
                id: '3',
                company: 'ShipFast',
                logo: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop',
                title: 'Optimizing Operations',
                description: 'Reduce delivery time by 30% while cutting costs',
                difficulty: 'Medium',
                category: 'Operations',
                attempts: 156,
              },
            ].map((caseItem, index) => (
              <motion.div
                key={caseItem.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="h-full"
              >
                <Card className="glass-surface border-border/50 hover:shadow-lavender flex h-full flex-col transition-all hover:border-primary/30">
                  <CardContent className="flex flex-col p-6 h-full">
                    <div className="mb-4 flex gap-4 items-start">
                      <img
                        src={caseItem.logo}
                        alt={caseItem.company}
                        className="h-14 w-14 flex-shrink-0 rounded-lg object-cover ring-2 ring-primary/10"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-muted-foreground text-xs mb-1">{caseItem.company}</p>
                        <h3 className="mb-2 font-semibold text-lg leading-tight">{caseItem.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{caseItem.description}</p>
                      </div>
                    </div>
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <Badge
                        variant={caseItem.difficulty === 'Easy' ? 'secondary' : caseItem.difficulty === 'Medium' ? 'default' : 'destructive'}
                        className="rounded-full"
                      >
                        {caseItem.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs rounded-full">
                        {caseItem.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs rounded-full ml-auto">
                        {caseItem.attempts} attempts
                      </Badge>
                    </div>
                    <Button
                      className="gradient-lavender shadow-lavender w-full rounded-xl text-white hover:opacity-90 hover:scale-105 transition-all mt-auto"
                      onClick={() => onNavigate?.('Case Studies')}
                    >
                      Start the Challenge →
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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

      {/* Community Preview Section */}
      <section className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center"
          >
            <h2 className="mb-4">Trending Ideas in the Community</h2>
            <p className="text-muted-foreground">See what other founders are building</p>
          </motion.div>
          <div className="mx-auto mb-8 max-w-4xl space-y-4">
            {communityIdeas.map((idea, index) => (
              <motion.div
                key={idea.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <IdeaCard {...idea} onCommentClick={() => handleCommentClick(idea)} />
              </motion.div>
            ))}
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

      {/* Best Startups Section */}
      <section className="bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center"
          >
            <h2 className="mb-4">Best Startups Grown from Our Platform</h2>
            <p className="text-muted-foreground">Success stories from founders who started here</p>
          </motion.div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: 'CloudNest',
                logo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=200&fit=crop',
                tagline: 'Cloud infrastructure for startups',
                description: 'Started on Motif, now powering 500+ businesses',
                metrics: { users: '75K+', funding: '$12M', growth: '+520%' },
              },
              {
                name: 'EduVerse',
                logo: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=200&h=200&fit=crop',
                tagline: 'Virtual learning platform',
                description: 'Validated idea here, serving 200K+ students globally',
                metrics: { users: '200K+', funding: '$15M', growth: '+680%' },
              },
              {
                name: 'FinTrack',
                logo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=200&h=200&fit=crop',
                tagline: 'AI-powered expense tracking',
                description: 'From concept to market leader in 24 months',
                metrics: { users: '150K+', funding: '$20M', growth: '+750%' },
              },
            ].map((startup, index) => (
              <motion.div
                key={startup.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-surface border-border/50 hover:shadow-lavender h-full transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <img
                        src={startup.logo}
                        alt={startup.name}
                        className="mb-4 h-20 w-20 rounded-2xl object-cover"
                      />
                      <h3 className="mb-2">{startup.name}</h3>
                      <p className="text-muted-foreground mb-4">{startup.tagline}</p>
                      <p className="text-muted-foreground mb-6 text-sm">{startup.description}</p>
                      <div className="border-border grid w-full grid-cols-3 gap-4 border-t pt-4">
                        <div>
                          <div className="text-primary">{startup.metrics.users}</div>
                          <div className="text-muted-foreground text-xs">Users</div>
                        </div>
                        <div>
                          <div className="text-primary">{startup.metrics.funding}</div>
                          <div className="text-muted-foreground text-xs">Funding</div>
                        </div>
                        <div>
                          <div className="text-primary">{startup.metrics.growth}</div>
                          <div className="text-muted-foreground text-xs">Growth</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
              {[
                { name: 'Y Combinator', logo: '🚀' },
                { name: 'Stripe', logo: '💳' },
                { name: 'Amazon Web Services', logo: '☁️' },
                { name: 'Google Cloud', logo: '🔧' },
              ].map(sponsor => (
                <Badge
                  key={sponsor.name}
                  variant="outline"
                  className="hover:bg-primary/10 cursor-pointer px-6 py-3 text-base transition-all hover:scale-105 hover:border-primary/50"
                >
                  <span className="mr-2">{sponsor.logo}</span>
                  {sponsor.name}
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
            {/* Ad 1 - Notion */}
            <Card className="hover:shadow-lavender group cursor-pointer overflow-hidden border-primary/20 transition-all hover:border-primary/40">
              <CardContent className="p-6">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Notion for Startups</h4>
                    <p className="text-xs text-muted-foreground">Sponsored</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 text-sm">
                  Build your startup wiki, roadmap, and docs in one place. Get $1,000 in credits for free.
                </p>
                <Button
                  size="sm"
                  className="gradient-lavender w-full rounded-xl text-white hover:opacity-90"
                >
                  Claim Free Credits →
                </Button>
              </CardContent>
            </Card>

            {/* Ad 2 - Stripe */}
            <Card className="hover:shadow-lavender group cursor-pointer overflow-hidden border-primary/20 transition-all hover:border-primary/40">
              <CardContent className="p-6">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                    <span className="text-2xl">💳</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Stripe Atlas</h4>
                    <p className="text-xs text-muted-foreground">Sponsored</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 text-sm">
                  Incorporate your startup and access Silicon Valley bank accounts from anywhere in the world.
                </p>
                <Button
                  size="sm"
                  className="gradient-lavender w-full rounded-xl text-white hover:opacity-90"
                >
                  Start Your Company →
                </Button>
              </CardContent>
            </Card>
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
                  <span>{selectedIdea.comments} comments</span>
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
