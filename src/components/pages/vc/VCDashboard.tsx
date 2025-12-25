import { Link } from 'react-router-dom';

const VCDashboard = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          VC Dashboard
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Curated startups matching your investment focus
        </p>
        <Link
          to="/vc/startups"
          className="inline-block px-8 py-4 bg-gray-900 text-white text-lg font-medium rounded hover:bg-gray-800 transition-colors"
        >
          View Deal Flow
        </Link>
      </div>
    </div>
  );
};

export default VCDashboard;
