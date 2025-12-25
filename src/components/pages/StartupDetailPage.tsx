import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Rocket, Calendar, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { getIdeaById, type Idea } from '@/lib/ideasService';

export function StartupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [startup, setStartup] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStartup = async () => {
      if (id) {
        setLoading(true);
        const data = await getIdeaById(id);
        setStartup(data);
        setLoading(false);
      }
    };
    fetchStartup();
  }, [id]);

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
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {startup.stage || 'N/A'}
                  </Badge>
                  <Badge
                    className={`capitalize border-0 ${
                      startup.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : startup.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {startup.status || 'N/A'}
                  </Badge>
                </div>
              </div>
              <Rocket className="h-12 w-12 text-primary opacity-50" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
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
                    <p className="text-muted-foreground">
                      Detailed information about your startup will be displayed here. This is a
                      placeholder view for startup details.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

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
                        <p className="text-sm text-muted-foreground mb-1">Status</p>
                        <p className="font-medium capitalize">{startup.status || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Created</p>
                        <p className="font-medium">
                          {new Date(startup.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">ID</p>
                        <p className="font-mono text-xs">{startup.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
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
                      className="w-full"
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
