import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getApprovedStartups, type Startup } from '@/lib/startupService';

const VCStartups = () => {
  const [startups, setStartups] = useState<Startup[]>([]);

  useEffect(() => {
    // Load only approved startups
    const approved = getApprovedStartups();
    setStartups(approved);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Deal Flow</h1>
        <p className="text-gray-600">{startups.length} startup{startups.length !== 1 ? 's' : ''}</p>
      </div>

      {startups.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600">No approved startups yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {startups.map((startup) => (
            <Link
              key={startup.id}
              to={`/vc/startups/${startup.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {startup.name}
                  </h2>
                  <p className="text-gray-700">{startup.pitch}</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded whitespace-nowrap ml-4">
                  Approved by Motif
                </span>
              </div>

              <div className="flex gap-6 text-sm text-gray-600">
                <span>
                  <span className="font-medium">Industry:</span> {startup.industry}
                </span>
                <span>
                  <span className="font-medium">Stage:</span> {startup.stage}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default VCStartups;
