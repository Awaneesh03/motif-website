import { Outlet } from 'react-router-dom';
import { VCNavbar } from '@/components/vc/VCNavbar';

export const VCLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <VCNavbar />
      <main className="flex-1">
        <Outlet />
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
