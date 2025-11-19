import { motion } from 'motion/react';
import { useState } from 'react';
import { TrendingUp, Clock, MessageCircle, Award, Send, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../ui/button';
import { IdeaCard } from '../IdeaCard';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

const allIdeas = [
  {
    title: 'AI-powered meal planning app for busy professionals',
    description:
      'An AI-powered assistant that helps users manage daily meal planning using predictive nutrition analysis and personalized recipes based on dietary preferences.',
    upvotes: 234,
    comments: 45,
    tags: ['AI', 'HealthTech', 'Mobile'],
    author: 'Alex Kim',
    authorAvatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  },
  {
    title: 'Blockchain-based freelancer marketplace with escrow',
    description:
      'A decentralized platform connecting freelancers with clients, featuring smart contract escrow payments and reputation tracking on-chain.',
    upvotes: 189,
    comments: 32,
    tags: ['Web3', 'Marketplace', 'Fintech'],
    author: 'Jordan Lee',
    authorAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
  },
  {
    title: 'No-code platform for building internal tools',
    description:
      'Empower non-technical teams to build custom internal tools and workflows without writing code, integrating with existing business systems.',
    upvotes: 156,
    comments: 28,
    tags: ['SaaS', 'No-Code', 'B2B'],
    author: 'Sam Patel',
    authorAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  },
  {
    title: 'Virtual reality training platform for medical students',
    description:
      'Immersive VR simulations for medical procedures and diagnostics, providing hands-on practice in a safe, controlled environment.',
    upvotes: 142,
    comments: 24,
    tags: ['VR', 'EdTech', 'Healthcare'],
    author: 'Maya Rodriguez',
    authorAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  },
  {
    title: 'Sustainable packaging marketplace for e-commerce',
    description:
      'Connect e-commerce brands with eco-friendly packaging suppliers, featuring carbon footprint tracking and bulk ordering options.',
    upvotes: 128,
    comments: 19,
    tags: ['Sustainability', 'E-commerce', 'B2B'],
    author: 'Chen Wei',
    authorAvatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
  },
  {
    title: 'AI writing assistant for technical documentation',
    description:
      'Automated documentation generator for software projects, creating clear technical docs from code comments and API structures.',
    upvotes: 115,
    comments: 16,
    tags: ['AI', 'SaaS', 'Developer Tools'],
    author: 'Emily Davis',
    authorAvatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
  },
  {
    title: 'Smart parking solution for urban areas',
    description:
      'IoT-enabled parking system with real-time availability tracking, mobile reservations, and dynamic pricing for city parking management.',
    upvotes: 98,
    comments: 14,
    tags: ['IoT', 'Smart City', 'Mobile'],
    author: 'David Chen',
    authorAvatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
  },
  {
    title: 'Mental health chatbot for college students',
    description:
      'AI-powered conversational support providing 24/7 mental health resources, coping strategies, and crisis intervention for students.',
    upvotes: 87,
    comments: 12,
    tags: ['AI', 'HealthTech', 'EdTech'],
    author: 'Sarah Miller',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
  },
  {
    title: 'Subscription box for sustainable pet products',
    description:
      "Monthly curated boxes of eco-friendly pet supplies, toys, and treats tailored to your pet's needs with zero-waste packaging.",
    upvotes: 76,
    comments: 10,
    tags: ['E-commerce', 'Sustainability', 'Pets'],
    author: 'Michael Brown',
    authorAvatar:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop',
  },
  {
    title: 'Voice-controlled home automation for elderly',
    description:
      'Simple voice interface for smart home control designed specifically for seniors, featuring emergency alerts and medication reminders.',
    upvotes: 65,
    comments: 8,
    tags: ['IoT', 'HealthTech', 'Accessibility'],
    author: 'Lisa Wang',
    authorAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
  },
  {
    title: 'Decentralized music streaming platform',
    description:
      'Web3 music platform where artists earn directly from streams using blockchain, with NFT album releases and fan governance.',
    upvotes: 54,
    comments: 7,
    tags: ['Web3', 'Music', 'Entertainment'],
    author: 'Tom Anderson',
    authorAvatar:
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop',
  },
  {
    title: 'AI-powered code review tool',
    description:
      'Intelligent code analysis tool that provides automated security checks, style suggestions, and performance optimizations.',
    upvotes: 43,
    comments: 5,
    tags: ['AI', 'Developer Tools', 'SaaS'],
    author: 'Priya Sharma',
    authorAvatar:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop',
  },
];

const leaderboard = [
  { name: 'Alex Kim', points: 2847, ideas: 12 },
  { name: 'Jordan Lee', points: 2156, ideas: 8 },
  { name: 'Sam Patel', points: 1923, ideas: 15 },
  { name: 'Maya Rodriguez', points: 1654, ideas: 7 },
  { name: 'Chen Wei', points: 1432, ideas: 9 },
];

interface CommunityPageProps {
  onNavigate?: (page: string) => void;
}

export function CommunityPage({ onNavigate }: CommunityPageProps) {
  const [filter, setFilter] = useState('trending');
  const [displayCount, setDisplayCount] = useState(5);
  const [commentPanelOpen, setCommentPanelOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<any>(null);
  const [newComment, setNewComment] = useState('');

  // Post Idea form state
  const [postFormOpen, setPostFormOpen] = useState(false);
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    tags: '',
  });

  const ideas = allIdeas.slice(0, displayCount);
  const hasMore = displayCount < allIdeas.length;

  const handleLoadMore = () => {
    setDisplayCount(Math.min(displayCount + 5, allIdeas.length));
  };

  // Validation for post form
  const isPostTitleValid = postForm.title.trim().length >= 10;
  const isPostDescriptionValid = postForm.description.trim().length >= 30;
  const isPostFormValid = isPostTitleValid && isPostDescriptionValid;

  const handleSubmitIdea = () => {
    if (!isPostFormValid) {
      toast.error('Please fill in all required fields with minimum lengths');
      return;
    }

    toast.success('Idea posted successfully!');
    setPostForm({ title: '', description: '', tags: '' });
    setPostFormOpen(false);
  };

  const handleCommentClick = (idea: any) => {
    setSelectedIdea(idea);
    setCommentPanelOpen(true);
  };

  const handleSendComment = () => {
    if (newComment.trim()) {
      // Mock: Add comment logic here
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
          avatar:
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
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
      {/* Hero */}
      <section className="gradient-lavender relative overflow-hidden py-16">
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="mb-6 font-['Poppins'] text-4xl text-white md:text-5xl">
              Join the Founder Community
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-white/90">
              Share your ideas, get feedback, and connect with fellow entrepreneurs
            </p>
            <div className="flex justify-center gap-4">
              <Dialog open={postFormOpen} onOpenChange={setPostFormOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="text-primary rounded-[16px] bg-white px-8 hover:bg-white/90"
                  >
                    Post an Idea
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Share Your Startup Idea</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Idea Title *</Label>
                      <Input
                        id="title"
                        placeholder="Brief description of your idea"
                        value={postForm.title}
                        onChange={e => setPostForm({ ...postForm, title: e.target.value })}
                        maxLength={150}
                      />
                      <p className="text-muted-foreground text-xs">
                        {isPostTitleValid ? (
                          <span className="text-green-600">✓ {postForm.title.length}/150</span>
                        ) : (
                          <span>Minimum 10 characters ({postForm.title.length}/150)</span>
                        )}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Full Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your idea in detail..."
                        rows={5}
                        value={postForm.description}
                        onChange={e => setPostForm({ ...postForm, description: e.target.value })}
                        maxLength={500}
                      />
                      <p className="text-muted-foreground text-xs">
                        {isPostDescriptionValid ? (
                          <span className="text-green-600">✓ {postForm.description.length}/500</span>
                        ) : (
                          <span>Minimum 30 characters ({postForm.description.length}/500)</span>
                        )}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        placeholder="AI, SaaS, Mobile"
                        value={postForm.tags}
                        onChange={e => setPostForm({ ...postForm, tags: e.target.value })}
                        maxLength={100}
                      />
                    </div>
                    <Button
                      onClick={handleSubmitIdea}
                      disabled={!isPostFormValid}
                      className="gradient-lavender shadow-lavender w-full rounded-[16px] hover:opacity-90"
                    >
                      Submit Idea
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                size="lg"
                className="gradient-lavender shadow-lavender rounded-[16px] px-8 hover:opacity-90"
                onClick={() => onNavigate?.('Community')}
              >
                Join the Community
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Ideas Feed */}
            <div className="space-y-6 lg:col-span-2">
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filter === 'trending' ? 'default' : 'outline'}
                  onClick={() => setFilter('trending')}
                  className="rounded-full"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Trending
                </Button>
                <Button
                  variant={filter === 'new' ? 'default' : 'outline'}
                  onClick={() => setFilter('new')}
                  className="rounded-full"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  New
                </Button>
                <Button
                  variant={filter === 'discussed' ? 'default' : 'outline'}
                  onClick={() => setFilter('discussed')}
                  className="rounded-full"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Most Discussed
                </Button>
              </div>

              {/* Ideas List */}
              <div className="space-y-4">
                {ideas.map((idea, index) => (
                  <motion.div
                    key={idea.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <IdeaCard {...idea} onCommentClick={() => handleCommentClick(idea)} />
                  </motion.div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="pt-4 text-center">
                  <Button variant="outline" onClick={handleLoadMore} className="rounded-xl px-8">
                    Load More Ideas
                  </Button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Popular Tags - Sticky */}
              <Card className="border-border/50 sticky top-20">
                <CardContent className="p-6">
                  <h3 className="mb-4">Popular Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'AI',
                      'SaaS',
                      'Mobile',
                      'Web3',
                      'HealthTech',
                      'Fintech',
                      'EdTech',
                      'B2B',
                      'E-commerce',
                      'No-Code',
                    ].map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="hover:bg-primary hover:text-primary-foreground cursor-pointer rounded-full"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Contributors */}
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <div className="mb-6 flex items-center gap-2">
                    <Award className="text-primary h-5 w-5" />
                    <h3>Top Contributors</h3>
                  </div>
                  <div className="space-y-4">
                    {leaderboard.map((user, index) => (
                      <div key={user.name} className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                              index === 0
                                ? 'bg-yellow-500 text-white'
                                : index === 1
                                  ? 'bg-gray-400 text-white'
                                  : index === 2
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {index + 1}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate">{user.name}</p>
                          <p className="text-muted-foreground text-sm">
                            {user.points} pts · {user.ideas} ideas
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Comment Panel */}
      <Sheet open={commentPanelOpen} onOpenChange={setCommentPanelOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto border-l border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 backdrop-blur-xl sm:w-[600px]"
        >
          <SheetHeader className="border-b border-primary/10 pb-4">
            <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              💬 Comments & Discussion
            </SheetTitle>
          </SheetHeader>

          {selectedIdea && (
            <div className="mt-6 space-y-6">
              {/* Idea Summary - Enhanced */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-5 shadow-lg"
              >
                <h4 className="mb-3 text-lg font-semibold">{selectedIdea.title}</h4>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                    <AvatarImage src={selectedIdea.authorAvatar} alt={selectedIdea.author} />
                    <AvatarFallback className="bg-primary/10">
                      {selectedIdea.author[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">by {selectedIdea.author}</p>
                    <p className="text-xs">{selectedIdea.comments} comments</p>
                  </div>
                </div>
              </motion.div>

              {/* Comments List - Enhanced */}
              <div className="space-y-5">
                {mockComments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="space-y-3"
                  >
                    <div className="group flex gap-3">
                      <Avatar className="h-11 w-11 flex-shrink-0 ring-2 ring-primary/10 transition-all group-hover:ring-primary/30">
                        <AvatarImage src={comment.avatar} alt={comment.author} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                          {comment.author[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="font-semibold text-foreground">{comment.author}</span>
                          <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                        </div>
                        <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 p-4 shadow-sm transition-all group-hover:border-primary/20 group-hover:shadow-md">
                          <p className="text-sm leading-relaxed text-foreground/90">
                            {comment.message}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Nested Replies - Enhanced */}
                    {comment.replies &&
                      comment.replies.map((reply, replyIndex) => (
                        <motion.div
                          key={reply.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: (index + replyIndex) * 0.1 + 0.2 }}
                          className="ml-14 flex gap-3 border-l-2 border-primary/20 pl-4"
                        >
                          <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-secondary/10">
                            <AvatarImage src={reply.avatar} alt={reply.author} />
                            <AvatarFallback className="bg-gradient-to-br from-secondary/20 to-primary/20">
                              {reply.author[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="text-sm font-semibold">{reply.author}</span>
                              <span className="text-xs text-muted-foreground">{reply.timestamp}</span>
                            </div>
                            <div className="rounded-xl border border-border/30 bg-gradient-to-br from-secondary/5 to-primary/5 p-3 shadow-sm">
                              <p className="text-sm leading-relaxed text-foreground/90">
                                {reply.message}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </motion.div>
                ))}
              </div>

              {/* Add Comment Input - Enhanced */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="sticky bottom-0 rounded-2xl border border-primary/20 bg-gradient-to-br from-background/95 to-primary/5 p-4 shadow-xl backdrop-blur-lg"
              >
                <div className="mb-2 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Add your thoughts</span>
                </div>
                <div className="flex gap-3">
                  <Input
                    placeholder="Share your feedback or ideas..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendComment()}
                    className="flex-1 rounded-xl border-primary/20 bg-background/50 focus:ring-2 focus:ring-primary/20"
                  />
                  <Button
                    onClick={handleSendComment}
                    disabled={!newComment.trim()}
                    className="gradient-lavender shadow-lavender rounded-xl px-6 transition-all hover:scale-105 hover:opacity-90 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Press Enter to send, Shift + Enter for new line
                </p>
              </motion.div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
