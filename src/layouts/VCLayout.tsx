import { Outlet, useNavigate } from 'react-router-dom';
import { VCNavbar } from '@/components/vc/VCNavbar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';

export const VCLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <VCNavbar />
      <main className="flex-1">
        <ErrorBoundary
          fallback={
            <div className="flex min-h-[600px] flex-col items-center justify-center p-8">
              <div className="max-w-md text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <svg
                    className="h-8 w-8 text-red-600 dark:text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>

                <h2 className="mb-2 text-2xl font-bold">Something went wrong</h2>
                <p className="text-muted-foreground mb-6">
                  An error occurred in the VC portal. You can go back or return home.
                </p>
                <div className="flex justify-center gap-4">
                  <Button onClick={() => navigate(-1)} className="rounded-xl" variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                  </Button>
                  <Button onClick={() => navigate('/')} className="rounded-xl">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Button>
                </div>
              </div>
            </div>
          }
        >
          <Outlet />
        </ErrorBoundary>
      </main>
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center space-x-6 text-sm text-gray-600">
            <a href="#" className="hover:text-gray-900">Terms</a>
            <a href="#" className="hover:text-gray-900">Privacy</a>
            <a href="/contact" className="hover:text-gray-900">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
