// Custom hook for handling async actions with loading states and error handling
// Prevents double-clicks, handles deleted resources, and provides consistent UX

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface UseAsyncActionOptions {
  /**
   * Success message to show after action completes
   */
  successMessage?: string;

  /**
   * Error message prefix (actual error will be appended)
   */
  errorMessage?: string;

  /**
   * Callback to run on success
   */
  onSuccess?: () => void;

  /**
   * Callback to run on error
   */
  onError?: (error: Error) => void;

  /**
   * Show toast notifications (default: true)
   */
  showToast?: boolean;
}

export interface UseAsyncActionReturn<T> {
  /**
   * Whether the action is currently executing
   */
  loading: boolean;

  /**
   * Error from the last execution, if any
   */
  error: Error | null;

  /**
   * Execute the async action
   * Returns the result if successful, null if failed
   */
  execute: (...args: any[]) => Promise<T | null>;

  /**
   * Reset the error state
   */
  resetError: () => void;
}

/**
 * Hook for executing async actions with built-in loading states,
 * error handling, and double-click prevention
 *
 * @example
 * const { loading, execute } = useAsyncAction(
 *   async (id) => approveStartup(id),
 *   { successMessage: 'Startup approved!' }
 * );
 *
 * <Button onClick={() => execute(startupId)} disabled={loading}>
 *   {loading ? 'Approving...' : 'Approve'}
 * </Button>
 */
export function useAsyncAction<T = any>(
  action: (...args: any[]) => Promise<T>,
  options: UseAsyncActionOptions = {}
): UseAsyncActionReturn<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // useRef-based lock ensures double-click prevention is race-free.
  // State updates are asynchronous — two rapid calls can both pass a `if (loading)` check
  // before the first re-render. A ref updates synchronously and prevents this.
  const isExecutingRef = useRef(false);

  const {
    successMessage,
    errorMessage = 'An error occurred',
    onSuccess,
    onError,
    showToast = true,
  } = options;

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      // Prevent double-execution via synchronous ref check
      if (isExecutingRef.current) {
        return null;
      }
      isExecutingRef.current = true;

      setLoading(true);
      setError(null);

      try {
        const result = await action(...args);

        // Success
        if (successMessage && showToast) {
          toast.success(successMessage);
        }

        if (onSuccess) {
          onSuccess();
        }

        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);

        // Handle specific error cases
        const errorMsg = handleAsyncError(error, errorMessage);

        if (showToast) {
          toast.error(errorMsg);
        }

        if (onError) {
          onError(error);
        }

        return null;
      } finally {
        isExecutingRef.current = false;
        setLoading(false);
      }
    },
    [action, successMessage, errorMessage, onSuccess, onError, showToast]
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    resetError,
  };
}

/**
 * Handle common async errors with user-friendly messages
 */
function handleAsyncError(error: Error, prefix: string): string {
  // Handle specific error cases
  if (error.message.includes('not found') || error.message.includes('PGRST116')) {
    return 'This resource no longer exists. It may have been deleted.';
  }

  if (error.message.includes('already requested')) {
    return error.message; // Use the specific message from the service
  }

  if (error.message.includes('Permission denied') || error.message.includes('privileges required')) {
    return error.message; // Use the specific permission error
  }

  if (error.message.includes('Invalid status transition')) {
    return error.message; // Use the specific validation error
  }

  if (error.message.includes('Network') || error.message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  if (error.message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  // Default: combine prefix with error message
  return `${prefix}: ${error.message}`;
}

/**
 * Hook variant specifically for delete operations
 * with confirmation and optimistic UI updates
 */
export function useDeleteAction<T = any>(
  deleteAction: (...args: any[]) => Promise<T>,
  options: UseAsyncActionOptions & {
    /**
     * Confirmation message to show before deleting
     */
    confirmMessage?: string;
  } = {}
): UseAsyncActionReturn<T> {
  const {
    confirmMessage = 'Are you sure you want to delete this item?',
    ...asyncOptions
  } = options;

  const asyncAction = useAsyncAction(deleteAction, {
    successMessage: 'Deleted successfully',
    errorMessage: 'Failed to delete',
    ...asyncOptions,
  });

  const executeWithConfirmation = useCallback(
    async (...args: any[]): Promise<T | null> => {
      // Show confirmation dialog
      const confirmed = window.confirm(confirmMessage);

      if (!confirmed) {
        return null;
      }

      return asyncAction.execute(...args);
    },
    [confirmMessage, asyncAction]
  );

  return {
    ...asyncAction,
    execute: executeWithConfirmation,
  };
}

/**
 * Hook variant for batch operations (multiple async actions)
 */
export function useBatchAction<T = any>(
  batchAction: (items: any[]) => Promise<T>,
  options: UseAsyncActionOptions = {}
): UseAsyncActionReturn<T> {
  return useAsyncAction(batchAction, {
    successMessage: 'Batch operation completed',
    errorMessage: 'Batch operation failed',
    ...options,
  });
}
