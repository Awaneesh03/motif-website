import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Rocket,
  Calendar,
  TrendingUp,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit,
  Eye,
  RefreshCw,
  Users,
  Handshake,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Timeline, type TimelineEvent } from '../Timeline';
import { getIdeaById, updateIdeaStatus, type Idea } from '@/lib/ideasService';
import { useUser } from '@/contexts/UserContext';
import {
  getIntroRequestsByStartup,
  createFounderIntroRequest,
  hasFounderRequestedIntro,
  getConnectedVCs,
  type IntroRequest,
  type ConnectedVC,
} from '@/lib/introRequestService';
import { notifyStartupSubmitted } from '@/lib/notificationService';
import { useAsyncAction } from '@/hooks/useAsyncAction';

export function StartupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useUser();
  const [startup, setStartup] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [vcIntroRequests, setVcIntroRequests] = useState<IntroRequest[]>([]);
  const [hasRequested, setHasRequested] = useState(false);
  const [loadingIntros, setLoadingIntros] = useState(false);
  const [connectedVCs, setConnectedVCs] = useState<ConnectedVC[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);

  useEffect(() => {
    const fetchStartup = async () => {
      if (id) {
        setLoading(true);
        const data = await getIdeaById(id);
        setStartup(data);
        setLoading(false);

        // If approved, fetch VC intro requests and connections
        if (data?.status === 'approved_for_vc') {
          setLoadingIntros(true);
          setLoadingConnections(true);

          const intros = await getIntroRequestsByStartup(id);
          setVcIntroRequests(intros);

          const requested = await hasFounderRequestedIntro(id);
          setHasRequested(requested);

          const connections = await getConnectedVCs(id);
          setConnectedVCs(connections);

          setLoadingIntros(false);
          setLoadingConnections(false);
        }
      }
    };
    fetchStartup();
  }, [id]);

  // Async action for submitting startup for review
  const { loading: submitLoading, execute: handleSubmitForReview } = useAsyncAction(
    async () => {
      if (!startup || !id || !profile?.id) {
        throw new Error('Missing required data');
      }

      const updatedIdea = await updateIdeaStatus(id, 'pending_review');
      if (!updatedIdea) {
        throw new Error('Failed to submit startup');
      }

      setStartup(updatedIdea);

      // Send notification
      await notifyStartupSubmitted(
        profile.id,
        id,
        startup.title || startup.name || 'Untitled'
      );
    },
    {
      successMessage: 'Startup submitted for admin review!',
      errorMessage: 'Failed to submit startup',
    }
  );

  // Async action for resubmitting startup for review
  const { loading: resubmitLoading, execute: handleResubmit } = useAsyncAction(
    async () => {
      if (!startup || !id || !profile?.id) {
        throw new Error('Missing required data');
      }

      const updatedIdea = await updateIdeaStatus(id, 'pending_review');
      if (!updatedIdea) {
        throw new Error('Failed to resubmit startup');
      }

      setStartup(updatedIdea);

      // Send notification
      await notifyStartupSubmitted(
        profile.id,
        id,
        startup.title || startup.name || 'Untitled'
      );
    },
    {
      successMessage: 'Startup resubmitted for review!',
      errorMessage: 'Failed to resubmit startup',
    }
  );

  // Helper function to get status information
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'draft':
        return {
          text: 'Draft (Not submitted)',
          description:
            'Your startup is in draft mode. Complete your pitch and submit it for admin review to get visibility with VCs.',
          icon: Edit,
          iconClass: 'text-gray-600',
          bgClass: 'bg-gray-50 dark:bg-gray-900/20',
          badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        };
      case 'pending_review':
        return {
          text: 'Under review by admin',
          description:
            'Your startup submission is currently being reviewed by our team. You will be notified once the review is complete.',
          icon: Clock,
          iconClass: 'text-blue-600',
          bgClass: 'bg-blue-50 dark:bg-blue-900/20',
          badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        };
      case 'approved_for_vc':
        return {
          text: 'Approved – visible to VCs',
          description:
            'Congratulations! Your startup has been approved and is now visible to VCs on the platform. Investors can now discover and connect with you.',
          icon: CheckCircle2,
          iconClass: 'text-green-600',
          bgClass: 'bg-green-50 dark:bg-green-900/20',
          badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        };
      case 'rejected':
        return {
          text: 'Rejected – changes required',
          description:
            'Your startup submission needs improvements. Please review the feedback below, make the necessary changes, and resubmit.',
          icon: AlertCircle,
          iconClass: 'text-red-600',
          bgClass: 'bg-red-50 dark:bg-red-900/20',
          badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        };
      case 'active':
        return {
          text: 'Active',
          description: 'Your startup is active and live on the platform.',
          icon: CheckCircle2,
          iconClass: 'text-emerald-600',
          bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
        };
      default:
        return {
          text: 'Unknown status',
          description: 'Status information not available.',
          icon: AlertCircle,
          iconClass: 'text-gray-600',
          bgClass: 'bg-gray-50 dark:bg-gray-900/20',
          badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        };
    }
  };

  // Async action for requesting VC introduction
  const { loading: requestIntroLoading, execute: handleRequestVCIntro } = useAsyncAction(
    async () => {
      if (!startup || !id) {
        throw new Error('Missing required data');
      }

      const result = await createFounderIntroRequest(id);
      if (!result) {
        throw new Error('Failed to create intro request');
      }

      setHasRequested(true);
      setVcIntroRequests([result, ...vcIntroRequests]);
    },
    {
      successMessage: 'VC intro request created!',
      errorMessage: 'Failed to create intro request',
    }
  );

  // Helper function to generate timeline events
  const getTimelineEvents = (): TimelineEvent[] => {
    if (!startup) return [];

    const events: TimelineEvent[] = [];

    // Pitch created
    events.push({
      title: 'Pitch Created',
      description: 'Your startup pitch was created',
      date: new Date(startup.created_at).toLocaleDateString(),
      status: 'completed',
    });

    // Submitted for review
    if (
      startup.status === 'pending_review' ||
      startup.status === 'approved_for_vc' ||
      startup.status === 'rejected' ||
      startup.status === 'active'
    ) {
      events.push({
        title: 'Submitted for Review',
        description: 'Submitted to Motif admin for approval',
        date: startup.updated_at
          ? new Date(startup.updated_at).toLocaleDateString()
          : undefined,
        status: 'completed',
      });
    } else if (startup.status === 'draft') {
      events.push({
        title: 'Submit for Review',
        description: 'Not yet submitted',
        status: 'pending',
      });
    }

    // Approved for VCs
    if (startup.status === 'approved_for_vc' || startup.status === 'active') {
      events.push({
        title: 'Approved for VCs',
        description: 'Visible to investors on the platform',
        date: startup.updated_at
          ? new Date(startup.updated_at).toLocaleDateString()
          : undefined,
        status: 'completed',
      });
    } else if (startup.status === 'rejected') {
      events.push({
        title: 'Changes Requested',
        description: 'Admin requested improvements',
        date: startup.updated_at
          ? new Date(startup.updated_at).toLocaleDateString()
          : undefined,
        status: 'completed',
      });
    } else if (startup.status === 'pending_review') {
      events.push({
        title: 'Under Review',
        description: 'Being reviewed by admin',
        status: 'current',
      });
    } else {
      events.push({
        title: 'Approval Pending',
        description: 'Awaiting admin approval',
        status: 'pending',
      });
    }

    // VC Connected
    if (connectedVCs.length > 0) {
      events.push({
        title: `Connected with ${connectedVCs.length} VC${connectedVCs.length > 1 ? 's' : ''}`,
        description: 'Active investor connections',
        date: connectedVCs[0]?.connectedAt
          ? new Date(connectedVCs[0].connectedAt).toLocaleDateString()
          : undefined,
        status: 'completed',
      });
    } else if (startup.status === 'approved_for_vc' || startup.status === 'active') {
      events.push({
        title: 'Awaiting VC Connections',
        description: 'VCs can now request introductions',
        status: 'current',
      });
    }

    return events;
  };

  const statusInfo = getStatusInfo(startup?.status || 'draft');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading startup details...</p>
        </div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Rocket className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h1 className="text-2xl font-bold mb-2">Startup Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The startup you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate('/dashboard')} className="gradient-lavender">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="via-background to-background border-border relative overflow-hidden border-b bg-gradient-to-br from-[#C9A7EB]/20 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {startup.title || startup.name || 'Untitled Startup'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  Created {new Date(startup.created_at).toLocaleDateString()}
                </p>
              </div>
              <Rocket className="h-12 w-12 text-primary opacity-50" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Status Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <Card className={`glass-surface border-border/50 ${statusInfo.bgClass}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`h-12 w-12 rounded-xl ${statusInfo.bgClass} flex items-center justify-center flex-shrink-0`}
                      >
                        <statusInfo.icon className={`h-6 w-6 ${statusInfo.iconClass}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">Current Status</h3>
                          <Badge className={`${statusInfo.badgeClass} border-0`}>
                            {statusInfo.text}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* About This Startup */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="glass-surface border-border/50">
                  <CardHeader>
                    <CardTitle>About This Startup</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {startup.description && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Description</p>
                          <p className="text-foreground">{startup.description}</p>
                        </div>
                      )}
                      {startup.target_market && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Target Market</p>
                          <p className="text-foreground">{startup.target_market}</p>
                        </div>
                      )}
                      {!startup.description && !startup.target_market && (
                        <p className="text-muted-foreground">
                          Detailed information about your startup will be displayed here.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Startup Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="glass-surface border-border/50">
                  <CardHeader>
                    <CardTitle>Startup Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Stage</p>
                        <p className="font-medium capitalize">{startup.stage || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Created</p>
                        <p className="font-medium">
                          {new Date(startup.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                        <p className="font-medium">
                          {new Date(startup.updated_at || startup.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Startup ID</p>
                        <p className="font-mono text-xs">{startup.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Progress Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.23 }}
              >
                <Card className="glass-surface border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Progress Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Timeline events={getTimelineEvents()} />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Connected VCs - Only show if there are approved connections */}
              {startup.status === 'approved_for_vc' && connectedVCs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Card className="glass-surface border-border/50 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-800/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Connected VCs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingConnections ? (
                        <div className="text-center py-6">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                          <p className="text-sm text-muted-foreground">Loading connections...</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                            You are connected with {connectedVCs.length} VC{connectedVCs.length !== 1 ? 's' : ''}.
                            These investors can now access your full startup details.
                          </p>
                          <div className="space-y-2">
                            {connectedVCs.map((vc, index) => (
                              <motion.div
                                key={vc.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + index * 0.05 }}
                                className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-green-200 dark:border-green-700"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                                      <Users className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium truncate">{vc.vcName}</p>
                                        <Badge
                                          variant="secondary"
                                          className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0 flex-shrink-0"
                                        >
                                          Verified VC
                                        </Badge>
                                      </div>
                                      {(vc.vcFirm || vc.vcRole) && (
                                        <p className="text-sm text-muted-foreground truncate">
                                          {vc.vcRole && vc.vcFirm
                                            ? `${vc.vcRole} at ${vc.vcFirm}`
                                            : vc.vcRole || vc.vcFirm}
                                        </p>
                                      )}
                                      <p className="text-xs text-muted-foreground">
                                        Connected {new Date(vc.connectedAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0 whitespace-nowrap">
                                    Connected
                                  </Badge>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* VC Interest & Connections - Only for Approved Startups */}
              {startup.status === 'approved_for_vc' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Card className="glass-surface border-border/50 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-800/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Handshake className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        VC Interest & Connections
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingIntros ? (
                        <div className="text-center py-6">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                          <p className="text-sm text-muted-foreground">Loading connections...</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Info Box - Communication Guidance */}
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                            <div className="flex items-start gap-3">
                              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1 text-sm">
                                  About VC Connections
                                </h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                  Once connected, VCs may reach out to you externally via email or LinkedIn.
                                  Motif facilitates introductions but does not provide in-platform messaging.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Request VC Introduction Button - Hide if already connected */}
                          {!hasRequested && connectedVCs.length === 0 && (
                            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
                              <h4 className="font-semibold mb-2 text-purple-900 dark:text-purple-100">
                                Connect with VCs
                              </h4>
                              <p className="text-sm text-muted-foreground mb-4">
                                Request an introduction to VCs on our platform. We'll help connect you
                                with investors interested in your startup.
                              </p>
                              <Button
                                onClick={handleRequestVCIntro}
                                disabled={requestIntroLoading}
                                className="w-full gradient-lavender shadow-lavender rounded-xl"
                              >
                                {requestIntroLoading ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Requesting...
                                  </>
                                ) : (
                                  <>
                                    <Users className="mr-2 h-4 w-4" />
                                    Request VC Introduction
                                  </>
                                )}
                              </Button>
                            </div>
                          )}

                          {/* Show message if already connected */}
                          {connectedVCs.length > 0 && (
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700">
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                                <div>
                                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                                    Connected to VCs
                                  </h4>
                                  <p className="text-sm text-green-700 dark:text-green-300">
                                    You have {connectedVCs.length} active VC connection{connectedVCs.length !== 1 ? 's' : ''}.
                                    Check the "Connected VCs" section above for details.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Success Message after Requesting */}
                          {hasRequested && vcIntroRequests.length === 0 && (
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700">
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                                <div>
                                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                                    Request Submitted!
                                  </h4>
                                  <p className="text-sm text-green-700 dark:text-green-300">
                                    Your VC intro request is active. We'll notify you when VCs express
                                    interest.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* List of Existing VC Intro Requests */}
                          {vcIntroRequests.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                                Active Intro Requests ({vcIntroRequests.length})
                              </h4>
                              <div className="space-y-2">
                                {vcIntroRequests.map((request, index) => (
                                  <motion.div
                                    key={request.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.05 }}
                                    className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-border/50 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                                          <Users className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm truncate">
                                            {request.vcName}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {new Date(request.createdAt).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                      <Badge
                                        className={`capitalize whitespace-nowrap ${
                                          request.status === 'approved'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : request.status === 'rejected'
                                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                        } border-0`}
                                      >
                                        {request.status}
                                      </Badge>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Empty State - No requests and not requested yet */}
                          {!hasRequested && vcIntroRequests.length === 0 && (
                            <div className="text-center py-4">
                              <Users className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-50" />
                              <p className="text-sm text-muted-foreground">
                                No VC connections yet. Request an introduction to get started!
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Sidebar - Conditional Actions Based on Status */}
            <div className="md:col-span-1 space-y-6">
              {/* DRAFT - Submit for Review */}
              {profile?.role === 'founder' && startup.status === 'draft' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <Card className="glass-surface border-border/50 bg-gradient-to-br from-[#C9A7EB]/10 to-[#B084E8]/10">
                    <CardContent className="p-6">
                      <h4 className="font-semibold mb-2">Ready to Get Funded?</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Submit your startup for admin review and get connected to VCs
                      </p>
                      <Button
                        onClick={handleSubmitForReview}
                        disabled={submitLoading}
                        className="w-full gradient-lavender shadow-lavender rounded-xl"
                      >
                        {submitLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit for Review
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* PENDING_REVIEW - Waiting Status */}
              {startup.status === 'pending_review' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <Card className="glass-surface border-border/50 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        <div>
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                            Under Review
                          </h4>
                        </div>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Your startup is currently being reviewed by the admin team. You'll be
                        notified once the review is complete.
                      </p>
                      <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          No actions available while under review
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* APPROVED_FOR_VC - Visible to VCs */}
              {startup.status === 'approved_for_vc' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <Card className="glass-surface border-border/50 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                        <div>
                          <h4 className="font-semibold text-green-900 dark:text-green-100">
                            Live & Visible
                          </h4>
                        </div>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                        Congratulations! Your startup is approved and visible to VCs on the
                        platform. Keep an eye on intro requests from investors.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full rounded-xl border-green-600 dark:border-green-400"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details Above
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* REJECTED - Edit and Resubmit */}
              {startup.status === 'rejected' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <Card className="glass-surface border-border/50 bg-gradient-to-br from-red-50 to-orange-100 dark:from-red-900/20 dark:to-orange-800/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                        <div>
                          <h4 className="font-semibold text-red-900 dark:text-red-100">
                            Changes Required
                          </h4>
                        </div>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                        Your submission needs improvements. Follow these steps to get approved:
                      </p>
                      <div className="bg-white dark:bg-red-950/30 rounded-lg p-3 mb-4">
                        <ol className="text-sm text-red-700 dark:text-red-300 space-y-1.5 list-decimal list-inside">
                          <li>Review admin feedback carefully</li>
                          <li>Edit your pitch with improvements</li>
                          <li>Resubmit for review</li>
                          <li>Get approved and connect with VCs</li>
                        </ol>
                      </div>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full rounded-xl border-red-600 dark:border-red-400"
                          onClick={() => navigate('/pitch-creator')}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Pitch
                        </Button>
                        <Button
                          onClick={handleResubmit}
                          disabled={resubmitLoading}
                          className="w-full gradient-lavender shadow-lavender rounded-xl"
                        >
                          {resubmitLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Resubmitting...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Resubmit for Review
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* ACTIVE - Read-only */}
              {startup.status === 'active' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <Card className="glass-surface border-border/50 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-800/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">
                            Active Startup
                          </h4>
                        </div>
                      </div>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                        Your startup is active and live on the platform.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="glass-surface border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Created</p>
                        <p className="text-sm font-medium">
                          {new Date(startup.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Stage</p>
                        <p className="text-sm font-medium capitalize">{startup.stage || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Help Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="glass-surface border-border/50 bg-gradient-to-br from-[#C9A7EB]/10 to-[#B084E8]/10">
                  <CardContent className="p-6 text-center">
                    <Rocket className="mx-auto mb-3 h-10 w-10 text-primary" />
                    <h4 className="mb-2 font-semibold">Need Help?</h4>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Get AI-powered insights and feedback on your startup
                    </p>
                    <Button
                      variant="outline"
                      className="w-full rounded-xl"
                      onClick={() => navigate('/idea-analyser')}
                    >
                      Analyze Idea
                    </Button>
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
