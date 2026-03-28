import { Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import { getUnreadCount, getAllNotifications, getUserNotifications } from '../lib/notificationService';
import type { Notification } from '../lib/notificationService';

import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface NotificationBellProps {
  variant?: 'default' | 'light' | 'dark';
}

export function NotificationBell({ variant = 'default' }: NotificationBellProps) {
  const { user, profile } = useUser();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      loadNotifications();

      // Subscribe to real-time notifications
      const subscription = supabase
        .channel(`notifications-bell:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // Reload notifications when new notification arrives
            loadUnreadCount();
            loadNotifications();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // Reload when notification is updated (e.g., marked as read)
            loadUnreadCount();
            loadNotifications();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
        supabase.removeChannel(subscription);
      };
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
      setServiceAvailable(true);
      setLastError(null);
    } catch (error: any) {
      // Track service availability for UI feedback
      console.warn('Failed to load notification count:', error);
      setUnreadCount(0);
      setServiceAvailable(false);
      setLastError(error?.message || 'Service unavailable');
    }
  };

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const data = profile?.role === 'super_admin'
        ? await getAllNotifications(10)
        : await getUserNotifications(user.id, 10);
      setNotifications(data);
      setServiceAvailable(true);
      setLastError(null);
    } catch (error: any) {
      console.warn('Failed to load notifications:', error);
      setNotifications([]);
      setServiceAvailable(false);
      setLastError(error?.message || 'Service unavailable');
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
          {!serviceAvailable ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Notifications unavailable</p>
              <p className="text-xs mt-1 text-muted-foreground">
                {lastError || 'Service temporarily unavailable. Please try again later.'}
              </p>
              <button
                onClick={() => { loadUnreadCount(); loadNotifications(); }}
                className="mt-3 text-xs text-primary hover:underline"
              >
                Retry
              </button>
            </div>
          ) : notifications.length === 0 ? (
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
