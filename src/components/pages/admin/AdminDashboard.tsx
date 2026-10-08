import { motion } from 'motion/react';
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  Handshake,
  Info,
  Loader2,
} from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../ui/button';

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
          )
            .then(({ data, error }) => {
              if (error) throw error;
              return data;
            })
            .catch((err: any) => {
              if (import.meta.env.DEV) {
                console.error('[AdminDashboard] Error fetching VC apps:', err);
              }
              return [] as any[];
            }),
          (profile?.role === 'super_admin' ? getAllNotifications(20) : Promise.resolve([])).catch(
            err => {
              if (import.meta.env.DEV) {
                console.error('[AdminDashboard] Error fetching notifications:', err);
              }
              return [];
            }
          ),
          getAdminMetrics().catch(err => {
            if (import.meta.env.DEV) {
              console.error('[AdminDashboard] Error fetching metrics:', err);
            }
            return null;
          }),
        ]);

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
  const approvalRate =
    displayMetrics && displayMetrics.totalStartups > 0
      ? Math.round((displayMetrics.approvedStartups / displayMetrics.totalStartups) * 100)
      : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const kpis: { label: string; value: number | string; tone: string; route?: string }[] = [
    { label: 'Pending review', value: displayMetrics?.pendingReview || 0, tone: 'var(--adm-brass)', route: '/admin/startups?status=pending' },
    { label: 'Approved startups', value: displayMetrics?.approvedStartups || 0, tone: 'var(--adm-sage)', route: '/admin/startups?status=approved' },
    { label: 'Total startups', value: displayMetrics?.totalStartups || 0, tone: 'var(--primary)', route: '/admin/startups' },
    { label: 'Intro requests', value: displayMetrics?.totalIntroRequests || 0, tone: 'var(--adm-slate)', route: '/admin/intro-requests' },
    { label: 'Founders', value: displayMetrics?.totalFounders || 0, tone: 'var(--adm-terra)' },
    { label: 'VCs', value: displayMetrics?.totalVCs || 0, tone: 'var(--accent)' },
    { label: 'Intro conversion', value: `${displayMetrics?.conversionRate || 0}%`, tone: 'var(--adm-sage)' },
    { label: 'Approval rate', value: `${approvalRate}%`, tone: 'var(--primary)' },
  ];

  const chipTone = (status: string) =>
    status === 'approved' || status === 'accepted'
      ? 'approved'
      : status === 'rejected'
        ? 'rejected'
        : 'pending';

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay },
  });

  return (
    <div className="adm-page">
      <motion.div className="adm-hero" {...fadeUp()}>
        <div>
          <p className="adm-eyebrow">{today}</p>
          <h1 className="adm-title">
            {greeting}, {profile?.name?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="adm-subtitle">Here&apos;s what needs your attention across Motif.</p>
        </div>
        <Button onClick={() => navigate('/admin/startups?status=pending')}>
          Open review queue
          <ArrowUpRight className="ml-1.5 h-4 w-4" />
        </Button>
      </motion.div>

      {isDemoMode && (
        <div className="adm-note">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <strong>Demo metrics.</strong> Real platform data will appear here as founders join
            and startups are submitted.
          </div>
        </div>
      )}

      <motion.div className="adm-kpis" {...fadeUp(0.05)}>
        {kpis.map(kpi => {
          const content = (
            <>
              <span className="adm-kpi__label">
                <span className="adm-kpi__dot" />
                {kpi.label}
              </span>
              <span className="adm-kpi__value">{kpi.value}</span>
            </>
          );
          const style = { '--adm-tone': kpi.tone } as CSSProperties;
          return kpi.route ? (
            <button
              key={kpi.label}
              type="button"
              className="adm-kpi"
              style={style}
              onClick={() => navigate(kpi.route!)}
            >
              {content}
            </button>
          ) : (
            <div key={kpi.label} className="adm-kpi" style={style}>
              {content}
            </div>
          );
        })}
      </motion.div>

      <div className="adm-grid">
        <div style={{ minWidth: 0 }}>
          <motion.section className="adm-panel" {...fadeUp(0.1)}>
            <div className="adm-panel__head">
              <h2 className="adm-panel__title">
                Review queue
                <span className="adm-panel__count">{pendingStartups.length}</span>
              </h2>
              <button type="button" className="adm-link" onClick={() => navigate('/admin/startups')}>
                All startups <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="adm-panel__body">
              {isLoading ? (
                <div className="adm-empty">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Loading submissions…
                </div>
              ) : pendingStartups.length === 0 ? (
                <div className="adm-empty">
                  <CheckCircle2 className="h-8 w-8" />
                  All caught up — no startups waiting for review.
                </div>
              ) : (
                pendingStartups.map(startup => {
                  const name = startup.title || startup.name || 'Untitled';
                  return (
                    <div key={startup.id} className="adm-row">
                      <div className="adm-row__initial">{name.charAt(0).toUpperCase()}</div>
                      <div className="adm-row__main">
                        <div className="adm-row__title">{name}</div>
                        <div className="adm-row__meta">
                          Submitted {new Date(startup.created_at).toLocaleDateString()} ·{' '}
                          {startup.description || 'No description'}
                        </div>
                      </div>
                      <span className="adm-chip adm-chip--pending">Under review</span>
                    </div>
                  );
                })
              )}
            </div>
          </motion.section>

          <motion.section className="adm-panel" {...fadeUp(0.15)}>
            <div className="adm-panel__head">
              <h2 className="adm-panel__title">
                Introduction requests
                <span className="adm-panel__count">{recentActivity.length}</span>
              </h2>
              <button
                type="button"
                className="adm-link"
                onClick={() => navigate('/admin/intro-requests')}
              >
                Manage <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="adm-panel__body">
              {recentActivity.length === 0 ? (
                <div className="adm-empty">
                  <Clock className="h-8 w-8" />
                  No introduction requests yet.
                </div>
              ) : (
                recentActivity.map(activity => (
                  <div key={activity.id} className="adm-row">
                    <div className="adm-row__initial">
                      <Handshake className="h-4 w-4" />
                    </div>
                    <div className="adm-row__main">
                      <div className="adm-row__title">{activity.idea?.title || 'Startup'}</div>
                      <div className="adm-row__meta">
                        Requested {new Date(activity.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`adm-chip adm-chip--${chipTone(activity.status)}`}>
                      {activity.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.section>

          <motion.div style={{ marginTop: 20 }} {...fadeUp(0.2)}>
            <ActivityTimeline
              activities={auditTimeline}
              title="Platform activity"
              maxItems={20}
            />
          </motion.div>
        </div>

        <aside>
          <motion.section className="adm-panel" {...fadeUp(0.1)}>
            <div className="adm-panel__head">
              <h2 className="adm-panel__title">Quick actions</h2>
            </div>
            <div className="adm-panel__body" style={{ paddingTop: 16 }}>
              {[
                { label: 'Review startups', icon: Building2, to: '/admin/startups' },
                { label: 'Manage intro requests', icon: Handshake, to: '/admin/intro-requests' },
                { label: 'Edit case studies', icon: BookOpen, to: '/admin/case-studies' },
              ].map(action => (
                <button
                  key={action.to}
                  type="button"
                  className="adm-action"
                  onClick={() => navigate(action.to)}
                >
                  <span className="adm-action__icon">
                    <action.icon className="h-4 w-4" />
                  </span>
                  {action.label}
                  <ArrowUpRight className="adm-action__arrow h-4 w-4" />
                </button>
              ))}
            </div>
          </motion.section>

          <motion.section className="adm-panel" {...fadeUp(0.15)}>
            <div className="adm-panel__head">
              <h2 className="adm-panel__title">Startup approval</h2>
            </div>
            <div className="adm-panel__body" style={{ paddingTop: 18 }}>
              <div className="adm-big-number">{approvalRate}%</div>
              <div
                className="adm-meter"
                role="progressbar"
                aria-valuenow={approvalRate}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Startup approval rate"
              >
                <div className="adm-meter__fill" style={{ width: `${approvalRate}%` }} />
              </div>
              <p className="adm-subtitle" style={{ fontSize: 13 }}>
                {displayMetrics?.approvedStartups || 0} of {displayMetrics?.totalStartups || 0}{' '}
                startups approved for VCs
              </p>
            </div>
          </motion.section>

          <motion.section className="adm-panel" {...fadeUp(0.2)}>
            <div className="adm-panel__head">
              <h2 className="adm-panel__title">Intro pipeline</h2>
            </div>
            <div className="adm-panel__body">
              <div className="adm-metric">
                <span>Conversion rate</span>
                <span className="adm-metric__value">{displayMetrics?.conversionRate || 0}%</span>
              </div>
              <div className="adm-metric">
                <span>Approved intros</span>
                <span className="adm-metric__value">
                  {displayMetrics?.approvedIntroRequests || 0}
                </span>
              </div>
              <div className="adm-metric">
                <span>Total requests</span>
                <span className="adm-metric__value">{displayMetrics?.totalIntroRequests || 0}</span>
              </div>
            </div>
          </motion.section>
        </aside>
      </div>
    </div>
  );
};

export default AdminDashboard;
