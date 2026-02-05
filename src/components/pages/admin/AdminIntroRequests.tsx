import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Users,
  Building2,
  RefreshCw,
  Filter,
  Handshake,
} from 'lucide-react';
import {
  getAllIntroRequests,
  updateIntroRequestStatus,
  type IntroRequest,
  type IntroRequestStatus,
} from '@/lib/introRequestService';
import { getIdeaById } from '@/lib/ideasService';
import { notifyVCIntroApproved } from '@/lib/notificationService';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const AdminIntroRequests = () => {
  const [requests, setRequests] = useState<IntroRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<IntroRequestStatus | 'all'>('all');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: 'approve' | 'reject' | null;
    requestId: string | null;
    startupName: string;
  }>({
    isOpen: false,
    action: null,
    requestId: null,
    startupName: '',
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allRequests = await getAllIntroRequests();
      setRequests(allRequests);
    } catch (err) {
      console.error('Error loading intro requests:', err);
      setError('Failed to load introduction requests. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  // Async action for approving intro requests
  const { loading: approveLoading, execute: executeApprove } = useAsyncAction(
    async (requestId: string, request: IntroRequest) => {
      await updateIntroRequestStatus(requestId, 'approved');

      // Fetch startup to get founder ID and send notifications
      if (request.vcId) {
        const startup = await getIdeaById(request.startupId);
        if (startup && startup.created_by) {
          await notifyVCIntroApproved(
            request.vcId,
            startup.created_by,
            request.startupId,
            request.startupName
          );
        }
      }

      await loadRequests();
    },
    {
      successMessage: 'Introduction request approved',
      errorMessage: 'Failed to approve introduction request',
      onSuccess: () => setConfirmDialog({ isOpen: false, action: null, requestId: null, startupName: '' })
    }
  );

  // Async action for rejecting intro requests
  const { loading: rejectLoading, execute: executeReject } = useAsyncAction(
    async (requestId: string) => {
      await updateIntroRequestStatus(requestId, 'rejected');
      await loadRequests();
    },
    {
      successMessage: 'Introduction request rejected',
      errorMessage: 'Failed to reject introduction request',
      onSuccess: () => setConfirmDialog({ isOpen: false, action: null, requestId: null, startupName: '' })
    }
  );

  const handleApprove = (id: string) => {
    const request = requests.find((r) => r.id === id);
    if (!request) return;

    setConfirmDialog({
      isOpen: true,
      action: 'approve',
      requestId: id,
      startupName: request.startupName,
    });
  };

  const handleReject = (id: string) => {
    const request = requests.find((r) => r.id === id);
    if (!request) return;

    setConfirmDialog({
      isOpen: true,
      action: 'reject',
      requestId: id,
      startupName: request.startupName,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.requestId || !confirmDialog.action) return;

    const request = requests.find((r) => r.id === confirmDialog.requestId);
    if (!request) return;

    if (confirmDialog.action === 'approve') {
      await executeApprove(confirmDialog.requestId, request);
    } else {
      await executeReject(confirmDialog.requestId);
    }
  };

  const getStatusBadge = (status: IntroRequestStatus) => {
    const config = {
      requested: {
        label: 'Pending',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0',
        icon: Clock,
      },
      approved: {
        label: 'Approved',
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0',
        icon: CheckCircle2,
      },
      rejected: {
        label: 'Rejected',
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-0',
        icon: XCircle,
      },
    };

    const { label, className, icon: Icon } = config[status];

    return (
      <Badge className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  // Filter requests
  const filteredRequests = filterStatus === 'all'
    ? requests
    : requests.filter(r => r.status === filterStatus);

  // Calculate counts
  const pendingCount = requests.filter(r => r.status === 'requested').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <div>
      {/* Header */}
      <section className="border-b border-border py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold mb-1">Introduction Requests</h1>
              <p className="text-muted-foreground text-xs">
                Review and approve VC-to-founder introduction requests
              </p>
            </div>
            <Button
              onClick={loadRequests}
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
                    Error Loading Requests
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadRequests}
                  className="rounded-lg border-red-600 text-red-600 hover:bg-red-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </motion.div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-6">
            <Card className="glass-surface border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total</p>
                    <p className="text-2xl font-bold">{requests.length}</p>
                  </div>
                  <Handshake className="h-8 w-8 text-muted-foreground opacity-50" />
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
              {(['all', 'requested', 'approved', 'rejected'] as const).map((status) => (
                <Button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-lg"
                >
                  {status === 'all' && 'All'}
                  {status === 'requested' && 'Pending'}
                  {status === 'approved' && 'Approved'}
                  {status === 'rejected' && 'Rejected'}
                </Button>
              ))}
            </div>
          </div>

          {/* Requests Table */}
          <Card className="glass-surface border-border/50">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                  <p>Loading introduction requests...</p>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Handshake className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-semibold mb-2">No requests found</p>
                  <p className="text-sm">
                    {filterStatus === 'all'
                      ? 'No introduction requests have been submitted yet'
                      : `No ${filterStatus} requests`}
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
                          VC / Investor
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
                      {filteredRequests.map((request, index) => (
                        <motion.tr
                          key={request.id}
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
                                  {request.startupName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Startup ID: {request.startupId.slice(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{request.vcName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(request.status)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleApprove(request.id)}
                                disabled={request.status === 'approved' || approveLoading || rejectLoading}
                                size="sm"
                                className="rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleReject(request.id)}
                                disabled={request.status === 'rejected' || approveLoading || rejectLoading}
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
        onClose={() => setConfirmDialog({ isOpen: false, action: null, requestId: null, startupName: '' })}
        onConfirm={handleConfirmAction}
        title={
          confirmDialog.action === 'approve'
            ? 'Approve VC Introduction?'
            : 'Reject VC Introduction?'
        }
        message={
          confirmDialog.action === 'approve'
            ? `Approve the introduction request for "${confirmDialog.startupName}"? Both the VC and founder will be notified and connected.`
            : `Reject the introduction request for "${confirmDialog.startupName}"? This action cannot be undone.`
        }
        confirmText={confirmDialog.action === 'approve' ? 'Approve' : 'Reject'}
        variant={confirmDialog.action === 'approve' ? 'success' : 'danger'}
        isLoading={approveLoading || rejectLoading}
      />
    </div>
  );
};

export default AdminIntroRequests;
