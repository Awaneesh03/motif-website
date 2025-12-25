import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAllStartups } from '@/lib/startupService';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalFounders: 0,
    totalStartups: 0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    const startups = getAllStartups();
    const pendingCount = startups.filter((s) => s.status === 'pending').length;

    // Count unique founders
    const uniqueFounders = new Set(startups.map((s) => s.createdBy));

    setStats({
      totalFounders: uniqueFounders.size,
      totalStartups: startups.length,
      pendingApprovals: pendingCount,
    });
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Founders</p>
          <p className="text-4xl font-bold text-gray-900">{stats.totalFounders}</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Startups</p>
          <p className="text-4xl font-bold text-gray-900">{stats.totalStartups}</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Pending Approvals</p>
          <p className="text-4xl font-bold text-orange-600">{stats.pendingApprovals}</p>
        </div>
      </div>

      {/* Primary CTA */}
      <div>
        <Link
          to="/admin/startups"
          className="inline-block px-6 py-3 bg-gray-900 text-white font-medium rounded hover:bg-gray-800 transition-colors"
        >
          Review Startups
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
