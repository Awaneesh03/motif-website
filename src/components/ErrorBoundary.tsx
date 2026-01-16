// Error Boundary Component for handling runtime errors gracefully
// Catches errors from deleted resources, network issues, and other edge cases

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  /**
   * Fallback UI to show when error occurs
   */
  fallback?: ReactNode;
  /**
   * Callback when error occurs
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary that catches React errors and displays user-friendly fallback UI
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>

            <h2 className="mb-2 text-2xl font-bold">Something went wrong</h2>

            <p className="text-muted-foreground mb-6">
              {this.getErrorMessage(this.state.error)}
            </p>

            <div className="flex gap-4 justify-center">
              <Button onClick={this.handleReset} className="rounded-xl">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>

              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="rounded-xl"
              >
                Reload Page
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer font-semibold text-sm text-muted-foreground">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 overflow-auto rounded-lg bg-muted p-4 text-xs">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  private getErrorMessage(error: Error | null): string {
    if (!error) {
      return 'An unexpected error occurred. Please try again.';
    }

    const message = error.message;

    // Handle specific error cases
    if (message.includes('not found') || message.includes('PGRST116')) {
      return 'This resource no longer exists. It may have been deleted or moved.';
    }

    if (message.includes('Permission denied') || message.includes('privileges required')) {
      return 'You do not have permission to access this resource.';
    }

    if (message.includes('Network') || message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }

    if (message.includes('timeout')) {
      return 'The request timed out. Please try again.';
    }

    // Default message
    return 'An unexpected error occurred. Please try refreshing the page or contact support if the issue persists.';
  }
}

/**
 * Higher-order component to wrap any component with ErrorBoundary
 *
 * @example
 * export default withErrorBoundary(MyComponent);
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const Wrapped = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  Wrapped.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return Wrapped;
}
