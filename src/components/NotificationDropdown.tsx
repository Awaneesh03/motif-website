import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  type Notification,
} from '@/lib/notificationService';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface NotificationDropdownProps {
  userId: string;
}

export function NotificationDropdown({ userId }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const [notifs, count] = await Promise.all([
        getUserNotifications(userId, 10),
        getUnreadCount(userId),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      // Silently fail - notifications are non-critical UI
      if (import.meta.env.DEV) {
        console.warn('Failed to load notifications (non-critical):', error);
      }
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadNotifications();

      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead(userId);
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'startup_submitted':
        return '📝';
      case 'startup_approved':
        return '✅';
      case 'startup_rejected':
        return '❌';
      case 'vc_intro_requested':
        return '👋';
      case 'vc_intro_approved':
        return '🤝';
      default:
        return '📬';
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-foreground" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs border-0">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Content */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-80 z-50"
            >
              <Card className="glass-surface border-border/50 shadow-lg">
                {/* Header */}
                <div className="px-4 py-3 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllRead}
                        className="text-xs h-auto py-1 px-2"
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-[400px] overflow-y-auto">
                  {loading ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      Loading...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors ${
                            !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium mb-1">
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {getRelativeTime(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1"></div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
