import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  SlidersHorizontal,
  MessageSquare,
  Send,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  getAllApplications,
  updateApplicationStatus,
  type VcApplicationResponse,
  type ApplicationStatus,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/lib/vcApplicationService';

// ── Filter options ─────────────────────────────────────────────────────────────

const STATUS_FILTERS: { label: string; value: string | undefined }[] = [
  { label: 'All',          value: undefined },
  { label: 'Submitted',    value: 'submitted' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Interested',   value: 'interested' },
  { label: 'Rejected',     value: 'rejected' },
];

// ── Pipeline summary cards ─────────────────────────────────────────────────────

const PIPELINE_CARDS = [
  { label: 'Total',        key: 'total',        icon: Users,       color: 'text-primary',    bg: 'bg-primary/10' },
  { label: 'Submitted',    key: 'submitted',    icon: FileText,    color: 'text-blue-600',   bg: 'bg-blue-600/10' },
  { label: 'Under Review', key: 'under_review', icon: Clock,       color: 'text-amber-600',  bg: 'bg-amber-600/10' },
  { label: 'Interested',   key: 'interested',   icon: CheckCircle2,color: 'text-green-600',  bg: 'bg-green-600/10' },
];

// ── Single application card ────────────────────────────────────────────────────

interface AppCardProps {
  app: VcApplicationResponse;
  onUpdated: (updated: VcApplicationResponse) => void;
}

function AppCard({ app, onUpdated }: AppCardProps) {
  const [expanded,   setExpanded]   = useState(false);
  const [notes,      setNotes]      = useState(app.vcNotes ?? '');
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState<string | null>(null);

  const label = STATUS_LABELS[app.status as ApplicationStatus] ?? app.status;
  const color = STATUS_COLORS[app.status as ApplicationStatus] ?? '';

  const handleAction = useCallback(async (newStatus: ApplicationStatus) => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateApplicationStatus(app.id, { status: newStatus, vcNotes: notes });
      onUpdated(updated);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }, [app.id, notes, onUpdated]);

  const handleSaveNotes = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateApplicationStatus(app.id, { status: app.status as ApplicationStatus, vcNotes: notes });
      onUpdated(updated);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save notes');
    } finally {
      setSaving(false);
    }
  }, [app.id, app.status, notes, onUpdated]);

  return (
    <motion.div
      layout
      className="rounded-xl border border-border/50 bg-muted/20 overflow-hidden"
    >
      {/* Card header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {app.ideaTitle || 'Funding Application'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            ID: {app.id.slice(0, 8)}…
            {' · '}
            {new Date(app.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
          </p>
        </div>
        <Badge className={`text-xs border-0 shrink-0 ${color}`}>{label}</Badge>
        {expanded
          ? <ChevronUp   className="h-4 w-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>

      {/* Expanded detail */}
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

              {/* Notes area */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Reviewer Notes
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add notes for this application…"
                  rows={3}
                  className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {saveError && (
                <p className="text-xs text-red-500">{saveError}</p>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status transition actions */}
                {app.status !== 'under_review' && app.status !== 'interested' && app.status !== 'rejected' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={saving}
                    onClick={() => handleAction('under_review')}
                    className="rounded-lg text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/20"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Clock className="h-3.5 w-3.5 mr-1" />}
                    Mark Under Review
                  </Button>
                )}

                {app.status !== 'interested' && app.status !== 'rejected' && (
                  <Button
                    size="sm"
                    disabled={saving}
                    onClick={() => handleAction('interested')}
                    className="rounded-lg bg-green-600 hover:bg-green-700 text-white"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                    Interested
                  </Button>
                )}

                {app.status !== 'rejected' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={saving}
                    onClick={() => handleAction('rejected')}
                    className="rounded-lg text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                    Reject
                  </Button>
                )}

                {/* Save notes independently */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={saving || notes === (app.vcNotes ?? '')}
                  onClick={handleSaveNotes}
                  className="rounded-lg ml-auto"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                  Save Notes
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VCPipelinePage() {
  const [apps,          setApps]          = useState<VcApplicationResponse[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [statusFilter,  setStatusFilter]  = useState<string | undefined>(undefined);
  const [search,        setSearch]        = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllApplications(statusFilter);
      setApps(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleUpdated = useCallback((updated: VcApplicationResponse) => {
    setApps(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
  }, []);

  // Client-side search on idea title
  const visible = apps.filter(a =>
    !search || (a.ideaTitle ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // Summary counts (always from the full unfiltered list)
  const counts = {
    total:        apps.length,
    submitted:    apps.filter(a => a.status === 'submitted').length,
    under_review: apps.filter(a => a.status === 'under_review').length,
    interested:   apps.filter(a => a.status === 'interested').length,
  };

  return (
    <div className="bg-background">
      {/* Header */}
      <section className="border-b border-border bg-gradient-to-br from-[#C9A7EB]/20 via-background to-background py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold mb-1">Funding Pipeline</h1>
            <p className="text-muted-foreground text-sm">
              Review and act on founder funding applications
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Error banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4"
            >
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="flex-1 text-sm text-red-700 dark:text-red-300">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={load}
                className="border-red-600 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Retry
              </Button>
            </motion.div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PIPELINE_CARDS.map((card, i) => (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
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

          {/* Filters + search */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            {/* Status filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    statusFilter === f.value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative sm:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by idea title…"
                className="pl-9 h-9 rounded-xl w-full sm:w-64 text-sm"
              />
            </div>
          </motion.div>

          {/* Application list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="glass-surface border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Applications
                  {!loading && (
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      ({visible.length})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm">Loading applications…</p>
                  </div>
                ) : visible.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <div className="h-14 w-14 rounded-full bg-muted/60 flex items-center justify-center">
                      <Users className="h-7 w-7 text-muted-foreground opacity-60" />
                    </div>
                    <p className="font-semibold">No applications found</p>
                    <p className="text-sm text-muted-foreground">
                      {search ? 'Try a different search term.' : 'No applications match the selected filter.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {visible.map(app => (
                        <motion.div
                          key={app.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <AppCard app={app} onUpdated={handleUpdated} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
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
