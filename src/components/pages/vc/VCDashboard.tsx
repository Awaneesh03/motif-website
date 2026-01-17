import { motion } from 'motion/react';
import {
  Building2,
  TrendingUp,
  Users,
  Eye,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Info,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { getConnectedStartups, type ConnectedStartup } from '@/lib/introRequestService';
import { getUserNotifications, type Notification } from '@/lib/notificationService';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { getVCMetrics, type VCMetrics } from '@/lib/metricsService';
import { useVCDemoMode } from '@/hooks/useDemoMode';
import { demoVCStartups } from '@/lib/demoData';

const VCDashboard = () => {
  const { profile, isVC } = useUser();
  const navigate = useNavigate();
  const [approvedStartups, setApprovedStartups] = useState<any[]>([]);
  const [myIntroRequests, setMyIntroRequests] = useState<any[]>([]);
  const [connectedStartups, setConnectedStartups] = useState<ConnectedStartup[]>([]);
  const [recentActivity, setRecentActivity] = useState<Notification[]>([]);
  const [metrics, setMetrics] = useState<VCMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // HARD ROLE GUARD - VC only
  useEffect(() => {
    if (profile && !isVC) {
      console.warn('[VCDashboard] Unauthorized access attempt - redirecting');
      navigate('/dashboard', { replace: true });
    }
  }, [profile, isVC, navigate]);

  // Check if demo mode should be enabled
  const { isDemoMode } = useVCDemoMode(myIntroRequests, connectedStartups, metrics);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load approved startups
        const { data: startups, error: startupsError } = await supabase
          .from('ideas')
          .select('*')
          .eq('status', 'approved_for_vc')
          .order('created_at', { ascending: false })
          .limit(10);

        if (startupsError) throw startupsError;
        if (startups) setApprovedStartups(startups);

        // Load my intro requests
        if (profile?.id) {
          const [requests, connections, notifications, vcMetrics] = await Promise.all([
            supabase
              .from('vc_applications')
              .select('*')
              .eq('vc_id', profile.id)
              .order('created_at', { ascending: false })
              .then(({ data }) => data),
            getConnectedStartups(profile.id),
            getUserNotifications(profile.id, 10),
            getVCMetrics(profile.id),
          ]);

          if (requests) setMyIntroRequests(requests);
          setConnectedStartups(connections);
          setRecentActivity(notifications);
          setMetrics(vcMetrics);
        }
      } catch (err) {
        console.error('Error loading VC dashboard data:', err);
        setError('Failed to load dashboard data. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [profile]);

  const stats = [
    {
      label: 'Available Startups',
      value: metrics?.availableStartups.toString() || '0',
      icon: Building2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Intro Requests Sent',
      value: metrics?.introRequestsSent.toString() || '0',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600/10',
    },
    {
      label: 'Approved Connections',
      value: metrics?.approvedConnections.toString() || '0',
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-600/10',
    },
    {
      label: 'Pending Requests',
      value: metrics?.pendingRequests.toString() || '0',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-600/10',
    },
  ];

  return (
    <div className="bg-background min-h-screen">
      {/* Header Section */}
      <section className="via-background to-background border-border relative overflow-hidden border-b bg-gradient-to-br from-[#C9A7EB]/20 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <h1>Welcome, {profile?.name || 'Investor'} 👔</h1>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Verified VC
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Discover and connect with promising startups
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

              {/* Featured Startups */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="glass-surface border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Featured Startups
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/vc/startups')}
                        className="rounded-xl"
                      >
                        View All
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                        <p>Loading startups...</p>
                      </div>
                    ) : approvedStartups.length === 0 && isDemoMode ? (
                      <div>
                        {/* Demo Mode Banner */}
                        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                Demo Mode - Example Startups
                              </h4>
                              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                                These are example startups to demonstrate the platform.
                                Real startups will appear once approved by our team.
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                Process: Discover Startups → Request Introduction → Get Connected
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Demo Startup Cards */}
                        <div className="grid gap-4 md:grid-cols-2 mb-6">
                          {demoVCStartups.slice(0, 3).map((demoStartup, index) => (
                            <motion.div
                              key={demoStartup.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.4 + index * 0.05 }}
                              className="bg-muted/30 border border-dashed border-border rounded-xl p-4 relative opacity-75"
                            >
                              {/* Demo Badge */}
                              <div className="absolute top-2 right-2">
                                <Badge variant="outline">Demo</Badge>
                              </div>
                              <p className="text-muted-foreground text-sm">
                                {demoStartup.description || 'Curated example startup.'}
                              </p>
                              <div className="mt-3 text-xs text-muted-foreground">
                                {demoStartup.industry || 'Industry'} • {demoStartup.stage || 'Stage'}
                              </div>
                              <div className="mt-4 flex gap-2">
                                <Button size="sm" variant="outline">View</Button>
                                <Button size="sm">Request Intro</Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {/* CTA Section */}
                        <div className="text-center py-8 border-2 border-dashed border-primary/30 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5">
                          <Building2 className="h-12 w-12 mx-auto mb-3 text-primary" />
                          <p className="text-lg font-semibold mb-2">Submit your thesis to see live matches</p>
                          <p className="text-muted-foreground mb-4 text-sm">
                            Complete onboarding to receive curated startups aligned to your preferences.
                          </p>
                          <Button onClick={() => navigate('/vc/onboarding')} className="rounded-xl">Complete Onboarding</Button>
                        </div>
                      </div>
                    ) : approvedStartups.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No approved startups yet.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {approvedStartups.slice(0, 4).map((startup) => (
                          <div
                            key={startup.id}
                            className="rounded-xl border border-border/50 bg-muted/20 p-4"
                          >
                            <p className="font-semibold mb-1">
                              {startup.title || 'Startup'}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {startup.description || 'No description available.'}
                            </p>
                            <div className="mt-3 flex items-center justify-between">
                              <Badge variant="outline">{startup.stage || 'Stage'}</Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/vc/startups/${startup.id}`)}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Connected Startups */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <Card className={`glass-surface border-border/50 ${connectedStartups.length > 0 ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-800/20' : ''}`}>
                  <CardHeader>
                    <CardTitle>Connected Startups</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {connectedStartups.length === 0 ? (
                      <p className="text-muted-foreground text-sm">You have no connected startups yet.</p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {connectedStartups.map((s) => (
                          <li key={s.id} className="flex items-center justify-between">
                            <span>{s.startupName}</span>
                            <Badge variant="outline">Connected</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* My Intro Requests */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="glass-surface border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      My Connection Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {myIntroRequests.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No introduction requests yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myIntroRequests.slice(0, 5).map((request, index) => (
                          <motion.div
                            key={request.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                            className="bg-muted/30 hover:bg-muted/50 flex items-center justify-between gap-4 rounded-xl p-3 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {request.idea?.title || 'Startup'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge
                              className={`capitalize border-0 ${
                                request.status === 'accepted'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : request.status === 'pending'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}
                            >
                              {request.status}
                            </Badge>
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
                transition={{ delay: 0.5 }}
              >
                <ActivityTimeline
                  activities={recentActivity}
                  title="Recent Activity"
                  maxItems={10}
                  compact={false}
                />
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
                      onClick={() => navigate('/vc/startups')}
                    >
                      <Eye className="mr-2 h-4 w-4 group-hover:text-white" />
                      Browse Startups
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Platform Insights */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="glass-surface border-border/50 bg-gradient-to-br from-[#C9A7EB]/10 to-[#B084E8]/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="text-primary h-4 w-4" />
                      Your Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Requests Sent</span>
                        <span className="font-semibold">{metrics?.introRequestsSent || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Connections</span>
                        <span className="font-semibold">{metrics?.approvedConnections || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Pending</span>
                        <span className="font-semibold">{metrics?.pendingRequests || 0}</span>
                      </div>
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

export default VCDashboard;
