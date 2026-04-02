import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText, Clock, CheckCircle2, XCircle, Sparkles,
  AlertCircle, RefreshCw, ChevronDown, ChevronUp,
  Banknote, ArrowRight, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  getMyApplications,
  type VcApplicationResponse,
  type PagedResponse,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_TIMELINE,
  type ApplicationStatus,
} from '@/lib/vcApplicationService';
import { useUser } from '@/contexts/UserContext';

// ── Skeleton loader ────────────────────────────────────────────────────────────

function ApplicationSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-xl border border-border/50 bg-muted/20 p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
            <div className="h-6 w-24 bg-muted rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Summary card config ────────────────────────────────────────────────────────

const SUMMARY_CARDS = [
  { label: 'Submitted',    status: 'submitted'    as ApplicationStatus, icon: FileText,    color: 'text-blue-600',   bg: 'bg-blue-600/10' },
  { label: 'Under Review', status: 'under_review' as ApplicationStatus, icon: Clock,       color: 'text-amber-600',  bg: 'bg-amber-600/10' },
  { label: 'Interested',   status: 'interested'   as ApplicationStatus, icon: CheckCircle2,color: 'text-green-600',  bg: 'bg-green-600/10' },
  { label: 'Funded',       status: 'funded'       as ApplicationStatus, icon: Sparkles,    color: 'text-purple-600', bg: 'bg-purple-600/10' },
];

// ── Status Timeline ────────────────────────────────────────────────────────────

