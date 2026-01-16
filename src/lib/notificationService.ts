// Notification service for Motif platform
// Handles creating, fetching, and managing system notifications

import { supabase } from './supabase';
import { safeFetchList, safeFetchCount } from './safeFetch';

export type NotificationType =
  | 'startup_submitted'
  | 'startup_approved'
  | 'startup_rejected'
  | 'vc_intro_requested'
  | 'vc_intro_approved';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

// Helper to transform DB row to Notification
const transformToNotification = (row: any): Notification => {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    relatedId: row.related_id,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
};

// Create a notification
export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedId?: string
): Promise<Notification | null> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        related_id: relatedId,
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data ? transformToNotification(data) : null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error creating notification:', error);
    }
    return null;
  }
};

// Get all notifications for a user
export const getUserNotifications = async (
  userId: string,
  limit: number = 10
): Promise<Notification[]> => {
  // Guard: User ID required
  if (!userId) {
    return [];
  }

  const data = await safeFetchList(
    () =>
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit),
    { serviceName: 'notificationService.getUserNotifications' }
  );

  return data.map(transformToNotification);
};

// Get unread count for a user
export const getUnreadCount = async (userId: string): Promise<number> => {
  // Guard: User ID required
  if (!userId) {
    return 0;
  }

  // Use safeFetchCount to handle RLS 400s gracefully
  return safeFetchCount(
    () =>
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false),
    { serviceName: 'notificationService.getUnreadCount' }
  );
};

// Mark notification as read
export const markAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error marking notification as read:', error);
    }
    return false;
  }
};

// Mark all notifications as read for a user
export const markAllAsRead = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error marking all notifications as read:', error);
    }
    return false;
  }
};

// Get all notifications (for admin audit timeline)
export const getAllNotifications = async (limit: number = 50): Promise<Notification[]> => {
  const data = await safeFetchList(
    () =>
      supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit),
    { serviceName: 'notificationService.getAllNotifications' }
  );

  return data.map(transformToNotification);
};

// Notification creation helpers for specific events

export const notifyStartupSubmitted = async (
  founderId: string,
  startupId: string,
  startupName: string
): Promise<void> => {
  await createNotification(
    founderId,
    'startup_submitted',
    'Startup Submitted for Review',
    `Your startup "${startupName}" has been submitted to Motif admins for review.`,
    startupId
  );
};

export const notifyStartupApproved = async (
  founderId: string,
  startupId: string,
  startupName: string
): Promise<void> => {
  await createNotification(
    founderId,
    'startup_approved',
    'Startup Approved!',
    `Congratulations! Your startup "${startupName}" has been approved and is now visible to VCs.`,
    startupId
  );
};

export const notifyStartupRejected = async (
  founderId: string,
  startupId: string,
  startupName: string
): Promise<void> => {
  await createNotification(
    founderId,
    'startup_rejected',
    'Startup Needs Improvements',
    `Your startup "${startupName}" needs some improvements. Please review the feedback and resubmit.`,
    startupId
  );
};

export const notifyVCIntroRequested = async (
  founderId: string,
  vcName: string,
  startupId: string,
  startupName: string
): Promise<void> => {
  await createNotification(
    founderId,
    'vc_intro_requested',
    'VC Requested Introduction',
    `${vcName} has requested an introduction to your startup "${startupName}".`,
    startupId
  );
};

export const notifyVCIntroApproved = async (
  vcId: string,
  founderId: string,
  startupId: string,
  startupName: string
): Promise<void> => {
  // Notify VC
  await createNotification(
    vcId,
    'vc_intro_approved',
    'Introduction Approved',
    `Your introduction request to "${startupName}" has been approved. You can now connect with the founder.`,
    startupId
  );

  // Notify Founder
  await createNotification(
    founderId,
    'vc_intro_approved',
    'VC Connection Approved',
    `You are now connected with a VC for "${startupName}". They may reach out to you externally.`,
    startupId
  );
};
