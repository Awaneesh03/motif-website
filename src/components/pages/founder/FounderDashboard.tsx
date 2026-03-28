import { motion } from 'motion/react';
import {
  Lightbulb,
  BookOpen,
  ArrowRight,
  Users,
  CheckCircle2,
  Sparkles,
  Rocket,
  AlertCircle,
  Send,
  Clock,
  Info,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';

import { useUser } from '@/contexts/UserContext';
import { getUserIdeas, type Idea } from '@/lib/ideasService';
import { supabase } from '@/lib/supabase';
import { getUserNotifications, type Notification } from '@/lib/notificationService';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { getFounderMetrics, type FounderMetrics } from '@/lib/metricsService';
import { useFounderDemoMode } from '@/hooks/useDemoMode';
import { demoFounderStartups } from '@/lib/demoData';
import { apiClient } from '@/lib/api-client';

export function FounderDashboard() {
  const { user, profile } = useUser();
  const navigate = useNavigate();
  const [currentTip, setCurrentTip] = useState(0);
  const [myStartups, setMyStartups] = useState<Idea[]>([]);
  const [recentActivity, setRecentActivity] = useState<Notification[]>([]);
  const [metrics, setMetrics] = useState<FounderMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Tracks which single startup is being submitted — null means none in flight
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const stats = [
    {
      label: 'Total Startups',
      value: metrics?.totalStartups.toString() || '0',
      icon: Lightbulb,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Pending Review',
      value: metrics?.pendingReview.toString() || '0',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-600/10',
    },
    {
      label: 'Approved for VC',
      value: metrics?.approvedForVC.toString() || '0',
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-600/10',
    },
    {
      label: 'Community Ideas',
      value: metrics?.communityIdeas.toString() || '0',
      icon: Users,
      color: 'text-[#A9F5D0]',
      bgColor: 'bg-[#A9F5D0]/10',
    },
  ];


  const aiTips = [
    "Start with a clear problem statement - it's the foundation of every successful pitch.",
    'Focus on one key feature that differentiates you from competitors.',
    'Validate your assumptions with real user feedback before building.',
    'Your first 100 users are more valuable than your first dollar.',
    "Niche down - it's easier to dominate a small market first.",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % aiTips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Check if demo mode should be enabled
  const { isDemoMode } = useFounderDemoMode(myStartups, metrics);

  useEffect(() => {
    const fetchData = async () => {
      if (user?.id) {
        setIsLoading(true);
        setError(null);

        try {
          // Fetch all data in parallel
          const [ideas, notifications, founderMetrics] = await Promise.all([
            getUserIdeas(user.id),
            getUserNotifications(user.id, 10),
            getFounderMetrics(user.id),
          ]);

          setMyStartups(ideas);
          setRecentActivity(notifications);
          setMetrics(founderMetrics);
        } catch (err) {
          console.error('Error loading founder dashboard data:', err);
          setError('Failed to load dashboard data. Please refresh the page.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchData();

    // Subscribe to real-time updates for community ideas
    if (user?.id) {
      // Capture userId at subscription setup time to avoid stale closure
      const userId = user.id;
      const channel = supabase
        .channel('founder-dashboard-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'community_ideas',
          },
          async () => {
            // Refetch metrics when community ideas change
            try {
              const founderMetrics = await getFounderMetrics(userId);
              setMetrics(founderMetrics);
            } catch (err) {
              console.error('Error updating metrics:', err);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'idea_analyses',
          },
          async () => {
            // Refetch all data when ideas change
            try {
              const [ideas, founderMetrics] = await Promise.all([
                getUserIdeas(userId),
                getFounderMetrics(userId),
              ]);
              setMyStartups(ideas);
              setMetrics(founderMetrics);
            } catch (err) {
              console.error('Error updating data:', err);
            }
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Submit a single startup for admin review.
  // Only the clicked card's button is disabled — all other cards are unaffected.
  const handleSubmitForReview = async (ideaId: string) => {
    if (submittingId) return; // prevent double-click while one is in-flight
    setSubmittingId(ideaId);
    try {
      await apiClient.patch(`/api/analysis/${ideaId}/submit`);
      // Update ONLY this startup in state — no full re-fetch, no other cards affected
      setMyStartups(prev =>
        prev.map(s => (s.id === ideaId ? { ...s, status: 'pending_review' } : s))
      );
      toast.success('Startup submitted for review!');
    } catch (err) {
      console.error('Submit for review failed:', err);
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('already submitted')) {
        toast.error('Already submitted — awaiting review.');
      } else if (msg.includes('approved')) {
        toast.error('This idea is already approved for VC funding.');
      } else if (msg.includes('rejected')) {
        toast.error('This idea was rejected. Contact support to appeal.');
      } else {
        toast.error('Failed to submit for review. Please try again.');
      }
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="bg-background">
      {/* Header Section */}
      <section className="via-background to-background border-border relative overflow-hidden border-b bg-gradient-to-br from-[#C9A7EB]/20 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="mb-2">Welcome back, {profile?.name || 'Founder'} 👋</h1>
            <p className="text-muted-foreground">
              Track your startup submissions and VC connections
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                    Error Loading Dashboard
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="rounded-lg border-red-600 text-red-600 hover:bg-red-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </motion.div>
          )}

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Main Content Area */}
            <div className="space-y-6 lg:col-span-3">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="glass-surface border-border/50 hover:shadow-lavender transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div
                            className={`h-12 w-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
                          >
                            <stat.icon className={`h-6 w-6 ${stat.color}`} />
                          </div>
                          <div>
                            <p className="mb-1 text-3xl">{stat.value}</p>
                            <p className="text-muted-foreground text-sm">{stat.label}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* My Startups */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="glass-surface border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-primary" />
                        Your Startups
                      </CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {myStartups.length} {myStartups.length === 1 ? 'startup' : 'startups'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                        <p>Loading your startups...</p>
                      </div>
                    ) : myStartups.length === 0 && isDemoMode ? (
                      <div>
                        {/* Demo Mode Banner */}
                        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                Demo Mode - Example Startups
                              </h4>
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                These are example startups to demonstrate how the platform works.
                                Ready to submit your own? Click below to get started.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Demo Startup Cards */}
                        <div className="grid gap-4 sm:grid-cols-2 mb-6">
                          {demoFounderStartups.map((demoStartup, index) => {
                            const getStatusInfo = (status: string) => {
                              switch (status) {
                                case 'draft':
                                  return {
                                    text: 'Draft',
                                    description: 'Complete your details and submit for review',
                                    badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
                                  };
                                case 'pending_review':
                                  return {
                                    text: 'Under Review',
                                    description: 'Your startup is being reviewed by our team',
                                    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                                  };
                                case 'approved_for_vc':
                                  return {
                                    text: 'Approved',
                                    description: 'Your startup is approved and visible to VCs',
                                    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                                  };
                                default:
                                  return {
                                    text: 'Unknown status',
                                    description: '',
                                    badgeClass: 'bg-gray-100 text-gray-800',
                                  };
                              }
                            };

                            const statusInfo = getStatusInfo(demoStartup.status || 'draft');

                            return (
                              <motion.div
                                key={demoStartup.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 + index * 0.05 }}
                                className="bg-muted/30 border border-dashed border-border rounded-xl p-4 relative opacity-75"
                              >
                                {/* Demo Badge */}
                                <div className="absolute top-2 right-2">
                                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0 text-[10px]">
                                    DEMO
                                  </Badge>
                                </div>

                                <h4 className="font-semibold mb-2 truncate pr-16">
                                  {demoStartup.title}
                                </h4>

                                <p className="text-xs text-muted-foreground mb-3">
                                  {demoStartup.demoDescription}
                                </p>

                                <div className="mb-3">
                                  <Badge className={`text-xs mb-1.5 border-0 ${statusInfo.badgeClass}`}>
                                    {statusInfo.text}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground">
                                    {statusInfo.description}
                                  </p>
                                </div>

                                <p className="text-xs text-muted-foreground mb-3">
                                  Stage: {demoStartup.stage}
                                </p>

                                {/* Disabled Action Button */}
                                <Button
                                  size="sm"
                                  disabled
                                  className="w-full rounded-lg opacity-50 cursor-not-allowed"
                                >
                                  <Send className="mr-2 h-3 w-3" />
                                  Demo Only
                                </Button>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* CTA to Create Real Startup */}
                        <div className="text-center py-8 border-2 border-dashed border-primary/30 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5">
                          <Rocket className="h-12 w-12 mx-auto mb-3 text-primary" />
                          <p className="mb-2 font-semibold text-lg">Submit Your First Startup</p>
                          <p className="text-sm mb-4 text-muted-foreground max-w-md mx-auto">
                            Analyze your idea, submit for review, and get approved to connect with investors
                          </p>
                          <Button
                            onClick={() => navigate('/idea-analyser')}
                            size="lg"
                            className="gradient-lavender shadow-lavender rounded-xl hover:opacity-90"
                          >
                            <Lightbulb className="mr-2 h-5 w-5" />
                            Get Started
                          </Button>
                        </div>
                      </div>
                    ) : myStartups.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Rocket className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="mb-2 font-semibold">No Startups Yet</p>
                        <p className="text-sm mb-4">Submit your first startup to connect with investors</p>
                        <Button
                          onClick={() => navigate('/idea-analyser')}
                          className="gradient-lavender shadow-lavender rounded-xl hover:opacity-90"
                        >
                          <Lightbulb className="mr-2 h-4 w-4" />
                          Get Started
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {myStartups.map((startup, index) => {
                          // Helper function to get status text and description
                          const getStatusInfo = (status: string) => {
                            switch (status) {
                              case 'draft':
                                return {
                                  text: 'Draft',
                                  description: 'Complete your details and submit for review',
                                  badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
                                };
                              case 'pending_review':
                                return {
                                  text: 'Under Review',
                                  description: 'Your startup is being reviewed by our team',
                                  badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                                };
                              case 'approved_for_vc':
                                return {
                                  text: 'Approved',
                                  description: 'VCs can now discover your startup',
                                  badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                                };
                              case 'rejected':
                                return {
                                  text: 'Needs Changes',
                                  description: 'Review feedback and update your submission',
                                  badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                                };
                              case 'active':
                                return {
                                  text: 'Active',
                                  description: 'Your startup is live',
                                  badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
                                };
                              default:
                                return {
                                  text: 'Unknown status',
                                  description: '',
                                  badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
                                };
                            }
                          };

                          const statusInfo = getStatusInfo(startup.status || 'draft');

                          return (
                            <motion.div
                              key={startup.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.4 + index * 0.05 }}
                              className="bg-muted/30 hover:bg-muted/50 border border-border/50 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md"
                              onClick={() => navigate(`/dashboard/startups/${startup.id}`)}
                            >
                              <h4 className="font-semibold mb-2 truncate">
                                {startup.title || startup.name || 'Untitled'}
                              </h4>

                              {/* Status Badge and Description */}
                              <div className="mb-3">
                                <Badge className={`text-xs mb-1.5 border-0 ${statusInfo.badgeClass}`}>
                                  {statusInfo.text}
                                </Badge>
                                <p className="text-xs text-muted-foreground">
                                  {statusInfo.description}
                                </p>
                              </div>

                              <p className="text-xs text-muted-foreground mb-3">
                                Created {new Date(startup.created_at).toLocaleDateString()}
                              </p>

                              {/* Submit for Review Button — scoped to THIS card only */}
                              {startup.status === 'draft' && (
                                <Button
                                  size="sm"
                                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                    e.stopPropagation();
                                    handleSubmitForReview(startup.id);
                                  }}
                                  disabled={submittingId === startup.id}
                                  className="w-full gradient-lavender rounded-lg hover:opacity-90"
                                >
                                  <Send className="mr-2 h-3 w-3" />
                                  {submittingId === startup.id ? 'Submitting...' : 'Submit for Review'}
                                </Button>
                              )}

                              {/* Rejected - Edit CTA */}
                              {startup.status === 'rejected' && (
                                <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                  <p className="text-xs text-red-600 dark:text-red-400">
                                    Needs improvements. Click to view details.
                                  </p>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <ActivityTimeline
                  activities={recentActivity}
                  title="Recent Activity"
                  maxItems={10}
                  compact={false}
                />
              </motion.div>

              {/* Go to Profile CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="glass-surface border-border/50 bg-gradient-to-br from-[#C9A7EB]/10 to-[#B084E8]/10">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                      <div>
                        <h3 className="mb-2">Complete Your Profile</h3>
                        <p className="text-muted-foreground text-sm">
                          Add more details to help the community know you better
                        </p>
                      </div>
                      <Button
                        className="gradient-lavender shadow-lavender whitespace-nowrap rounded-xl hover:opacity-90"
                        onClick={() => navigate('/profile')}
                      >
                        Go to Profile
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6 lg:col-span-1">
              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="glass-surface border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="hover:gradient-lavender group w-full justify-start rounded-xl transition-all hover:border-transparent hover:text-white"
                      onClick={() => navigate('/idea-analyser')}
                    >
                      <Lightbulb className="mr-2 h-4 w-4 group-hover:text-white" />
                      Analyze Idea
                    </Button>
                    <Button
                      variant="outline"
                      className="hover:gradient-lavender group w-full justify-start rounded-xl transition-all hover:border-transparent hover:text-white"
                      onClick={() => navigate('/case-studies')}
                    >
                      <BookOpen className="mr-2 h-4 w-4 group-hover:text-white" />
                      Solve Case
                    </Button>
                    <Button
                      variant="outline"
                      className="hover:gradient-lavender group w-full justify-start rounded-xl transition-all hover:border-transparent hover:text-white"
                      onClick={() => navigate('/pitch-creator')}
                    >
                      <Sparkles className="mr-2 h-4 w-4 group-hover:text-white" />
                      Create Pitch
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Tips from AI */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="glass-surface border-border/50 bg-gradient-to-br from-[#C9A7EB]/10 to-[#B084E8]/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="text-primary h-4 w-4" />
                      Tips from AI
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      key={currentTip}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.5 }}
                      className="text-sm leading-relaxed"
                    >
                      {aiTips[currentTip]}
                    </motion.div>
                    <div className="mt-4 flex justify-center gap-1">
                      {aiTips.map((_, index) => (
                        <div
                          key={index}
                          className={`h-1.5 rounded-full transition-all ${
                            index === currentTip ? 'bg-primary w-6' : 'bg-muted w-1.5'
                          }`}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