function StatusTimeline({ app }: { app: VcApplicationResponse }) {
  const rejected  = app.status === 'rejected';
  const stepIndex = rejected ? -1 : STATUS_TIMELINE.indexOf(app.status as ApplicationStatus);

  return (
    <div className="mt-4 pt-4 border-t border-border/50">
      <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
        Application Progress
      </p>
      <div className="relative flex items-start">
        <div className="absolute top-3 left-3 right-3 h-[2px] bg-border" />
        <div
          className="absolute top-3 left-3 h-[2px] bg-primary transition-all duration-500"
          style={{
            width: rejected ? '0%'
              : stepIndex <= 0 ? '0%'
              : `calc(${(stepIndex / (STATUS_TIMELINE.length - 1)) * 100}% - 0.75rem)`,
          }}
        />
        {STATUS_TIMELINE.map((s, i) => {
          const isComplete = !rejected && i < stepIndex;
          const isActive   = !rejected && i === stepIndex;
          // Get the timestamp from history if available
          const historyEntry = app.history?.find(h => h.newStatus === s);
          const ts = historyEntry?.changedAt
            ? new Date(historyEntry.changedAt).toLocaleDateString('en-US', { dateStyle: 'short' })
            : null;

          return (
            <div key={s} className="relative z-10 flex flex-1 flex-col items-center gap-1.5">
              <motion.div
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.4 }}
                className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  isComplete ? 'bg-primary border-primary'
                  : isActive ? 'bg-primary border-primary shadow-[0_0_0_3px] shadow-primary/20'
                  : 'bg-background border-border'
                }`}
              >
                {isComplete
                  ? <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                  : <span className={`text-[9px] font-bold ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}>{i + 1}</span>
                }
              </motion.div>
              <span className={`text-[10px] text-center leading-tight w-14 ${
                isActive ? 'text-foreground font-semibold' : isComplete ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {STATUS_LABELS[s]}
              </span>
              {ts && (
                <span className="text-[9px] text-muted-foreground/70 text-center">{ts}</span>
              )}
            </div>
          );
        })}

        {rejected && (
          <div className="relative z-10 flex flex-col items-center gap-1.5 ml-2">
            <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center">
              <XCircle className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[10px] text-red-500 font-semibold">Rejected</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Application Row ────────────────────────────────────────────────────────────

function ApplicationRow({ app }: { app: VcApplicationResponse }) {
  const [expanded, setExpanded] = useState(false);
  const label = STATUS_LABELS[app.status as ApplicationStatus] ?? app.status;
  const color = STATUS_COLORS[app.status as ApplicationStatus] ?? '';

  return (
    <motion.div layout className="rounded-xl border border-border/50 bg-muted/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{app.ideaTitle || 'Funding Application'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Submitted {new Date(app.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
          </p>
        </div>
        <Badge className={`text-xs border-0 shrink-0 ${color}`}>{label}</Badge>
        {expanded
          ? <ChevronUp   className="h-4 w-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 space-y-3">
              {app.vcNotes && (
                <div className="rounded-lg bg-background/60 border border-border/50 p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Reviewer Notes</p>
                  <p className="text-sm leading-relaxed">{app.vcNotes}</p>
                </div>
              )}
              {app.reviewedAt && (
                <p className="text-xs text-muted-foreground">
                  Last reviewed:{' '}
                  {new Date(app.reviewedAt).toLocaleDateString('en-US', { dateStyle: 'long' })}
                </p>
              )}
              <StatusTimeline app={app} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Pagination controls ────────────────────────────────────────────────────────

function Pagination({
  paged, page, onPage,
}: { paged: PagedResponse<VcApplicationResponse>; page: number; onPage: (p: number) => void }) {
  if (paged.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-xs text-muted-foreground">
        {paged.totalCount} application{paged.totalCount !== 1 ? 's' : ''} total
      </p>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg"
          disabled={page === 0} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs px-2 text-muted-foreground">
          {page + 1} / {paged.totalPages}
        </span>
        <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg"
          disabled={page >= paged.totalPages - 1} onClick={() => onPage(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export function FundingDashboardPage() {
  const navigate           = useNavigate();
  const { profile, isVC }  = useUser();
  const [paged,   setPaged]   = useState<PagedResponse<VcApplicationResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [page,    setPage]    = useState(0);

  // ── Access guard: VCs don't belong here ────────────────────────────────────
  useEffect(() => {
    if (profile && isVC) {
      toast.error('Access denied', { description: 'This page is for founders only.' });
      navigate('/vc/dashboard', { replace: true });
    }
  }, [profile, isVC, navigate]);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyApplications({ page: p, size: PAGE_SIZE });
      setPaged(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load applications';
      setError(msg);
      toast.error('Failed to load applications', { description: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [load, page]);

  const handlePage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const apps   = paged?.items ?? [];
  const counts = SUMMARY_CARDS.reduce<Record<string, number>>((acc, card) => {
    acc[card.status] = apps.filter(a => a.status === card.status).length;
    return acc;
  }, {});

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="border-b border-border bg-gradient-to-br from-[#C9A7EB]/20 via-background to-background py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-1">
              <Banknote className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Funding Applications</h1>
            </div>
            <p className="text-muted-foreground text-sm">Track the status of your funding requests</p>
          </motion.div>
        </div>
      </section>

      <section className="py-6">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Error banner */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="flex-1 text-sm text-red-700 dark:text-red-300">{error}</p>
              <Button size="sm" variant="outline" onClick={() => load(page)}
                className="border-red-600 text-red-600 hover:bg-red-50 rounded-lg">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Retry
              </Button>
            </motion.div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {SUMMARY_CARDS.map((card, i) => (
              <motion.div key={card.status} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}>
                <Card className="glass-surface border-border/50 hover:shadow-lavender transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                        <card.icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{loading ? '–' : (counts[card.status] ?? 0)}</p>
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Applications list */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-surface border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    My Applications
                    {paged && !loading && (
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        ({paged.totalCount})
                      </span>
                    )}
                  </CardTitle>
                  <Button size="sm"
                    className="gradient-lavender text-white rounded-xl shadow-lavender hover:opacity-90"
                    onClick={() => navigate('/get-funded')}>
                    New Request<ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <ApplicationSkeleton />
                ) : apps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Banknote className="h-8 w-8 text-primary opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold">No applications yet</p>
                      <p className="text-sm text-muted-foreground">
                        Submit a funding request to get connected with VCs.
                      </p>
                    </div>
                    <Button className="gradient-lavender text-white rounded-xl shadow-lavender hover:opacity-90"
                      onClick={() => navigate('/get-funded')}>
                      Get Funded
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {apps.map(app => <ApplicationRow key={app.id} app={app} />)}
                    {paged && (
                      <Pagination paged={paged} page={page} onPage={handlePage} />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
