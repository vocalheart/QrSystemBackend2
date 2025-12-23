import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
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

// Import the actual sign-in image
import signinImage from '../assets/login.png'; // Replace with your actual image file

// Replace with your Google OAuth Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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

    toast.dismiss();

    if (!isValidEmail(email)) {
      const errorMsg = 'Please enter a valid email address.';
      setError(errorMsg);
      toast.error(errorMsg, {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
      return;
    }

    if (!isValidPassword(password)) {
      const errorMsg = 'Password must be at least 8 characters long.';
      setError(errorMsg);
      toast.error(errorMsg, {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
      return;
    }

    setLoading(true);
    try {
      await login(email, password, ip);
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
      toast.success('Logged in successfully!', {
        icon: <CheckCircleIcon className="h-4 w-4 text-indigo-600" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
    } catch (err) {
      const errorMsg =
        err.response?.status === 429
          ? 'Too many login attempts. Please try again later.'
          : err.response?.data?.message || 'Email or password is incorrect';
      setError(errorMsg);
      toast.error(errorMsg, {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    toast.dismiss();
    if (!isValidEmail(forgotEmail)) {
      const errorMsg = 'Please enter a valid email address.';
      setForgotError(errorMsg);
      toast.error(errorMsg, {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email: forgotEmail.toLowerCase() });
      toast.success('Verification code sent to your email!', {
        icon: <CheckCircleIcon className="h-4 w-4 text-indigo-600" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
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
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const token = credentialResponse.credential;
      await login(null, null, ip, token);
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
      toast.success('Logged in with Google successfully!', {
        icon: <CheckCircleIcon className="h-4 w-4 text-indigo-600" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
    } catch (err) {
      const errorMsg =
        err.response?.status === 429
          ? 'Too many login attempts. Please try again later.'
          : err.response?.data?.message || 'Google Sign-In failed';
      setError(errorMsg);
      toast.error(errorMsg, {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In was unsuccessful. Please try again.');
    toast.error('Google Sign-In failed.', {
      icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
    });
  };

  const openForgotPasswordModal = () => {
    setIsForgotPasswordOpen(true);
    setTimeout(() => forgotEmailInputRef.current?.focus(), 100);
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 sm:p-6 font-[Inter] text-[12px] antialiased">
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontSize: '12px',
              background: '#ffffff',
              color: '#1e293b',
              padding: '12px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            },
            success: { iconTheme: { primary: '#4f46e5', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
        <div className="hidden lg:block  w-full relative overflow-hidden flex items-center justify-center">
            {/* FULL IMAGE - SHOWS ENTIRE IMAGE WITHOUT CROPPING - NO OVERLAY */}
            <img
              src={signinImage}
              alt="Sign In"
              className="w-full h-full object-contain max-w-full max-h-full"
            />
          </div>
          {/* //border-slate-200 dark:border-slate-700 */}
        <div className="w-full max-w-6xl  dark:bg-slate-800 rounded-lg   overflow-hidden flex flex-col lg:flex-row">
          {/* ✅ IMAGE SECTION - PERFECT FULL IMAGE FIT (NO COLOR OVERLAY) */}
          <div className=" w-full relative overflow-hidden flex items-center justify-center lg:hidden">
            {/* FULL IMAGE - SHOWS ENTIRE IMAGE WITHOUT CROPPING - NO OVERLAY */}
            <img
              src={signinImage}
              alt="Sign In"
              className="w-full h-full object-contain max-w-full max-h-full"
            />
          </div>

          {/* Form Section - Below image on mobile, right side on lg */}
          <div className="w-full lg:w-3/4  flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            <div className="hidden lg:block text-center mb-8">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Sign In
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enter your credentials to access your account
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <XCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="Enter your email"
                    required
                    autoComplete="email"
                    disabled={loading}
                    ref={emailInputRef}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={openForgotPasswordModal}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline transition-colors"
                    aria-label="Forgot password"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-6 rounded-lg text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 flex items-center justify-center ${
                  loading
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-500 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                }`}
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

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign-In */}
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme={document.documentElement.classList.contains('dark') ? 'filled_black' : 'outline'}
                  width="280"
                  text="signin_with"
                  shape="rectangular"
                  disabled={loading}
                  size="large"
                />
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/signup')}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline transition-colors"
                >
                  Create an account
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Forgot Password Modal */}
        {isForgotPasswordOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in-50 zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Reset Password
                </h3>
                <button
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {forgotError && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 rounded-r-lg">
                  <div className="flex items-start">
                    <XCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm text-red-700 dark:text-red-300">{forgotError}</span>
                  </div>
                </div>
              )}

              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Enter your email address to receive a verification code.
              </p>

              <form onSubmit={handleForgotPassword} className="space-y-6" noValidate>
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                    ref={forgotEmailInputRef}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="flex-1 py-3 px-4 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${
                      loading
                        ? 'bg-indigo-400 cursor-not-allowed'
                        : 'bg-indigo-500 hover:from-indigo-700 hover:to-purple-700'
                    }`}
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
    </GoogleOAuthProvider>
  );
}

export default Login;