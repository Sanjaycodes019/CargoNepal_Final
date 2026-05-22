import logger from '../utils/logger.js';
import { handleError } from '../utils/errorHandler.js';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/verify-otp', { email, otp });

      if (response.data.success) {
        setSuccess('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.data.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      logger.error('OTP verification error', { error: err, email });
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setSuccess('');
    setResendLoading(true);

    try {
      const response = await axiosInstance.post('/auth/resend-otp', { email });

      if (response.data.success) {
        setSuccess('OTP resent successfully! Check your email.');
        setTimer(30);
        setCanResend(false);
      } else {
        setError(response.data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      logger.error('Resend OTP error', { error: err, email });
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h2>
          <p className="text-gray-600 mb-1">
            We've sent a 6-digit OTP to
          </p>
          <p className="font-semibold text-slate-900">{email}</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Enter OTP Code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                value={otp}
                onChange={handleOtpChange}
                placeholder="000000"
                maxLength="6"
                className="appearance-none relative block w-full px-3 py-4 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-center text-3xl tracking-widest font-bold transition-all"
                required
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500 text-center">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg text-sm">
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{success}</span>
                </div>
              </div>
            )}

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 px-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-sm hover:shadow transition-all disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify Email'
              )}
            </button>

            {/* Resend OTP Section */}
            <div className="text-center pt-4 border-t border-gray-200">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  className="text-sm text-slate-900 hover:text-slate-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {resendLoading ? 'Sending...' : 'Resend OTP'}
                </button>
              ) : (
                <p className="text-sm text-gray-600">
                  Didn't receive the code?{' '}
                  <span className="font-semibold text-slate-900">
                    Resend in {timer}s
                  </span>
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Back to Register */}
        <div className="text-center mt-6">
          <Link
            to="/register"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
