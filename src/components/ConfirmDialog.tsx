import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle } from 'lucide-react';

import { Button } from './ui/button';
import { Card } from './ui/card';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'success';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-md"
          >
            <Card className="glass-surface border-border/50 shadow-2xl p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                    variant === 'danger'
                      ? 'bg-red-100 dark:bg-red-900/20'
                      : 'bg-green-100 dark:bg-green-900/20'
                  }`}
                >
                  {variant === 'danger' ? (
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{message}</p>
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      disabled={isLoading}
                      className="rounded-xl"
                    >
                      {cancelText}
                    </Button>
                    <Button
                      onClick={handleConfirm}
                      disabled={isLoading}
                      className={`rounded-xl ${
                        variant === 'danger'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'gradient-lavender shadow-lavender'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        confirmText
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
