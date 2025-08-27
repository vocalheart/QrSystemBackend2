import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from './AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import ApiLoader from '../Loader/ApiLoader';

export default function Signup() {
  const { preSignup, user, ip } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const nameInputRef = useRef(null);

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
    setError(null);

    if (!isValidName(formData.name)) {
      setFieldErrors((prev) => ({
        ...prev,
        name: 'Name must be at least 2 characters long.',
      }));
      toast.error('Invalid name.', {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      return;
    }

    if (!isValidEmail(formData.email)) {
      setFieldErrors((prev) => ({
        ...prev,
        email: 'Please enter a valid email address.',
      }));
      toast.error('Invalid email format.', {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      return;
    }

    if (!isValidPassword(formData.password)) {
      setFieldErrors((prev) => ({
        ...prev,
        password: 'Password must be at least 8 characters long.',
      }));
      toast.error('Password too short.', {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: 'Passwords do not match.',
      }));
      toast.error('Passwords do not match.', {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-6 font-roboto text-[12px] antialiased">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: { fontSize: '12px' },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
      <div className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col lg:flex-row">
        <div className="lg:flex-1 bg-pink-600 p-6 sm:p-8 flex items-center justify-center">
          <div className="text-center w-full">
            <div className="w-full max-w-xs mx-auto sm:max-w-sm">
              <div className="bg-gray-200 dark:bg-gray-700 h-48 sm:h-64 rounded-md flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400 text-[12px]">
                  Signup Illustration Placeholder
                </span>
              </div>
            </div>
            <h2 className="text-[14px] font-bold text-white mt-4">Join Our Community!</h2>
            <p className="text-[12px] text-pink-100 mt-2">
              Create your admin account to manage job applications.
            </p>
          </div>
        </div>
        <div className="flex-1 p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-[16px] font-bold text-gray-900 dark:text-white">Create Admin Account</h1>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-2">
              Fill in your details to get started
            </p>
          </div>
          {error && (
            <div
              className="mb-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-3 rounded-r-md"
              role="alert"
              aria-describedby="signup-error"
            >
              <div className="flex items-start">
                <XCircleIcon className="h-4 w-4 text-red-500 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-[12px] text-red-700 dark:text-red-300" id="signup-error">
                  {error}
                </span>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="name"
                className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 text-[12px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                  placeholder="Your full name"
                  required
                  autoComplete="name"
                  disabled={loading}
                  ref={nameInputRef}
                  aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                  aria-label="Full name"
                />
              </div>
              {fieldErrors.name && (
                <p className="text-[12px] text-red-500 dark:text-red-400 mt-1" id="name-error">
                  {fieldErrors.name}
                </p>
              )}
            </div>
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
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 text-[12px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                  disabled={loading}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  aria-label="Email address"
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[12px] text-red-500 dark:text-red-400 mt-1" id="email-error">
                  {fieldErrors.email}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-9 pr-9 py-2 text-[12px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  disabled={loading}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              {formData.password && (
                <p className={`text-[12px] ${passwordStrength.color} mt-1`}>
                  Password Strength: {passwordStrength.strength}
                </p>
              )}
              {fieldErrors.password && (
                <p className="text-[12px] text-red-500 dark:text-red-400 mt-1" id="password-error">
                  {fieldErrors.password}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-9 pr-9 py-2 text-[12px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  disabled={loading}
                  aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
                  aria-label="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={showPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p
                  className="text-[12px] text-red-500 dark:text-red-400 mt-1"
                  id="confirm-password-error"
                >
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 dark:border-gray-600 rounded"
                required
                aria-label="Agree to terms and privacy policy"
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-[12px] text-gray-700 dark:text-gray-300"
              >
                I agree to the{' '}
                <a
                  href="/terms"
                  className="text-pink-600 dark:text-pink-400 hover:text-pink-500 dark:hover:text-pink-300 hover:underline"
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="/privacy"
                  className="text-pink-600 dark:text-pink-400 hover:text-pink-500 dark:hover:text-pink-300 hover:underline"
                >
                  Privacy Policy
                </a>
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
              aria-label="Sign up"
            >
              {loading ? (
                <>
                  <ApiLoader size="small" className="mr-2" />
                  Processing...
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-[12px] text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-pink-600 dark:text-pink-400 hover:text-pink-500 dark:hover:text-pink-300 hover:underline"
                aria-label="Go to sign in"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}