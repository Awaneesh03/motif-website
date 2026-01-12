import { Link } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { NotificationBell } from '@/components/NotificationBell';

export const VCNavbar = () => {
  const { profile } = useUser();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/vc/dashboard" className="text-2xl font-bold text-gray-900">
            Motif
          </Link>

          {/* Right side - Notifications + Profile + Logout */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <NotificationBell variant="dark" />

            {/* Profile Display */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 border border-gray-200">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {profile?.name?.charAt(0).toUpperCase() || 'V'}
                </span>
              </div>
              <span className="text-sm text-gray-900">{profile?.name || 'VC Account'}</span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
