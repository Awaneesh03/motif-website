import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { createStartup } from '@/lib/startupService';

const SubmitStartupPage = () => {
  const { profile } = useUser();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    pitch: '',
    problem: '',
    solution: '',
    industry: '',
    stage: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [submittedStartup, setSubmittedStartup] = useState<any>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) return;

    // Create startup
    const newStartup = createStartup({
      ...formData,
      status: 'pending',
      createdBy: profile.id,
      founderName: profile.name,
    });

    setSubmittedStartup(newStartup);
    setSubmitted(true);
  };

  const isFormValid =
    formData.name &&
    formData.pitch &&
    formData.problem &&
    formData.solution &&
    formData.industry &&
    formData.stage;

  // Show confirmation screen after submission
  if (submitted && submittedStartup) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="mb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Startup Submitted
            </h1>
            <p className="text-center text-gray-600">
              Your startup is under review by the Motif team.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Startup Name</p>
              <p className="font-medium text-gray-900">{submittedStartup.name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">One-Line Pitch</p>
              <p className="text-gray-900">{submittedStartup.pitch}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded">
                Pending Review
              </span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-4 py-2 bg-gray-900 text-white font-medium rounded hover:bg-gray-800 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show submission form
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Your Startup</h1>
        <p className="text-gray-600">
          Complete this form to submit your startup for review. Once approved, your
          startup will be visible to investors.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="space-y-6">
          {/* Startup Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
              Startup Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
            />
          </div>

          {/* One-Line Pitch */}
          <div>
            <label htmlFor="pitch" className="block text-sm font-medium text-gray-900 mb-2">
              One-Line Pitch
            </label>
            <input
              type="text"
              id="pitch"
              name="pitch"
              value={formData.pitch}
              onChange={handleChange}
              placeholder="Describe your startup in one sentence"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
            />
          </div>

          {/* Problem Statement */}
          <div>
            <label htmlFor="problem" className="block text-sm font-medium text-gray-900 mb-2">
              Problem Statement
            </label>
            <textarea
              id="problem"
              name="problem"
              value={formData.problem}
              onChange={handleChange}
              rows={4}
              placeholder="What problem are you solving?"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Solution Overview */}
          <div>
            <label htmlFor="solution" className="block text-sm font-medium text-gray-900 mb-2">
              Solution Overview
            </label>
            <textarea
              id="solution"
              name="solution"
              value={formData.solution}
              onChange={handleChange}
              rows={4}
              placeholder="How does your solution work?"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Industry */}
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-900 mb-2">
              Industry
            </label>
            <select
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
            >
              <option value="">Select industry</option>
              <option value="SaaS">SaaS</option>
              <option value="FinTech">FinTech</option>
              <option value="HealthTech">HealthTech</option>
              <option value="EdTech">EdTech</option>
              <option value="CleanTech">CleanTech</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Stage */}
          <div>
            <label htmlFor="stage" className="block text-sm font-medium text-gray-900 mb-2">
              Stage
            </label>
            <select
              id="stage"
              name="stage"
              value={formData.stage}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
            >
              <option value="">Select stage</option>
              <option value="Idea">Idea</option>
              <option value="Pre-seed">Pre-seed</option>
              <option value="Seed">Seed</option>
              <option value="Series A">Series A</option>
              <option value="Series B">Series B</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={!isFormValid}
              className={`w-full px-6 py-3 font-medium rounded transition-colors ${
                isFormValid
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Submit for Review
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SubmitStartupPage;
