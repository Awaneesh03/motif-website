import { motion } from 'motion/react';
import {
  Shield,
  Users,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  TrendingUp,
  Info,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';

import { getAllStartups } from '@/lib/startupService';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { getAllNotifications, type Notification } from '@/lib/notificationService';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { getAdminMetrics, type AdminMetrics } from '@/lib/metricsService';
import { useAdminDemoMode } from '@/hooks/useDemoMode';
import { demoAdminMetrics } from '@/lib/demoData';

const AdminDashboard = () => {
  const { profile, isAdmin } = useUser();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [pendingStartups, setPendingStartups] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [auditTimeline, setAuditTimeline] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // HARD ROLE GUARD - Admin only
  useEffect(() => {
    if (profile && !isAdmin) {
      console.warn('[AdminDashboard] Unauthorized access attempt - redirecting');
      navigate('/dashboard', { replace: true });
    }
  }, [profile, isAdmin, navigate]);

  // Check if demo mode should be enabled
  const { isDemoMode } = useAdminDemoMode(pendingStartups, metrics);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        if (import.meta.env.DEV) {
          console.log('[AdminDashboard] inner loadStats starting...');
        }
        // Load all data in parallel
        const [startups, vcRequests, timeline, adminMetrics] = await Promise.all([
          getAllStartups().catch(err => {
            if (import.meta.env.DEV) {
              console.error('[AdminDashboard] Error fetching startups:', err);
            }
            return [];
          }),
          Promise.resolve(
            supabase
              .from('vc_applications')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(5)
          ).then(({ data, error }) => {
              if (error) throw error;
              return data;
            })
            .catch((err: any) => {
              if (import.meta.env.DEV) {
                console.error('[AdminDashboard] Error fetching VC apps:', err);
              }
              return [] as any[];
            }),
          (profile?.role === 'super_admin'
            ? getAllNotifications(20)
            : Promise.resolve([])
          ).catch(err => {
            if (import.meta.env.DEV) {
              console.error('[AdminDashboard] Error fetching notifications:', err);
            }
            return [];
          }),
          getAdminMetrics().catch(err => {
            if (import.meta.env.DEV) {
              console.error('[AdminDashboard] Error fetching metrics:', err);
            }
            return null;
          }),
        ]);

        if (import.meta.env.DEV) {
          console.log('[AdminDashboard] Data fetch complete');
        }

        // Get pending startups for review
        const pending = (startups || [])
          .filter((s: any) => s.status === 'pending_review')
          .slice(0, 5);

        setPendingStartups(pending);
        if (vcRequests) setRecentActivity(vcRequests);
        setAuditTimeline(timeline || []);
        if (adminMetrics) setMetrics(adminMetrics);

      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[AdminDashboard] Critical error loading stats:', error);
        }
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, [profile]);

  // Use demo metrics if in demo mode, otherwise use real metrics
  const displayMetrics = isDemoMode ? demoAdminMetrics : metrics;

  const statCards = [
    {
      label: 'Total Founders',
      value: displayMetrics?.totalFounders || 0,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-500/20',
    },
    {
      label: 'Total VCs',
      value: displayMetrics?.totalVCs || 0,
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-500/20',
    },
    {
      label: 'Total Startups',
      value: displayMetrics?.totalStartups || 0,
      icon: Building2,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-500/20',
      route: '/admin/startups',
    },
    {
      label: 'Pending Review',
      value: displayMetrics?.pendingReview || 0,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-500/20',
      route: '/admin/startups?status=pending',
    },
    {
      label: 'Approved Startups',
      value: displayMetrics?.approvedStartups || 0,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-500/20',
      route: '/admin/startups?status=approved',
    },
    {
      label: 'Intro Requests',
      value: displayMetrics?.totalIntroRequests || 0,
      icon: TrendingUp,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-100 dark:bg-cyan-500/20',
      route: '/admin/intro-requests',
    },
    {
      label: 'Conversion Rate',
      value: `${displayMetrics?.conversionRate || 0}%`,
      icon: TrendingUp,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-100 dark:bg-teal-500/20',
    },
  ];

  return (
    <div className="min-h-full bg-background text-foreground">
      {/* Header Section */}
      <section className="border-b border-border bg-card shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/20">
                <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Admin Dashboard</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Platform overview and management
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Main Content Area — 9 cols */}
            <div className="space-y-8 lg:col-span-9">
              {/* Demo Mode Banner */}
              {isDemoMode && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-950/50">
                    <div className="flex items-start gap-3">
                      <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                      <div>
                        <h4 className="mb-1 font-semibold text-blue-900 dark:text-blue-100">
                          Demo Mode - Example Metrics
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          These are example metrics to demonstrate the admin dashboard.
                          Real platform data will appear as users join and startups are submitted.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex"
                  >
                    <Card
                      className={`flex w-full flex-col rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md ${stat.route ? 'cursor-pointer hover:border-primary/40' : ''}`}
                      onClick={() => stat.route && navigate(stat.route)}
                    >
                      <CardContent className="flex flex-1 flex-col justify-between p-6">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}
                        >
                          <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <div className="mt-4">
                          <p className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Pending Reviews */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="rounded-xl border border-border bg-card shadow-sm">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        Pending Reviews
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/admin/startups')}
                        className="rounded-lg"
                      >
                        View All Startups
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-0">
                    {isLoading ? (
                      <div className="py-10 text-center">
                        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading...</p>
                      </div>
                    ) : pendingStartups.length === 0 ? (
                      <div className="py-10 text-center">
                        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
                        <p className="mb-1 font-semibold text-foreground">All Caught Up</p>
                        <p className="text-sm text-muted-foreground">No pending startup reviews</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingStartups.map((startup, index) => (
                          <motion.div
                            key={startup.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                            className="rounded-xl border border-border bg-muted p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <h4 className="mb-1 truncate font-semibold text-foreground">
                                  {startup.title || startup.name || 'Untitled'}
                                </h4>
                                <p className="mb-2 line-clamp-1 text-sm text-muted-foreground">
                                  {startup.description || 'No description'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Submitted {new Date(startup.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge className="whitespace-nowrap border-0 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                                Under Review
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
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
                <Card className="rounded-xl border border-border bg-card shadow-sm">
                  <CardHeader className="p-6 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-0">
                    {recentActivity.length === 0 ? (
                      <div className="py-8 text-center">
                        <Clock className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No recent platform activity</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentActivity.map((activity, index) => (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted p-4"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                Introduction requested: {activity.idea?.title || 'Startup'}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {new Date(activity.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge
                              variant={
                                activity.status === 'accepted'
                                  ? 'default'
                                  : 'secondary'
                              }
                              className="capitalize"
                            >
                              {activity.status}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Admin Audit Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <ActivityTimeline
                  activities={auditTimeline}
                  title="Platform Activity Timeline"
                  maxItems={20}
                />
              </motion.div>
            </div>

            {/* Right Sidebar — 3 cols */}
            <div className="space-y-6 lg:col-span-3">
              {/* Admin Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="rounded-xl border border-border bg-card shadow-sm">
                  <CardHeader className="p-6 pb-4">
                    <CardTitle className="text-lg font-semibold text-foreground">Admin Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 px-6 pb-6 pt-0">
                    <Button
                      variant="outline"
                      className="hover:gradient-lavender group h-11 w-full justify-start rounded-lg text-sm font-medium transition-all hover:border-transparent hover:text-white"
                      onClick={() => navigate('/admin/startups')}
                    >
                      <Eye className="mr-2 h-4 w-4 group-hover:text-white" />
                      Review Startups
                    </Button>
                    <Button
                      variant="outline"
                      className="hover:gradient-lavender group h-11 w-full justify-start rounded-lg text-sm font-medium transition-all hover:border-transparent hover:text-white"
                      onClick={() => navigate('/admin/intro-requests')}
                    >
                      <TrendingUp className="mr-2 h-4 w-4 group-hover:text-white" />
                      Manage Intro Requests
                    </Button>
                    <Button
                      variant="outline"
                      className="hover:gradient-lavender group h-11 w-full justify-start rounded-lg text-sm font-medium transition-all hover:border-transparent hover:text-white"
                      onClick={() => navigate('/admin/case-studies')}
                    >
                      <BookOpen className="mr-2 h-4 w-4 group-hover:text-white" />
                      Manage Case Studies
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Intro Metrics */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="rounded-xl border border-border bg-gradient-to-br from-indigo-50 to-purple-50 shadow-sm dark:from-indigo-950/30 dark:to-purple-950/30">
                  <CardHeader className="p-6 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                      <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Intro Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 px-6 pb-6 pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Conversion Rate</span>
                      <span className="text-2xl font-semibold text-primary">
                        {displayMetrics?.conversionRate || 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Approved Intros</span>
                      <Badge className="border-0 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                        {displayMetrics?.approvedIntroRequests || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Total Requests</span>
                      <Badge className="border-0 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        {displayMetrics?.totalIntroRequests || 0}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Startup Approval */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="rounded-xl border border-border bg-card shadow-sm">
                  <CardHeader className="p-6 pb-4">
                    <CardTitle className="text-lg font-semibold text-foreground">Startup Approval</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-0">
                    <div className="text-center">
                      <p className="text-4xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                        {displayMetrics && displayMetrics.totalStartups > 0
                          ? Math.round(
                            (displayMetrics.approvedStartups / displayMetrics.totalStartups) * 100
                          )
                          : 0}
                        %
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {displayMetrics?.approvedStartups || 0} of {displayMetrics?.totalStartups || 0} approved
                      </p>
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
};

export default AdminDashboard;
