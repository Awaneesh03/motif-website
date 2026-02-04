import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Building2,
  User,
  TrendingUp,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { getAllStartups, updateStartupStatus, type Startup, type StartupStatus } from '@/lib/startupService';
import { notifyStartupApproved, notifyStartupRejected } from '@/lib/notificationService';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const AdminStartups = () => {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<StartupStatus | 'all'>('all');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: 'approve' | 'reject' | null;
    startupId: string | null;
    startupName: string;
  }>({
    isOpen: false,
    action: null,
    startupId: null,
    startupName: '',
  });

  // Load startups from service
  useEffect(() => {
    loadStartups();
  }, []);

  const loadStartups = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allStartups = await getAllStartups();
      setStartups(allStartups);
    } catch (err) {
      console.error('Error loading startups:', err);
      setError('Failed to load startups. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  // Async action for approving startups
  const { loading: approveLoading, execute: executeApprove } = useAsyncAction(
    async (startupId: string, createdBy: string, startupName: string) => {
      await updateStartupStatus(startupId, 'approved_for_vc');
      await notifyStartupApproved(createdBy, startupId, startupName);
      await loadStartups();
    },
    {
      successMessage: 'Startup approved successfully',
      errorMessage: 'Failed to approve startup',
      onSuccess: () => setConfirmDialog({ isOpen: false, action: null, startupId: null, startupName: '' })
    }
  );

  // Async action for rejecting startups
  const { loading: rejectLoading, execute: executeReject } = useAsyncAction(
    async (startupId: string, createdBy: string, startupName: string) => {
      await updateStartupStatus(startupId, 'rejected');
      await notifyStartupRejected(createdBy, startupId, startupName);
      await loadStartups();
    },
    {
      successMessage: 'Startup rejected',
      errorMessage: 'Failed to reject startup',
      onSuccess: () => setConfirmDialog({ isOpen: false, action: null, startupId: null, startupName: '' })
    }
  );

  const handleApprove = (id: string) => {
    const startup = startups.find((s) => s.id === id);
    if (!startup) return;

    setConfirmDialog({
      isOpen: true,
      action: 'approve',
      startupId: id,
      startupName: startup.name,
    });
  };

  const handleReject = (id: string) => {
    const startup = startups.find((s) => s.id === id);
    if (!startup) return;

    setConfirmDialog({
      isOpen: true,
      action: 'reject',
      startupId: id,
      startupName: startup.name,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.startupId || !confirmDialog.action) return;

    const startup = startups.find((s) => s.id === confirmDialog.startupId);
    if (!startup) return;

    if (confirmDialog.action === 'approve') {
      await executeApprove(confirmDialog.startupId, startup.createdBy, startup.name);
    } else {
      await executeReject(confirmDialog.startupId, startup.createdBy, startup.name);
    }
  };

  const getStatusBadge = (status: StartupStatus) => {
    const config = {
      draft: {
        label: 'Draft',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-0',
        icon: Clock,
      },
      pending_review: {
        label: 'Under Review',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0',
        icon: Clock,
      },
      approved_for_vc: {
        label: 'Approved',
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0',
        icon: CheckCircle2,
      },
      rejected: {
        label: 'Rejected',
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-0',
        icon: XCircle,
      },
      active: {
        label: 'Active',
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-0',
        icon: CheckCircle2,
      },
    };

    const statusConfig = config[status] || {
      label: status || 'Unknown',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-0',
      icon: Clock,
    };

    const { label, className, icon: Icon } = statusConfig;

    return (
      <Badge className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  // Filter startups
  const filteredStartups = filterStatus === 'all'
    ? startups
    : startups.filter(s => s.status === filterStatus);

  // Calculate counts
  const pendingCount = startups.filter(s => s.status === 'pending_review').length;
  const approvedCount = startups.filter(s => s.status === 'approved_for_vc').length;
  const rejectedCount = startups.filter(s => s.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-border bg-background py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold mb-1">Startup Approvals</h1>
              <p className="text-muted-foreground text-xs">
                Review and approve startup submissions for VC visibility
              </p>
            </div>
            <Button
              onClick={loadStartups}
              variant="outline"
              size="sm"
              className="rounded-lg"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-4">
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
                    Error Loading Startups
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadStartups}
                  className="rounded-lg border-red-600 text-red-600 hover:bg-red-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </motion.div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 mb-6">
            <Card className="glass-surface border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total</p>
                    <p className="text-2xl font-bold">{startups.length}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-surface border-border/50 bg-blue-50/50 dark:bg-blue-900/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Pending</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{pendingCount}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-surface border-border/50 bg-green-50/50 dark:bg-green-900/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-1">Approved</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{approvedCount}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-surface border-border/50 bg-red-50/50 dark:bg-red-900/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-1">Rejected</p>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">{rejectedCount}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Tabs */}
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-2">
              {(['all', 'pending_review', 'approved_for_vc', 'rejected'] as const).map((status) => (
                <Button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-lg"
                >
                  {status === 'all' && 'All'}
                  {status === 'pending_review' && 'Pending'}
                  {status === 'approved_for_vc' && 'Approved'}
                  {status === 'rejected' && 'Rejected'}
                </Button>
              ))}
            </div>
          </div>

          {/* Startups Table */}
          <Card className="glass-surface border-border/50">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                  <p>Loading startups...</p>
                </div>
              ) : filteredStartups.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-semibold mb-2">No startups found</p>
                  <p className="text-sm">
                    {filterStatus === 'all'
                      ? 'No startups have been submitted yet'
                      : `No ${filterStatus.replace('_', ' ')} startups`}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Startup
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Founder
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Stage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredStartups.map((startup, index) => (
                        <motion.tr
                          key={startup.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold truncate">
                                  {startup.name}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {startup.pitch || 'No pitch provided'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{startup.founderName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{startup.stage}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(startup.status)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleApprove(startup.id)}
                                disabled={startup.status === 'approved_for_vc' || approveLoading || rejectLoading}
                                size="sm"
                                className="rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleReject(startup.id)}
                                disabled={startup.status === 'rejected' || approveLoading || rejectLoading}
                                size="sm"
                                variant="destructive"
                                className="rounded-lg disabled:opacity-50"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: null, startupId: null, startupName: '' })}
        onConfirm={handleConfirmAction}
        title={
          confirmDialog.action === 'approve'
            ? 'Approve Startup?'
            : 'Reject Startup?'
        }
        message={
          confirmDialog.action === 'approve'
            ? `Approve "${confirmDialog.startupName}" for VC visibility? The founder will be notified and the startup will appear in the VC deal flow.`
            : `Reject "${confirmDialog.startupName}"? The founder will be notified and asked to make improvements before resubmitting.`
        }
        confirmText={confirmDialog.action === 'approve' ? 'Approve' : 'Reject'}
        variant={confirmDialog.action === 'approve' ? 'success' : 'danger'}
        isLoading={approveLoading || rejectLoading}
      />
    </div>
  );
};

export default AdminStartups;
