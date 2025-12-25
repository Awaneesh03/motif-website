import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getStartupById, type Startup } from '@/lib/startupService';
import { createIntroRequest, hasIntroRequest } from '@/lib/introRequestService';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';

const VCStartupDetail = () => {
  const { id } = useParams();
  const { profile } = useUser();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [requestExists, setRequestExists] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        const found = getStartupById(id);
        setStartup(found);

        // Check if intro request already exists
        if (found && profile) {
          const exists = await hasIntroRequest(profile.id, id);
          setRequestExists(exists);
        }
      }
    };
    fetchData();
  }, [id, profile]);

  const handleRequestIntro = async () => {
    if (!startup || !profile) return;

    // Create intro request
    const result = await createIntroRequest({
      startupId: startup.id,
      vcId: profile.id,
      vcName: profile.name,
      startupName: startup.name,
      status: 'requested',
    });

    if (result) {
      setRequestExists(true);
      setRequestSubmitted(true);
      toast.success('Introduction request submitted for review');
    } else {
      toast.error('Failed to submit introduction request');
    }
  };

  if (!startup) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-gray-600">Startup not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back link */}
      <Link
        to="/vc/startups"
        className="inline-block text-gray-600 hover:text-gray-900 mb-8"
      >
        ← Back to Deal Flow
      </Link>

      {/* Header */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {startup.name}
            </h1>
            <p className="text-xl text-gray-700 mb-4">{startup.pitch}</p>
          </div>
          {startup.status === 'approved_for_vc' && (
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded whitespace-nowrap ml-4">
              Approved by Motif
            </span>
          )}
        </div>

        <div className="flex gap-6 text-sm text-gray-600">
          <span>
            <span className="font-medium">Industry:</span> {startup.industry}
          </span>
          <span>
            <span className="font-medium">Stage:</span> {startup.stage}
          </span>
        </div>
      </div>

      {/* Content sections */}
      <div className="space-y-8">
        {/* Problem */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Problem</h2>
          <p className="text-gray-700 leading-relaxed">{startup.problem}</p>
        </section>

        {/* Solution */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Solution</h2>
          <p className="text-gray-700 leading-relaxed">{startup.solution}</p>
        </section>

        {/* Founder */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Founder</h2>
          <p className="text-gray-700 leading-relaxed">{startup.founderName}</p>
        </section>

        {/* Pitch Deck */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Pitch Deck</h2>
          <div className="border border-gray-300 rounded-lg p-8 text-center bg-gray-50">
            <p className="text-gray-600">Pitch deck available upon intro approval</p>
          </div>
        </section>

        {/* Action */}
        <section className="pt-6 border-t border-gray-200">
          {requestSubmitted ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-medium">Request submitted successfully</p>
              <p className="text-sm text-green-700 mt-1">
                Your introduction request is under review by the Motif team.
              </p>
            </div>
          ) : requestExists ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 font-medium">Introduction requested</p>
              <p className="text-sm text-blue-700 mt-1">
                Your request is under review by the Motif team.
              </p>
            </div>
          ) : null}

          <button
            onClick={handleRequestIntro}
            disabled={requestExists}
            className={`w-full sm:w-auto px-8 py-3 font-medium rounded transition-colors ${
              requestExists
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {requestExists ? 'Introduction Requested' : 'Request Intro'}
          </button>
        </section>
      </div>
    </div>
  );
};

export default VCStartupDetail;
