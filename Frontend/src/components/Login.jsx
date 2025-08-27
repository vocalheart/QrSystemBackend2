import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from './AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import {
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
  EnvelopeIcon,
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import ApiLoader from '../Loader/ApiLoader';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const { login, user, ip } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const emailInputRef = useRef(null);
  const forgotEmailInputRef = useRef(null);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (password) => password.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Clear any existing toasts
    toast.dismiss();

    if (!isValidEmail(email)) {
      const errorMsg = 'Please enter a valid email address.';
      setError(errorMsg);
      toast.error(errorMsg, {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      return;
    }

    if (!isValidPassword(password)) {
      const errorMsg = 'Password must be at least 8 characters long.';
      setError(errorMsg);
      toast.error(errorMsg, {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      return;
    }

    setLoading(true);
    try {
      await login(email, password, ip);
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
      toast.success('Logged in successfully!', {
        icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
      });
    } catch (err) {
      const errorMsg =
        err.response?.status === 429
          ? 'Too many login attempts. Please try again later.'
          : err.response?.data?.message || 'Email or password is incorrect';
      setError(errorMsg);
      toast.error(errorMsg, {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError('');

    // Clear any existing toasts
    toast.dismiss();

    if (!isValidEmail(forgotEmail)) {
      const errorMsg = 'Please enter a valid email address.';
      setForgotError(errorMsg);
      toast.error(errorMsg, {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email: forgotEmail.toLowerCase() });
      toast.success('Verification code sent to your email!', {
        icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
      });
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(forgotEmail)}`);
        setIsForgotPasswordOpen(false);
        setForgotEmail('');
      }, 1500);
    } catch (err) {
      const errorMsg =
        err.response?.status === 429
          ? 'Too many requests. Please try again later.'
          : err.response?.data?.message || 'Failed to send verification code.';
      setForgotError(errorMsg);
      toast.error(errorMsg, {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
    } finally {
      setLoading(false);
    }
  };

  const openForgotPasswordModal = () => {
    setIsForgotPasswordOpen(true);
    setTimeout(() => forgotEmailInputRef.current?.focus(), 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-6 font-roboto text-[12px] antialiased">
      <Toaster
        position="bottom-right"
      />
      <div className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col lg:flex-row">
        <div className="lg:flex-1 bg-pink-600 p-6 sm:p-8 flex items-center justify-center">
          <div className="text-center w-full">
            <div className="w-full max-w-xs mx-auto sm:max-w-sm">
              <div className="bg-gray-200 dark:bg-gray-700 h-48 sm:h-64 rounded-md flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400 text-[12px]">
                  Login Illustration Placeholder
                </span>
              </div>
            </div>
            <h2 className="text-[14px] font-bold text-white mt-4">Welcome Back!</h2>
            <p className="text-[12px] text-pink-100 mt-2">
              Sign in to access your personalized dashboard and features.
            </p>
          </div>
        </div>
        <div className="flex-1 p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-[16px] font-bold text-gray-900 dark:text-white">Sign In</h1>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-2">
              Enter your credentials to access your account
            </p>
          </div>
          {error && (
            <div
              className="mb-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-3 rounded-r-md"
              role="alert"
              aria-describedby="login-error"
            >
              <div className="flex items-start">
                <XCircleIcon className="h-4 w-4 text-red-500 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-[12px] text-red-700 dark:text-red-300" id="login-error">
                  {error}
                </span>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-[12px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                  disabled={loading}
                  ref={emailInputRef}
                  aria-describedby={error ? 'email-error' : undefined}
                  aria-label="Email address"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-[12px] font-medium text-gray-700 dark:text-gray-300"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={openForgotPasswordModal}
                  className="text-[12px] text-pink-600 dark:text-pink-400 hover:text-pink-500 dark:hover:text-pink-300 hover:underline"
                  aria-label="Forgot password"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-[12px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  aria-describedby={error ? 'password-error' : undefined}
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 dark:border-gray-600 rounded"
                aria-label="Remember me"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-[12px] text-gray-700 dark:text-gray-300"
              >
                Remember me
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded-md text-[12px] font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-200 flex items-center justify-center ${
                loading
                  ? 'bg-pink-400 cursor-not-allowed'
                  : 'bg-pink-600 hover:bg-pink-700 shadow-sm'
              }`}
              aria-label="Sign in"
            >
              {loading ? (
                <>
                  <ApiLoader size="small" className="mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-[12px] text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="font-medium text-pink-600 dark:text-pink-400 hover:text-pink-500 dark:hover:text-pink-300 hover:underline"
                aria-label="Go to signup"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      </div>
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md w-full max-w-md p-6 animate-in fade-in-50 zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
                Reset Password
              </h3>
              <button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="p-1 rounded-full text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                aria-label="Close reset password modal"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            {forgotError && (
              <div
                className="mb-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-3 rounded-r-md"
                role="alert"
                aria-describedby="forgot-email-error"
              >
                <div className="flex items-start">
                  <XCircleIcon className="h-4 w-4 text-red-500 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-[12px] text-red-700 dark:text-red-300" id="forgot-email-error">
                    {forgotError}
                  </span>
                </div>
              </div>
            )}
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-4">
              Enter your email address to receive a verification code.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3 py-2 text-[12px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                  ref={forgotEmailInputRef}
                  aria-describedby={forgotError ? 'forgot-email-error' : undefined}
                  aria-label="Email address for password reset"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-[12px] font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200"
                  aria-label="Cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-2 px-4 rounded-md text-[12px] font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-200 ${
                    loading
                      ? 'bg-pink-400 cursor-not-allowed'
                      : 'bg-pink-600 hover:bg-pink-700 shadow-sm'
                  }`}
                  aria-label="Send verification code"
                >
                  {loading ? (
                    <>
                      <ApiLoader size="small" className="mr-2 inline" />
                      Sending...
                    </>
                  ) : (
                    'Send Code'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;