import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Clock, CheckCircle2, XCircle, FileText, Sparkles,
  Loader2, AlertCircle, RefreshCw, ChevronDown, ChevronUp,
  Search, SlidersHorizontal, MessageSquare, Send,
  ChevronLeft, ChevronRight, Zap, Timer,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  getAllApplications,
  updateApplicationStatus,
  type VcApplicationResponse,
  type PagedResponse,
  type ApplicationStatus,
  STATUS_LABELS,
  STATUS_COLORS,
  canTransitionTo,
} from '@/lib/vcApplicationService';
import { useUser } from '@/contexts/UserContext';

// ── Skeleton loader ────────────────────────────────────────────────────────────

function PipelineSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border border-border/50 bg-muted/20 p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-2/5" />
              <div className="h-3 bg-muted rounded w-1/4" />
            </div>
            <div className="h-6 w-24 bg-muted rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Quick filter config ────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { label: 'All',          value: undefined,       icon: SlidersHorizontal },
  { label: 'Submitted',    value: 'submitted',     icon: FileText },
  { label: 'Under Review', value: 'under_review',  icon: Clock },
  { label: 'Interested',   value: 'interested',    icon: CheckCircle2 },
  { label: 'Rejected',     value: 'rejected',      icon: XCircle },
  { label: 'Funded',       value: 'funded',        icon: Sparkles },
] as const;

const QUICK_FILTERS = [
  { label: 'Under Review Only', icon: Timer, filterFn: (a: VcApplicationResponse) => a.status === 'under_review' },
  {
    label: 'Recently Updated',
    icon: Zap,
    filterFn: (a: VcApplicationResponse) => {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // last 7 days
      return new Date(a.updatedAt).getTime() > cutoff;
    },
  },
] as const;

// ── Pipeline summary cards ─────────────────────────────────────────────────────

const PIPELINE_CARDS = [
  { label: 'Total',        key: 'total',        icon: Users,        color: 'text-primary',    bg: 'bg-primary/10' },
  { label: 'Submitted',    key: 'submitted',    icon: FileText,     color: 'text-blue-600',   bg: 'bg-blue-600/10' },
  { label: 'Under Review', key: 'under_review', icon: Clock,        color: 'text-amber-600',  bg: 'bg-amber-600/10' },
  { label: 'Interested',   key: 'interested',   icon: CheckCircle2, color: 'text-green-600',  bg: 'bg-green-600/10' },
];

// ── Single application card ────────────────────────────────────────────────────

interface AppCardProps {
  app: VcApplicationResponse;
  onUpdated: (updated: VcApplicationResponse) => void;
}

