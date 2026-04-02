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
  Activity,
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
import { getRecentActivity, mergeActivityEvents, type ActivityEvent } from '@/lib/activityService';
import { getFounderMetrics, type FounderMetrics } from '@/lib/metricsService';
import { useFounderDemoMode } from '@/hooks/useDemoMode';
import { demoFounderStartups } from '@/lib/demoData';
import { apiClient } from '@/lib/api-client';
import { getRecentAnalyses, type RecentAnalysis } from '@/lib/aiAnalysis';

export function FounderDashboard() {
  const { user, profile } = useUser();
  const navigate = useNavigate();
  const [currentTip, setCurrentTip] = useState(0);
  const [myStartups, setMyStartups] = useState<Idea[]>([]);
  const [activityEvents,     setActivityEvents]     = useState<ActivityEvent[]>([]);
  const [activityCursor,     setActivityCursor]     = useState<string | null>(null);
  const [hasMoreActivity,    setHasMoreActivity]    = useState(false);
  const [loadingMoreActivity, setLoadingMoreActivity] = useState(false);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
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
          const [ideas, activityPage, founderMetrics, analyses] = await Promise.all([
            getUserIdeas(user.id),
            getRecentActivity(user.id, 10),
            getFounderMetrics(user.id),
            getRecentAnalyses().catch(() => [] as RecentAnalysis[]),
          ]);

          setMyStartups(ideas);
          setActivityEvents(activityPage.events);
          setActivityCursor(activityPage.nextCursor);
          setHasMoreActivity(activityPage.nextCursor !== null);
          setMetrics(founderMetrics);
          setRecentAnalyses(analyses);
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
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_activity',
            filter: `user_id=eq.${userId}`,
          },
          async (payload) => {
            try {
              const row = payload.new as Record<string, unknown>;
              // Validate minimum fields — fall back to full refetch if malformed
              if (!row?.id || !row?.type || !row?.title || !row?.created_at) {
                const { events } = await getRecentActivity(userId, 10);
                setActivityEvents(events);
                return;
              }
              const newEvent: ActivityEvent = {
                id:         row.id as string,
                user_id:    userId,
                type:       row.type as ActivityEvent['type'],
                title:      row.title as string,
                metadata:   (row.metadata as Record<string, unknown>) ?? null,
                created_at: row.created_at as string,
              };
              setActivityEvents(prev => {
                // Dedupe by id — Supabase can deliver duplicates on reconnect
                if (prev.some(e => e.id === newEvent.id)) return prev;
                // Prepend + re-sort by created_at DESC (in case of clock skew)
                const updated = [newEvent, ...prev];
                updated.sort((a, b) =>
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                return updated.slice(0, 10);
              });
            } catch (err) {
              console.error('Error updating activity feed:', err);
            }
          }
        )
        .subscribe(async (status) => {
          // On every (re)connect: merge latest events into state without flicker.
          // mergeActivityEvents dedupes by id so repeated calls are safe.
          if (status === 'SUBSCRIBED') {
            try {
              const { events } = await getRecentActivity(userId, 10);
              setActivityEvents(prev => mergeActivityEvents(prev, events, 10));
            } catch { /* silent — subscription already works */ }
          }
        });

      return () => {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // ── Periodic silent sync (60 s) ───────────────────────────────────────────
  // Catches any events missed during realtime downtime without causing flicker.
  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;
    const id = setInterval(async () => {
      try {
        const { events } = await getRecentActivity(userId, 10);
        setActivityEvents(prev => mergeActivityEvents(prev, events, 10));
      } catch { /* silent */ }
    }, 60_000);
    return () => clearInterval(id);
  }, [user?.id]);

  // ── Load more activity (cursor-based) ────────────────────────────────────
  const loadMoreActivity = async () => {
    if (!user?.id || !activityCursor || loadingMoreActivity) return;
    setLoadingMoreActivity(true);
    try {
      const { events, nextCursor } = await getRecentActivity(user.id, 10, activityCursor);
      setActivityEvents(prev => {
        const seen = new Set(prev.map(e => e.id));
        return [...prev, ...events.filter(e => !seen.has(e.id))];
      });
      setActivityCursor(nextCursor);
      setHasMoreActivity(nextCursor !== null);
    } catch (err) {
      console.error('Load more activity failed:', err);
    } finally {
      setLoadingMoreActivity(false);
    }
  };

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

  const formatRelativeTime = (iso: string): string => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(diffMs / 1000);
    const min = Math.floor(sec / 60);
    const hr  = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    if (sec < 60)  return 'Just now';
    if (min < 60)  return `${min} min ago`;
    if (hr  < 24)  return `${hr} hour${hr > 1 ? 's' : ''} ago`;
    if (day === 1) return 'Yesterday';
    if (day <  7)  return `${day} days ago`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

              {/* Recent Analyses */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <Card className="glass-surface border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Recent Analyses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="h-8 w-8 rounded-lg bg-muted flex-shrink-0" />
                            <div className="flex-1 space-y-1.5">
                              <div className="h-3 w-3/5 rounded bg-muted" />
                              <div className="h-3 w-1/4 rounded bg-muted" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : recentAnalyses.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No recent activity yet</p>
                        <p className="text-xs mt-1">Analyze an idea to see it here</p>
                      </div>
                    ) : (
                      <ul className="space-y-1">
                        {recentAnalyses.map((item, index) => (
                          <motion.li
                            key={item.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <button
                              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/60 cursor-pointer group"
                              onClick={() => navigate(`/idea/${item.id}`)}
                            >
                              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Lightbulb className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                  {item.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatRelativeTime(item.updatedAt)}
                                </p>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </button>
                          </motion.li>
                        ))}
                      </ul>
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
                <Card className="glass-surface border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />
                            <div className="flex-1 space-y-1.5">
                              <div className="h-3 w-2/5 rounded bg-muted" />
                              <div className="h-3 w-1/4 rounded bg-muted" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : activityEvents.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Sparkles className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No recent activity yet</p>
                        <p className="text-xs mt-1">Start analyzing ideas to see your activity here</p>
                      </div>
                    ) : (
                      <>
                      <ul className="space-y-1">
                        {activityEvents.map((event, index) => {
                          type ActivityStyle = { color: string; icon: React.ElementType };
                          const styleMap: Record<ActivityEvent['type'] | 'unknown', ActivityStyle> = {
                            idea_analyzed:     { color: 'bg-yellow-500/10 text-yellow-500', icon: Lightbulb },
                            pitch_created:     { color: 'bg-blue-500/10 text-blue-500',     icon: Send },
                            funding_submitted: { color: 'bg-green-500/10 text-green-500',   icon: CheckCircle2 },
                            case_viewed:       { color: 'bg-purple-500/10 text-purple-500', icon: BookOpen },
                            community_action:  { color: 'bg-pink-500/10 text-pink-500',     icon: Users },
                            profile_updated:   { color: 'bg-muted text-muted-foreground',   icon: Activity },
                            unknown:           { color: 'bg-muted text-muted-foreground',   icon: Activity },
                          };
                          const { color: colorClass, icon: Icon } =
                            styleMap[event.type] ?? styleMap.unknown;
                          return (
                            <motion.li
                              key={event.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.04 }}
                              className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                            >
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{event.title}</p>
                                <p className="text-xs text-muted-foreground">{formatRelativeTime(event.created_at)}</p>
                              </div>
                            </motion.li>
                          );
                        })}
                      </ul>
                      {hasMoreActivity && (
                        <div className="mt-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={loadMoreActivity}
                            disabled={loadingMoreActivity}
                          >
                            {loadingMoreActivity
                              ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Loading…</>
                              : 'Load more'}
                          </Button>
                        </div>
                      )}
                      </>
                    )}
                  </CardContent>
                </Card>
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
