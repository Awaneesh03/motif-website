import { Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../contexts/UserContext';
import { getUnreadCount, getAllNotifications } from '../lib/notificationService';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '../lib/notificationService';

interface NotificationBellProps {
  variant?: 'default' | 'light' | 'dark';
}

export function NotificationBell({ variant = 'default' }: NotificationBellProps) {
  const { user } = useUser();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      loadNotifications();

      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        loadUnreadCount();
        loadNotifications();
      }, 30000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
      setNotifications([]);
    }
  }, [user]);

  const loadUnreadCount = async () => {
    if (!user) return;

    try {
      const count = await getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      // Silently fail - notifications are non-critical UI
      console.warn('Failed to load notification count (non-critical):', error);
      setUnreadCount(0); // Safe fallback
    }
  };

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const data = await getAllNotifications(10); // Get last 10 notifications
      setNotifications(data);
    } catch (error) {
      console.warn('Failed to load notifications (non-critical):', error);
      setNotifications([]);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setIsOpen(false);
    // Navigate to relevant context based on notification type
    if (notification.type === 'startup_submitted' || notification.type === 'startup_approved' || notification.type === 'startup_rejected') {
      navigate('/admin/startups');
    } else if (notification.type === 'vc_intro_requested' || notification.type === 'vc_intro_approved') {
      navigate('/admin/intro-requests');
    } else {
      navigate('/notifications');
    }
  };

  const handleViewAllNotifications = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  if (!user) return null;

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'light':
        return 'hover:bg-white/10 text-white';
      case 'dark':
        return 'hover:bg-gray-100 text-gray-700';
      default:
        return 'hover:bg-accent';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isLoading}
          className={`relative rounded-full shrink-0 ${getVariantStyles()}`}
          title="View notifications"
        >
          <Bell className="h-5 w-5" />

          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background"
              >
                <motion.span
                  key={unreadCount}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              {unreadCount} new
            </Badge>
          )}
        </div>

        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification, index) => (
                <div
                  key={notification.id || index}
                  className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                      !notification.isRead ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />

        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => setIsOpen(false)}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
