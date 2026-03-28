import { motion } from 'motion/react';
import { CheckCircle2, XCircle, Send, Clock, UserCheck, Inbox } from 'lucide-react';

import type { Notification, NotificationType } from '../lib/notificationService';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface ActivityTimelineProps {
  activities: Notification[];
  title?: string;
  maxItems?: number;
  compact?: boolean;
}

interface ActivityMetadata {
  icon: React.ElementType;
  iconColor: string;
  iconBgColor: string;
  label: string;
}

const getActivityMetadata = (type: NotificationType): ActivityMetadata => {
  switch (type) {
    case 'startup_submitted':
      return {
        icon: Send,
        iconColor: 'text-blue-600',
        iconBgColor: 'bg-blue-600/10',
        label: 'Submitted',
      };
    case 'startup_approved':
      return {
        icon: CheckCircle2,
        iconColor: 'text-green-600',
        iconBgColor: 'bg-green-600/10',
        label: 'Approved',
      };
    case 'startup_rejected':
      return {
        icon: XCircle,
        iconColor: 'text-red-600',
        iconBgColor: 'bg-red-600/10',
        label: 'Rejected',
      };
    case 'vc_intro_requested':
      return {
        icon: UserCheck,
        iconColor: 'text-purple-600',
        iconBgColor: 'bg-purple-600/10',
        label: 'Intro Request',
      };
    case 'vc_intro_approved':
      return {
        icon: CheckCircle2,
        iconColor: 'text-green-600',
        iconBgColor: 'bg-green-600/10',
        label: 'Connected',
      };
    default:
      return {
        icon: Clock,
        iconColor: 'text-gray-600',
        iconBgColor: 'bg-gray-600/10',
        label: 'Activity',
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
  });
};

export function ActivityTimeline({
  activities,
  title = 'Recent Activity',
  maxItems = 10,
  compact = false,
}: ActivityTimelineProps) {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <Card className="border-border/50">
      <CardHeader className={compact ? 'pb-3' : ''}>
        <CardTitle className={compact ? 'text-base' : 'text-lg'}>{title}</CardTitle>
      </CardHeader>
      <CardContent className={compact ? 'pt-0' : ''}>
        {displayedActivities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Actions will appear here as they happen
            </p>
          </motion.div>
        ) : (
          <div className="relative space-y-4">
            {/* Vertical timeline line */}
            <div className="absolute left-[19px] top-3 bottom-3 w-px bg-border" />

            {displayedActivities.map((activity, index) => {
              const metadata = getActivityMetadata(activity.type);
              const Icon = metadata.icon;

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative flex items-start gap-4"
                >
                  {/* Timeline icon */}
                  <div
                    className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${metadata.iconBgColor} ring-4 ring-background`}
                  >
                    <Icon className={`h-4 w-4 ${metadata.iconColor}`} />
                  </div>

                  {/* Activity content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                        {activity.title}
                      </h4>
                      <Badge
                        variant="secondary"
                        className="flex-shrink-0 text-[10px] px-2 py-0 h-5"
                      >
                        {metadata.label}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {activity.message}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimestamp(activity.createdAt)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
