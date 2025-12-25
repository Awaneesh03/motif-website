import { Outlet, Link } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';

export const AdminLayout = () => {
  const { profile } = useUser();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <nav className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-8">
              <Link to="/admin/dashboard" className="text-xl font-bold">
                Motif Admin
              </Link>
              <Link
                to="/admin/dashboard"
                className="text-gray-300 hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                to="/admin/startups"
                className="text-gray-300 hover:text-white"
              >
                Startups
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">{profile?.name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-300 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};
