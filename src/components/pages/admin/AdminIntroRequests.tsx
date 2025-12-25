import { useState, useEffect } from 'react';
import {
  getAllIntroRequests,
  updateIntroRequestStatus,
  type IntroRequest,
  type IntroRequestStatus,
} from '@/lib/introRequestService';

const AdminIntroRequests = () => {
  const [requests, setRequests] = useState<IntroRequest[]>([]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    const allRequests = await getAllIntroRequests();
    setRequests(allRequests);
  };

  const handleApprove = async (id: string) => {
    await updateIntroRequestStatus(id, 'approved');
    loadRequests();
  };

  const handleReject = async (id: string) => {
    await updateIntroRequestStatus(id, 'rejected');
    loadRequests();
  };

  const getStatusBadge = (status: IntroRequestStatus) => {
    const colors = {
      requested: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    const labels = {
      requested: 'Requested',
      approved: 'Approved',
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Introduction Requests</h1>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Startup
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                VC
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
            {requests.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No introduction requests yet
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {request.startupName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{request.vcName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={request.status === 'approved'}
                        className={`px-3 py-1 rounded font-medium transition-colors ${
                          request.status === 'approved'
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={request.status === 'rejected'}
                        className={`px-3 py-1 rounded font-medium transition-colors ${
                          request.status === 'rejected'
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

export default AdminIntroRequests;
