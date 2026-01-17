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
          supabase
            .from('vc_applications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5)
            .then(({ data, error }) => {
              if (error) throw error;
              return data;
            })
            .catch(err => {
              if (import.meta.env.DEV) {
                console.error('[AdminDashboard] Error fetching VC apps:', err);
              }
              return [];
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
          .filter((s) => s.status === 'pending_review')
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
      color: 'text-blue-600',
      bgColor: 'bg-blue-600/10',
    },
    {
      label: 'Total VCs',
      value: displayMetrics?.totalVCs || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-600/10',
    },
    {
      label: 'Total Startups',
      value: displayMetrics?.totalStartups || 0,
      icon: Building2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Pending Review',
      value: displayMetrics?.pendingReview || 0,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-600/10',
    },
    {
      label: 'Approved Startups',
      value: displayMetrics?.approvedStartups || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-600/10',
    },
    {
      label: 'Intro Requests',
      value: displayMetrics?.totalIntroRequests || 0,
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Conversion Rate',
      value: `${displayMetrics?.conversionRate || 0}%`,
      icon: TrendingUp,
      color: 'text-[#A9F5D0]',
      bgColor: 'bg-[#A9F5D0]/10',
    },
  ];

  return (
    <div className="bg-background min-h-screen">
      {/* Header Section */}
      <section className="border-border border-b bg-background py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-red-600" />
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground">
                  Platform overview and management
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-4">
            {/* Main Content Area */}
            <div className="space-y-4 lg:col-span-3">
              {/* Demo Mode Banner */}
              {isDemoMode && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {statCards.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="glass-surface border-border/50 hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col gap-3">
                          <div
                            className={`h-10 w-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}
                          >
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                          </div>
                          <div>
                            <p className="text-3xl font-bold">{stat.value}</p>
                            <p className="text-muted-foreground text-sm">{stat.label}</p>
                          </div>
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
                <Card className="glass-surface border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        Pending Reviews
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/admin/startups')}
                        className="rounded-xl"
                      >
                        View All Startups
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                        <p>Loading...</p>
                      </div>
                    ) : pendingStartups.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50 text-green-600" />
                        <p className="mb-2 font-semibold">All Caught Up</p>
                        <p className="text-sm">No pending startup reviews</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingStartups.map((startup, index) => (
                          <motion.div
                            key={startup.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                            className="bg-muted/30 border border-border/50 rounded-xl p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold mb-1 truncate">
                                  {startup.title || startup.name || 'Untitled'}
                                </h4>
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                                  {startup.description || 'No description'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Submitted {new Date(startup.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0 whitespace-nowrap">
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
                <Card className="glass-surface border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentActivity.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent platform activity</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentActivity.map((activity, index) => (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                            className="bg-muted/30 flex items-center justify-between gap-4 rounded-xl p-3"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                Introduction requested: {activity.idea?.title || 'Startup'}
                              </p>
                              <p className="text-xs text-muted-foreground">
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

            {/* Right Sidebar */}
            <div className="space-y-4 lg:col-span-1">
              {/* Admin Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="glass-surface border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Admin Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:gradient-lavender group w-full justify-start rounded-lg transition-all hover:border-transparent hover:text-white"
                      onClick={() => navigate('/admin/startups')}
                    >
                      <Eye className="mr-2 h-4 w-4 group-hover:text-white" />
                      Review Startups
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:gradient-lavender group w-full justify-start rounded-lg transition-all hover:border-transparent hover:text-white"
                      onClick={() => navigate('/admin/intro-requests')}
                    >
                      <TrendingUp className="mr-2 h-4 w-4 group-hover:text-white" />
                      Manage Intro Requests
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:gradient-lavender group w-full justify-start rounded-lg transition-all hover:border-transparent hover:text-white"
                      onClick={() => navigate('/admin/case-studies')}
                    >
                      <BookOpen className="mr-2 h-4 w-4 group-hover:text-white" />
                      Manage Case Studies
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Platform Health */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="glass-surface border-border/50 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      Intro Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Conversion Rate</span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0">
                          {displayMetrics?.conversionRate || 0}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Approved Intros</span>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0">
                          {displayMetrics?.approvedIntroRequests || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Requests</span>
                        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-0">
                          {displayMetrics?.totalIntroRequests || 0}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="glass-surface border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Startup Approval</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">
                        {displayMetrics && displayMetrics.totalStartups > 0
                          ? Math.round(
                            (displayMetrics.approvedStartups / displayMetrics.totalStartups) * 100
                          )
                          : 0}
                        %
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
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
