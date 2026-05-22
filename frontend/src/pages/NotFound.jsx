import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-lg">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 bg-slate-900 rounded-full mb-6">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">Page Not Found</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-8 max-w-md mx-auto">
            Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-sm hover:shadow transition-all"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go to Homepage
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-medium transition-all"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </button>
        </div>

        {/* Helper Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">You might be looking for:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/trucks"
              className="text-sm text-slate-900 hover:text-slate-700 font-medium transition-colors"
            >
              Browse Trucks
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              to="/login"
              className="text-sm text-slate-900 hover:text-slate-700 font-medium transition-colors"
            >
              Login
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              to="/register"
              className="text-sm text-slate-900 hover:text-slate-700 font-medium transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;