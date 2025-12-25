import { useState, useEffect } from 'react';
import { getAllStartups, updateStartupStatus, type Startup, type StartupStatus } from '@/lib/startupService';

const AdminStartups = () => {
  const [startups, setStartups] = useState<Startup[]>([]);

  // Load startups from service
  useEffect(() => {
    loadStartups();
  }, []);

  const loadStartups = () => {
    const allStartups = getAllStartups();
    setStartups(allStartups);
  };

  const handleApprove = (id: string) => {
    updateStartupStatus(id, 'approved_for_vc');
    loadStartups(); // Reload to reflect changes
  };

  const handleReject = (id: string) => {
    updateStartupStatus(id, 'rejected');
    loadStartups(); // Reload to reflect changes
  };

  const getStatusBadge = (status: StartupStatus) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved_for_vc: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    const labels = {
      pending: 'Pending',
      approved_for_vc: 'Approved for VC',
      rejected: 'Rejected',
    };

    return (
      <span className={`px-3 py-1 rounded text-sm font-medium ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Startup Approvals</h1>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Startup Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Founder
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {startups.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No startups submitted yet
                </td>
              </tr>
            ) : (
              startups.map((startup) => (
                <tr key={startup.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {startup.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{startup.founderName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{startup.stage}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(startup.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(startup.id)}
                        disabled={startup.status === 'approved_for_vc'}
                        className={`px-3 py-1 rounded font-medium transition-colors ${
                          startup.status === 'approved_for_vc'
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(startup.id)}
                        disabled={startup.status === 'rejected'}
                        className={`px-3 py-1 rounded font-medium transition-colors ${
                          startup.status === 'rejected'
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminStartups;
