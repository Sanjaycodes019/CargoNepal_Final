import React from 'react';
import logger from '../utils/logger.js';
import { getErrorFallbackMessage } from '../utils/errorHandler.js';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to our logging system
    logger.error('React Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'Unnamed Boundary'
    });

    // Store error info for display
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const fallbackMessage = getErrorFallbackMessage(this.state.error);
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {fallbackMessage.title}
              </h2>
              <p className="text-gray-600 mb-6">
                {fallbackMessage.message}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full py-3 px-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-sm hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
              >
                {fallbackMessage.action}
              </button>
              
              {fallbackMessage.action !== 'Retry' && (
                <button
                  onClick={this.handleRetry}
                  className="w-full py-3 px-4 bg-white text-slate-900 border border-slate-300 rounded-lg hover:bg-gray-50 font-medium shadow-sm hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
                >
                  Retry
                </button>
              )}
              
              <button
                onClick={this.handleGoHome}
                className="w-full py-3 px-4 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Go to Homepage
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Error Details (Development Only)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded-lg text-xs">
                  <p className="font-mono text-red-600 mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="whitespace-pre-wrap text-gray-600">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