function AppCard({ app, onUpdated }: AppCardProps) {
  const [expanded,  setExpanded]  = useState(false);
  const [notes,     setNotes]     = useState(app.vcNotes ?? '');
  const [saving,    setSaving]    = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const label = STATUS_LABELS[app.status as ApplicationStatus] ?? app.status;
  const color = STATUS_COLORS[app.status as ApplicationStatus] ?? '';

  // ── Debounced auto-save notes ──────────────────────────────────────────────
  useEffect(() => {
    if (notes === (app.vcNotes ?? '')) return; // no change
    setSaveState('saving');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const updated = await updateApplicationStatus(app.id, {
          status: app.status as ApplicationStatus,
          vcNotes: notes,
        });
        onUpdated(updated);
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } catch {
        setSaveState('idle');
        toast.error('Failed to save notes');
      }
    }, 1500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [notes]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = useCallback(async (newStatus: ApplicationStatus) => {
    if (!canTransitionTo(app.status as ApplicationStatus, newStatus)) {
      toast.error(`Cannot move to "${STATUS_LABELS[newStatus]}" from "${STATUS_LABELS[app.status as ApplicationStatus]}"`);
      return;
    }
    setSaving(true);
    try {
      const updated = await updateApplicationStatus(app.id, { status: newStatus, vcNotes: notes });
      onUpdated(updated);
      toast.success(`Status updated to "${STATUS_LABELS[newStatus]}"`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Update failed';
      toast.error('Update failed', { description: msg });
    } finally {
      setSaving(false);
    }
  }, [app.id, app.status, notes, onUpdated]);

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
            {app.id.slice(0, 8)}… · {new Date(app.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
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
            <div className="px-4 pb-5 space-y-4 border-t border-border/50 pt-4">

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {app.founderId && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Founder ID</p>
                    <p className="font-mono text-xs truncate">{app.founderId}</p>
                  </div>
                )}
                {app.reviewedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Last Reviewed</p>
                    <p className="text-xs">
                      {new Date(app.reviewedAt).toLocaleDateString('en-US', { dateStyle: 'long' })}
                    </p>
                  </div>
                )}
              </div>

              {/* Notes with auto-save */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Reviewer Notes
                  </label>
                  <AnimatePresence mode="wait">
                    {saveState === 'saving' && (
                      <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />Saving…
                      </motion.span>
                    )}
                    {saveState === 'saved' && (
                      <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="h-3 w-3" />Saved
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add notes for this application…"
                  rows={3}
                  className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Action buttons — only show valid transitions */}
              <div className="flex flex-wrap items-center gap-2">
                {(['under_review', 'interested', 'funded', 'rejected'] as ApplicationStatus[]).map(next => {
                  if (!canTransitionTo(app.status as ApplicationStatus, next)) return null;
                  const btnStyles: Record<string, string> = {
                    under_review: 'text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/20',
                    interested:   'bg-green-600 hover:bg-green-700 text-white border-transparent',
                    funded:       'bg-purple-600 hover:bg-purple-700 text-white border-transparent',
                    rejected:     'text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20',
                  };
                  const isSolid = next === 'interested' || next === 'funded';
                  return (
                    <Button key={next} size="sm"
                      variant={isSolid ? 'default' : 'outline'}
                      disabled={saving}
                      onClick={() => handleAction(next)}
                      className={`rounded-lg ${btnStyles[next]}`}>
                      {saving
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        : null}
                      {STATUS_LABELS[next]}
                    </Button>
                  );
                })}
                {/* Manual save notes button (fallback if debounce hasn't fired) */}
                <Button size="sm" variant="outline" disabled={saving || notes === (app.vcNotes ?? '') || saveState === 'saving'}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      const updated = await updateApplicationStatus(app.id, {
                        status: app.status as ApplicationStatus, vcNotes: notes,
                      });
                      onUpdated(updated);
                      toast.success('Notes saved');
                    } catch { toast.error('Failed to save notes'); }
                    finally { setSaving(false); }
                  }}
                  className="rounded-lg ml-auto">
                  <Send className="h-3.5 w-3.5 mr-1" />Save Notes
                </Button>
              </div>

              {/* Audit history */}
              {app.history && app.history.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                    Status History
                  </p>
                  <div className="space-y-1.5">
                    {app.history.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="shrink-0">
                          {new Date(h.changedAt).toLocaleDateString('en-US', { dateStyle: 'short' })}
                        </span>
                        <span className="text-border">·</span>
                        {h.oldStatus && (
                          <><span className="capitalize">{h.oldStatus.replace('_', ' ')}</span>
                          <span>→</span></>
                        )}
                        <span className="font-medium text-foreground capitalize">
                          {h.newStatus.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────────

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

// ── Main page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function VCPipelinePage() {
  const navigate            = useNavigate();
  const { profile, isVC, isAdmin } = useUser();
  const [paged,        setPaged]        = useState<PagedResponse<VcApplicationResponse> | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [quickFilter,  setQuickFilter]  = useState<number | null>(null);
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(0);

  // ── Access guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (profile && !isVC && !isAdmin) {
      toast.error('Access denied', { description: 'This page is for VCs and admins only.' });
      navigate('/dashboard', { replace: true });
    }
  }, [profile, isVC, isAdmin, navigate]);

  const load = useCallback(async (p: number, sf: string | undefined) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllApplications({ page: p, size: PAGE_SIZE, status: sf });
      setPaged(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load applications';
      setError(msg);
      toast.error('Failed to load applications', { description: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(0);
    load(0, statusFilter);
  }, [statusFilter, load]);

  const handlePage = (p: number) => {
    setPage(p);
    load(p, statusFilter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdated = useCallback((updated: VcApplicationResponse) => {
    setPaged(prev => prev
      ? { ...prev, items: prev.items.map(a => a.id === updated.id ? { ...a, ...updated } : a) }
      : prev
    );
  }, []);

  // Client-side filtering (quick filter + search, applied to current page)
  const allItems = paged?.items ?? [];
  const visible = allItems
    .filter(a => quickFilter === null || QUICK_FILTERS[quickFilter].filterFn(a))
    .filter(a => !search || (a.ideaTitle ?? '').toLowerCase().includes(search.toLowerCase()));

  const counts = {
    total:        paged?.totalCount ?? 0,
    submitted:    allItems.filter(a => a.status === 'submitted').length,
    under_review: allItems.filter(a => a.status === 'under_review').length,
    interested:   allItems.filter(a => a.status === 'interested').length,
  };

  return (
    <div className="bg-background">
      {/* Header */}
      <section className="border-b border-border bg-gradient-to-br from-[#C9A7EB]/20 via-background to-background py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold mb-1">Funding Pipeline</h1>
            <p className="text-muted-foreground text-sm">Review and act on founder funding applications</p>
          </motion.div>
        </div>
      </section>

      <section className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Error banner */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="flex-1 text-sm text-red-700 dark:text-red-300">{error}</p>
              <Button size="sm" variant="outline" onClick={() => load(page, statusFilter)}
                className="border-red-600 text-red-600 hover:bg-red-50 rounded-lg">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Retry
              </Button>
            </motion.div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PIPELINE_CARDS.map((card, i) => (
              <motion.div key={card.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}>
                <Card className="glass-surface border-border/50 hover:shadow-lavender transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                        <card.icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {loading ? '–' : counts[card.key as keyof typeof counts]}
                        </p>
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Filters bar */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }} className="space-y-3">
            {/* Status filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
              {STATUS_FILTERS.map(f => (
                <button key={f.label} type="button"
                  onClick={() => { setStatusFilter(f.value); setQuickFilter(null); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    statusFilter === f.value && quickFilter === null
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Quick filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">Quick:</span>
              {QUICK_FILTERS.map((qf, i) => (
                <button key={qf.label} type="button"
                  onClick={() => setQuickFilter(quickFilter === i ? null : i)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                    quickFilter === i
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  }`}>
                  <qf.icon className="h-3 w-3" />
                  {qf.label}
                </button>
              ))}
              {/* Search */}
              <div className="relative sm:ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by idea title…"
                  className="pl-9 h-9 rounded-xl w-full sm:w-64 text-sm" />
              </div>
            </div>
          </motion.div>

          {/* Application list */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="glass-surface border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Applications
                    {!loading && (
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        ({visible.length}{quickFilter !== null || search ? ` of ${allItems.length}` : ''})
                      </span>
                    )}
                  </CardTitle>
                  {(search || quickFilter !== null) && (
                    <Button size="sm" variant="ghost" className="text-xs rounded-lg"
                      onClick={() => { setSearch(''); setQuickFilter(null); }}>
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />Reset filters
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <PipelineSkeleton />
                ) : visible.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <div className="h-14 w-14 rounded-full bg-muted/60 flex items-center justify-center">
                      <Users className="h-7 w-7 text-muted-foreground opacity-60" />
                    </div>
                    <p className="font-semibold">No applications found</p>
                    <p className="text-sm text-muted-foreground">
                      {search || quickFilter !== null
                        ? 'No results match your current filters.'
                        : 'No applications match the selected status.'}
                    </p>
                    {(search || quickFilter !== null) && (
                      <Button size="sm" variant="outline" className="rounded-lg mt-1"
                        onClick={() => { setSearch(''); setQuickFilter(null); }}>
                        Reset filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {visible.map(app => (
                        <motion.div key={app.id} layout
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                          <AppCard app={app} onUpdated={handleUpdated} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {paged && !search && quickFilter === null && (
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
