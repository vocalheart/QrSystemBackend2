import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import AuthContext from './AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import ApiLoader from '../Loader/ApiLoader';

// Import the actual sign-up image (same as login or new one)
import signupImage from '../assets/signup.png'; // Replace with your actual signup image

// Replace with your Google OAuth Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Signup() {
  const { preSignup, login, user, ip } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const nameInputRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (password) => password.length >= 8;
  const isValidName = (name) => name.trim().length >= 2;
  const getPasswordStrength = (password) => {
    if (password.length < 8) return { strength: 'Weak', color: 'text-red-500' };
    if (password.length < 12) return { strength: 'Moderate', color: 'text-yellow-500' };
    return { strength: 'Strong', color: 'text-green-500' };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    setFieldErrors((prev) => ({
      ...prev,
      [name]:
        name === 'name' && !isValidName(value)
          ? 'Name must be at least 2 characters long.'
          : name === 'email' && !isValidEmail(value)
          ? 'Please enter a valid email address.'
          : name === 'password' && !isValidPassword(value)
          ? 'Password must be at least 8 characters long.'
          : name === 'confirmPassword' && value !== formData.password
          ? 'Passwords do not match.'
          : '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    toast.dismiss();

    if (!isValidName(formData.name)) {
      const errorMsg = 'Name must be at least 2 characters long.';
      setFieldErrors((prev) => ({ ...prev, name: errorMsg }));
      setError(errorMsg);
      toast.error(errorMsg, {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
      return;
    }

    if (!isValidEmail(formData.email)) {
      const errorMsg = 'Please enter a valid email address.';
      setFieldErrors((prev) => ({ ...prev, email: errorMsg }));
      setError(errorMsg);
      toast.error(errorMsg, {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
      return;
    }

    if (!isValidPassword(formData.password)) {
      const errorMsg = 'Password must be at least 8 characters long.';
      setFieldErrors((prev) => ({ ...prev, password: errorMsg }));
      setError(errorMsg);
      toast.error(errorMsg, {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      const errorMsg = 'Passwords do not match.';
      setFieldErrors((prev) => ({ ...prev, confirmPassword: errorMsg }));
      setError(errorMsg);
      toast.error(errorMsg, {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
      return;
    }

    setLoading(true);
    try {
      await preSignup(formData.name, formData.email, formData.password, ip);
      localStorage.setItem(
        'tempSignupData',
        JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          ip,
        })
      );
      navigate('/verify-otp', { replace: true });
      toast.success('Please verify your email.', {
        icon: <CheckCircleIcon className="h-4 w-4 text-indigo-600" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
    } catch (err) {
      const errorMsg =
        err.response?.status === 429
          ? 'Too many signup attempts. Please try again later.'
          : err.response?.data?.message || 'Failed to create account';
      setError(errorMsg);
      toast.error(errorMsg, {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In success
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      await login(null, null, ip, credentialResponse.credential);
      navigate('/dashboard', { replace: true });
      toast.success('Signed up with Google successfully!', {
        icon: <CheckCircleIcon className="h-4 w-4 text-indigo-600" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
    } catch (err) {
      const errorMsg =
        err.response?.status === 429
          ? 'Too many signup attempts. Please try again later.'
          : err.response?.data?.message || 'This email is already registered with a password. Please use password login.';
      setError(errorMsg);
      toast.error(errorMsg, {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In failure
  const handleGoogleError = () => {
    const errorMsg = 'Google Sign-Up was unsuccessful. Please try again.';
    setError(errorMsg);
    toast.error(errorMsg, {
      icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
    });
  };

  const passwordStrength = getPasswordStrength(formData.password);

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

         {/* ✅ IMAGE SECTION - EXACTLY LIKE LOGIN   this is for lg screen */}
          <div className="hidden lg:block relative overflow-hidden">
            {/* FULL IMAGE - SHOWS ENTIRE IMAGE WITHOUT CROPPING - NO OVERLAY */}
            <img
              src={signupImage}
              alt="Sign Up"
              className="w-full h-full object-contain max-w-full max-h-full"
            />
          </div>

        <div className="w-full max-w-6xl  dark:bg-slate-800 rounded-lg   overflow-hidden flex flex-col lg:flex-row">
          {/* ✅ IMAGE SECTION - EXACTLY LIKE LOGIN  this is for mobiles and tablets */}
          <div className="lg:hidden w-full lg:w-1/2 relative overflow-hidden flex items-center justify-center">
            {/* FULL IMAGE - SHOWS ENTIRE IMAGE WITHOUT CROPPING - NO OVERLAY */}
            <img
              src={signupImage}
              alt="Sign Up"
              className="w-full h-full object-contain max-w-full max-h-full"
            />
          </div>

          {/* Form Section - Exactly like Login */}
          <div className="w-full lg:w-3/4 flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            <div className="text-center mb-8 hidden lg:block">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Create Account
              </h1>
              <p className=" text-sm text-slate-500 dark:text-slate-400">
                Join us today and get started
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

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="Enter your full name"
                    required
                    autoComplete="name"
                    disabled={loading}
                    ref={nameInputRef}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-1">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="Enter your email"
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-3 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
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
                {formData.password && (
                  <p className={`text-sm ${passwordStrength.color} mt-1`}>
                    Password Strength: {passwordStrength.strength}
                  </p>
                )}
                {fieldErrors.password && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-3 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
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
                {fieldErrors.confirmPassword && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 rounded"
                  required
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">
                  I agree to the{' '}
                  <Link
                    to="/terms"
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline transition-colors"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    to="/privacy"
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-6 rounded-lg text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 flex items-center justify-center ${
                  loading
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-500  hover:bg-indigo-700    to-purple-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <ApiLoader size="small" className="mr-2" />
                    Creating Account...
                  </>
                ) : (
                  'Sign Up'
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
                  text="continue_with"
                  shape="rectangular"
                  disabled={loading}
                  size="large"
                />
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}