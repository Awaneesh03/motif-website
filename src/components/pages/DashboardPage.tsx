import { motion } from 'motion/react';
import {
  Lightbulb,
  BookOpen,
  Zap,
  ArrowRight,
  TrendingUp,
  Users,
  CheckCircle2,
  Sparkles,
  Rocket,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useUser } from '@/contexts/UserContext';
import { getUserIdeas, type Idea } from '@/lib/ideasService';

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user, profile } = useUser();
  const navigate = useNavigate();
  const [userName] = useState('Alex Johnson');
  const [currentTip, setCurrentTip] = useState(0);
  const [myStartups, setMyStartups] = useState<Idea[]>([]);

  const stats = [
    {
      label: 'Ideas Submitted',
      value: '12',
      icon: Lightbulb,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Cases Attempted',
      value: '8',
      icon: BookOpen,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      label: 'Credits Remaining',
      value: '15',
      icon: Zap,
      color: 'text-[#FFD19C]',
      bgColor: 'bg-[#FFD19C]/10',
    },
  ];

  const recentActivity = [
    {
      type: 'idea',
      title: 'AI-powered meal planning app analyzed',
      date: '2 hours ago',
      status: 'completed',
      icon: Lightbulb,
    },
    {
      type: 'case',
      title: 'Uber - Urban Transportation case started',
      date: '5 hours ago',
      status: 'in-progress',
      icon: BookOpen,
    },
    {
      type: 'comment',
      title: "You received feedback on 'Blockchain marketplace'",
      date: '1 day ago',
      status: 'new',
      icon: Users,
    },
    {
      type: 'idea',
      title: 'No-code platform idea saved',
      date: '2 days ago',
      status: 'completed',
      icon: Lightbulb,
    },
    {
      type: 'case',
      title: 'Airbnb case study completed - Score: 88%',
      date: '3 days ago',
      status: 'completed',
      icon: CheckCircle2,
    },
  ];

  const aiTips = [
    "💡 Start with a clear problem statement - it's the foundation of every successful pitch.",
    '🚀 Focus on one key feature that differentiates you from competitors.',
    '📊 Validate your assumptions with real user feedback before building.',
    '💰 Your first 100 users are more valuable than your first dollar.',
    "🎯 Niche down - it's easier to dominate a small market first.",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % aiTips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchStartups = async () => {
      if (user?.id) {
        const ideas = await getUserIdeas(user.id);
        setMyStartups(ideas);
      }
    };
    fetchStartups();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-[#A9F5D0] bg-[#A9F5D0]/10';
      case 'in-progress':
        return 'text-[#FFD19C] bg-[#FFD19C]/10';
      case 'new':
        return 'text-primary bg-primary/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header Section */}
      <section className="via-background to-background border-border relative overflow-hidden border-b bg-gradient-to-br from-[#C9A7EB]/20 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="mb-2">Welcome back, {userName} 👋</h1>
            <p className="text-muted-foreground">
              Here's what's happening with your ideas and progress
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Main Content Area */}
            <div className="space-y-6 lg:col-span-3">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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

              {/* My Startups */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="glass-surface border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-primary" />
                        My Startups
                      </CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {myStartups.length} {myStartups.length === 1 ? 'startup' : 'startups'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {myStartups.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Rocket className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="mb-2">No startups yet</p>
                        <p className="text-sm">Create your first idea to get started</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {myStartups.map((startup, index) => (
                          <motion.div
                            key={startup.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                            className="bg-muted/30 hover:bg-muted/50 border border-border/50 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md"
                            onClick={() => navigate(`/dashboard/startups/${startup.id}`)}
                          >
                            <h4 className="font-semibold mb-2 truncate">
                              {startup.title || startup.name || 'Untitled'}
                            </h4>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs capitalize">
                                {startup.stage || 'N/A'}
                              </Badge>
                              <Badge
                                className={`text-xs capitalize border-0 ${
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
                            <p className="text-xs text-muted-foreground">
                              Created {new Date(startup.created_at).toLocaleDateString()}
                            </p>
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
                transition={{ delay: 0.4 }}
              >
                <Card className="glass-surface border-border/50">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.05 }}
                          className="bg-muted/30 hover:bg-muted/50 flex cursor-pointer items-start gap-4 rounded-xl p-4 transition-colors"
                        >
                          <div className="gradient-lavender flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                            <activity.icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="mb-1 truncate">{activity.title}</p>
                            <p className="text-muted-foreground text-sm">{activity.date}</p>
                          </div>
                          <Badge
                            className={`${getStatusColor(activity.status)} border-0 capitalize`}
                          >
                            {activity.status === 'in-progress' ? 'In Progress' : activity.status}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Go to Profile CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="glass-surface border-border/50 bg-gradient-to-br from-[#C9A7EB]/10 to-[#B084E8]/10">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                      <div>
                        <h3 className="mb-2">Complete Your Profile</h3>
                        <p className="text-muted-foreground text-sm">
                          Add more details to help the community know you better
                        </p>
                      </div>
                      <Button
                        className="gradient-lavender shadow-lavender whitespace-nowrap rounded-xl hover:opacity-90"
                        onClick={() => onNavigate?.('Profile')}
                      >
                        Go to Profile
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
                      onClick={() => onNavigate?.('Idea Analyser')}
                    >
                      <Lightbulb className="mr-2 h-4 w-4 group-hover:text-white" />
                      Analyze Idea
                    </Button>
                    <Button
                      variant="outline"
                      className="hover:gradient-lavender group w-full justify-start rounded-xl transition-all hover:border-transparent hover:text-white"
                      onClick={() => onNavigate?.('Case Studies')}
                    >
                      <BookOpen className="mr-2 h-4 w-4 group-hover:text-white" />
                      Solve Case
                    </Button>
                    <Button
                      variant="outline"
                      className="hover:gradient-lavender group w-full justify-start rounded-xl transition-all hover:border-transparent hover:text-white"
                      onClick={() => onNavigate?.('Pitch Creator')}
                    >
                      <Sparkles className="mr-2 h-4 w-4 group-hover:text-white" />
                      Create Pitch
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Tips from AI */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="glass-surface border-border/50 bg-gradient-to-br from-[#C9A7EB]/10 to-[#B084E8]/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="text-primary h-4 w-4" />
                      Tips from AI
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      key={currentTip}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.5 }}
                      className="text-sm leading-relaxed"
                    >
                      {aiTips[currentTip]}
                    </motion.div>
                    <div className="mt-4 flex justify-center gap-1">
                      {aiTips.map((_, index) => (
                        <div
                          key={index}
                          className={`h-1.5 rounded-full transition-all ${
                            index === currentTip ? 'bg-primary w-6' : 'bg-muted w-1.5'
                          }`}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Upgrade CTA */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="glass-surface border-primary/50 gradient-lavender border-2 text-white">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="mx-auto mb-3 h-10 w-10" />
                    <h4 className="mb-2">Upgrade to Premium</h4>
                    <p className="mb-4 text-sm text-white/90">
                      Unlock unlimited analyses and exclusive features
                    </p>
                    <Button
                      className="text-primary w-full rounded-xl bg-white hover:bg-white/90"
                      onClick={() => onNavigate?.('Membership')}
                    >
                      View Plans
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
