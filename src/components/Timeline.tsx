import { motion } from 'motion/react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

export interface TimelineEvent {
  title: string;
  description?: string;
  date?: string;
  status: 'completed' | 'current' | 'pending';
  icon?: React.ComponentType<{ className?: string }>;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const Icon = event.icon || (event.status === 'completed' ? CheckCircle2 : event.status === 'current' ? Clock : Circle);
        const isLast = index === events.length - 1;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex gap-4"
          >
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border" />
            )}

            {/* Icon */}
            <div className="relative z-10 flex-shrink-0">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  event.status === 'completed'
                    ? 'bg-green-100 dark:bg-green-900/20'
                    : event.status === 'current'
                    ? 'bg-blue-100 dark:bg-blue-900/20'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    event.status === 'completed'
                      ? 'text-green-600 dark:text-green-400'
                      : event.status === 'current'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400'
                  }`}
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p
                    className={`font-medium ${
                      event.status === 'pending' ? 'text-muted-foreground' : ''
                    }`}
                  >
                    {event.title}
                  </p>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.description}
                    </p>
                  )}
                </div>
                {event.date && (
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {event.date}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
