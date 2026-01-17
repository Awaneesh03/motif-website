import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Clock, XCircle, Inbox, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../contexts/UserContext';
import { UserRole } from '../../types/roles';
import {
  getUserNotifications,
  markAllAsRead,
  Notification,
  NotificationType,
} from '../../lib/notificationService';

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface NotificationsPageProps {
  onNavigate?: (page: string) => void;
}

interface EnrichedNotification extends Notification {
  startupName?: string;
}

export function NotificationsPage({ onNavigate }: NotificationsPageProps) {
  const { user, profile } = useUser();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<EnrichedNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [clickedNotificationId, setClickedNotificationId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
    } else {
      setNotifications([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch latest 20 notifications for the user
      const fetchedNotifications = await getUserNotifications(user.id, 20);

      // Enrich notifications with startup names if they have relatedId
      const enrichedNotifications = await Promise.all(
        fetchedNotifications.map(async (notification) => {
          if (notification.relatedId) {
            try {
              const { data, error } = await supabase
                .from('ideas')
                .select('name, title')
                .eq('id', notification.relatedId)
                .single();

              if (!error && data) {
                return {
                  ...notification,
                  startupName: data.name || data.title || 'Untitled Startup',
                };
              }
            } catch (err) {
              console.error('Error fetching startup name:', err);
            }
          }
          return { ...notification };
        })
      );

      setNotifications(enrichedNotifications);

      // Mark all as read when page is visited
      await markAllAsRead(user.id);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;

    setIsMarkingRead(true);
    try {
      await markAllAsRead(user.id);
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark notifications as read');
    } finally {
      setIsMarkingRead(false);
    }
  };

  const getNotificationBadge = (type: NotificationType) => {
    switch (type) {
      case 'startup_approved':
      case 'vc_intro_approved':
        return {
          label: 'Approved',
          variant: 'default' as const,
          className: 'bg-green-500/10 text-green-600 border-green-500/20',
          icon: CheckCircle2,
        };
      case 'startup_rejected':
        return {
          label: 'Action Required',
          variant: 'destructive' as const,
          className: 'bg-red-500/10 text-red-600 border-red-500/20',
          icon: XCircle,
        };
      case 'startup_submitted':
      case 'vc_intro_requested':
        return {
          label: 'Under Review',
          variant: 'secondary' as const,
          className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
          icon: Clock,
        };
      default:
        return {
          label: 'Info',
          variant: 'secondary' as const,
          className: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
          icon: Bell,
        };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getNotificationLink = (notification: EnrichedNotification): string | null => {
    const userRole = profile?.role as UserRole;
    const relatedId = notification.relatedId;

    if (!relatedId) return null;

    // Route based on notification type and user role
    switch (notification.type) {
      case 'startup_submitted':
      case 'startup_approved':
      case 'startup_rejected':
      case 'vc_intro_requested':
        // Founders view their startup detail page
        return `/dashboard/startups/${relatedId}`;

      case 'vc_intro_approved':
        // VCs go to VC startup detail, Founders go to their dashboard
        if (userRole === UserRole.VC || userRole === UserRole.SUPER_ADMIN) {
          return `/vc/startups/${relatedId}`;
        }
        return `/dashboard/startups/${relatedId}`;

      default:
        return null;
    }
  };

  const handleNotificationClick = (notification: EnrichedNotification) => {
    const link = getNotificationLink(notification);
    if (!link) return;

    setClickedNotificationId(notification.id);

    // Navigate to the appropriate page
    setTimeout(() => {
      navigate(link);
    }, 150); // Small delay for visual feedback
  };

  const isNotificationClickable = (notification: EnrichedNotification): boolean => {
    return getNotificationLink(notification) !== null;
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="gradient-lavender relative overflow-hidden py-16">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <h1 className="font-['Poppins'] text-4xl text-white md:text-5xl">
                Notifications
              </h1>
            </div>
            <p className="max-w-2xl text-xl text-white/80">
              Stay updated on your startup journey
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-background relative min-h-[80vh] py-12">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -left-[10%] top-[20%] h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -right-[10%] bottom-[20%] h-[500px] w-[500px] rounded-full bg-purple-500/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header Actions */}
          {!isLoading && notifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 flex items-center justify-between"
            >
              <p className="text-muted-foreground text-sm font-medium">
                Showing {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={isMarkingRead || notifications.every((n) => n.isRead)}
                className="rounded-xl text-sm font-medium"
              >
                {isMarkingRead ? 'Marking...' : 'Mark all as read'}
              </Button>
            </motion.div>
          )}

          {/* Notifications List */}
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-64 items-center justify-center"
            >
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">Loading notifications...</p>
              </div>
            </motion.div>
          ) : notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/10 to-purple-500/10 shadow-xl shadow-primary/5">
                <Inbox className="h-12 w-12 text-primary/80" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-foreground">
                No notifications yet
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md text-lg">
                When you submit startups or receive updates, they'll appear here.
              </p>
              <Button
                onClick={() => onNavigate?.('Dashboard')}
                size="lg"
                className="gradient-lavender shadow-lavender h-12 rounded-xl px-8 text-base font-semibold transition-transform hover:scale-105 active:scale-95"
              >
                Go to Dashboard
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification, index) => {
                const badge = getNotificationBadge(notification.type);
                const BadgeIcon = badge.icon;
                const isClickable = isNotificationClickable(notification);
                const isClicked = clickedNotificationId === notification.id;

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`group relative overflow-hidden border-border/50 transition-all duration-300 ${
                        isClickable
                          ? 'cursor-pointer hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5'
                          : ''
                      } ${
                        !notification.isRead
                          ? 'bg-primary/5 ring-2 ring-primary/10'
                          : 'bg-card/50 backdrop-blur-sm'
                      } ${isClicked ? 'opacity-50' : ''}`}
                      onClick={() => isClickable && handleNotificationClick(notification)}
                    >
                      {/* Unread Indicator */}
                      {!notification.isRead && (
                        <div className="absolute left-0 top-0 h-full w-1 bg-primary" />
                      )}

                      {/* Gradient Overlay on Hover */}
                      {isClickable && (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      )}

                      <CardContent className="relative p-6">
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${badge.className}`}>
                            <BadgeIcon className="h-5 w-5" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex items-center gap-2 flex-1">
                                <h3 className="text-base font-semibold text-foreground">
                                  {notification.title}
                                </h3>
                                {isClickable && (
                                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                )}
                              </div>
                              <Badge className={`flex-shrink-0 ${badge.className}`}>
                                {badge.label}
                              </Badge>
                            </div>

                            <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                              {notification.message}
                            </p>

                            <div className="flex items-center justify-between gap-4">
                              {notification.startupName && (
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                                  <span className="text-xs font-medium text-primary">
                                    {notification.startupName}
                                  </span>
                                </div>
                              )}
                              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider ml-auto">
                                {formatTimestamp(notification.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
