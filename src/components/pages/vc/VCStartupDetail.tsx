import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Rocket,
  Building2,
  TrendingUp,
  Target,
  Lightbulb,
  User,
  FileText,
  Handshake,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { getIdeaById, type Idea } from '@/lib/ideasService';
import { createIntroRequest, hasIntroRequest, isConnected } from '@/lib/introRequestService';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import { notifyVCIntroRequested } from '@/lib/notificationService';
import { useAsyncAction } from '@/hooks/useAsyncAction';

const VCStartupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useUser();
  const [startup, setStartup] = useState<Idea | null>(null);
  const [requestExists, setRequestExists] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        setLoading(true);
        const found = await getIdeaById(id);
        setStartup(found);

        // Check if intro request already exists or if already connected
        if (found && profile?.id) {
          const exists = await hasIntroRequest(profile.id, id);
          setRequestExists(exists);

          const alreadyConnected = await isConnected(profile.id, id);
          setConnected(alreadyConnected);
        }
        setLoading(false);
      }
    };
    fetchData();
  }, [id, profile]);

  // Async action for requesting introduction
  const { loading: requestIntroLoading, execute: handleRequestIntro } = useAsyncAction(
    async () => {
      if (!startup || !profile?.id || !id) {
        throw new Error('Missing required data');
      }

      // Create intro request with VC ID and startup ID
      const result = await createIntroRequest(profile.id, id);
      if (!result) {
        throw new Error('Failed to submit introduction request');
      }

      setRequestExists(true);

      // Send notification to founder
      if (startup.created_by) {
        await notifyVCIntroRequested(
          startup.created_by,
          profile.name || 'A VC',
          id,
          startup.title || startup.name || 'your startup'
        );
      }
    },
    {
      successMessage: 'Introduction request submitted!',
      errorMessage: 'Failed to submit introduction request',
    }
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
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
            The startup you're looking for doesn't exist or is not available.
          </p>
          <Button onClick={() => navigate('/vc/startups')} className="gradient-lavender">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Startups
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
            to="/vc/startups"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Startups
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {startup.title || startup.name || 'Untitled Startup'}
                </h1>
                <p className="text-muted-foreground">
                  {startup.description || 'No description available'}
                </p>
              </div>
              {startup.status === 'approved_for_vc' && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0 whitespace-nowrap">
                  Motif Approved
                </Badge>
              )}
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
              {/* Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <Card className="glass-surface border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Stage</p>
                        <p className="font-medium capitalize">{startup.stage || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Industry</p>
                        <p className="font-medium capitalize">
                          {startup.industry || startup.target_market || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Problem */}
              {startup.problem && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="glass-surface border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Problem
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground leading-relaxed">{startup.problem}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Solution */}
              {startup.solution && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Card className="glass-surface border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        Solution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground leading-relaxed">{startup.solution}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Target Market */}
              {startup.target_market && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="glass-surface border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Target Market
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground leading-relaxed">{startup.target_market}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Founder Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Card className="glass-surface border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Founder
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Full founder details available upon intro approval
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Pitch Deck */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="glass-surface border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Pitch Deck
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/30 border border-border/50 rounded-lg p-8 text-center">
                      <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground text-sm">
                        Pitch deck available upon intro approval
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar - Request Intro */}
            <div className="md:col-span-1 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
              >
                <Card
                  className={`glass-surface border-border/50 ${
                    connected
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-800/20'
                      : requestExists
                      ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-800/20'
                      : 'bg-gradient-to-br from-[#C9A7EB]/10 to-[#B084E8]/10'
                  }`}
                >
                  <CardContent className="p-6">
                    {connected ? (
                      <>
                        <div className="flex items-center gap-3 mb-3">
                          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                          <div>
                            <h4 className="font-semibold text-green-900 dark:text-green-100">
                              Connected
                            </h4>
                          </div>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                          You are connected with this startup. You now have full access to their
                          pitch deck and founder details.
                        </p>
                        <Button
                          variant="outline"
                          className="w-full rounded-xl border-green-600 dark:border-green-400"
                          onClick={() => navigate('/vc/dashboard')}
                        >
                          Back to Dashboard
                        </Button>
                      </>
                    ) : requestExists ? (
                      <>
                        <div className="flex items-center gap-3 mb-3">
                          <CheckCircle2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                          <div>
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                              Request Submitted
                            </h4>
                          </div>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                          Your introduction request is under review by the Motif team. You'll be
                          notified once it's approved.
                        </p>
                        <Button
                          variant="outline"
                          className="w-full rounded-xl border-blue-600 dark:border-blue-400"
                          onClick={() => navigate('/vc/dashboard')}
                        >
                          Back to Dashboard
                        </Button>
                      </>
                    ) : (
                      <>
                        <Handshake className="h-10 w-10 text-primary mb-3" />
                        <h4 className="font-semibold mb-2">Request Introduction</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Get connected with this startup. The Motif team will review and facilitate
                          the introduction.
                        </p>
                        <Button
                          onClick={handleRequestIntro}
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
                              <Handshake className="mr-2 h-4 w-4" />
                              Request Intro
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="glass-surface border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base">Quick Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0">
                        Approved
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <span className="text-sm font-medium">
                        {new Date(startup.created_at).toLocaleDateString()}
                      </span>
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

export default VCStartupDetail;
