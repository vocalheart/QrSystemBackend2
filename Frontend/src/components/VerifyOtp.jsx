import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from './AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { XCircleIcon } from '@heroicons/react/24/outline';
import ApiLoader from '../Loader/ApiLoader';

export default function VerifyOtp() {
  const { preSignup, signup, verifyOtp } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ otp: '' });
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({ otp: '' });
  const [loading, setLoading] = useState(false);
  const otpInputRef = useRef(null);
  const [signupData, setSignupData] = useState(null);

  // Check for temporary signup data on mount
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('tempSignupData'));
    if (!data || !data.email || !data.name || !data.password) {
      toast.error('Invalid signup data. Please try signing up again.', {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
        style: { fontSize: '12px', background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' },
      });
      navigate('/signup', { replace: true });
    } else {
      setSignupData(data);
      otpInputRef.current?.focus();
    }
  }, [navigate]);

  // Handle OTP input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Allow only digits and limit to 6 characters
    if (value.match(/^\d{0,6}$/)) {
      setFormData({ ...formData, [name]: value });
      setFieldErrors((prev) => ({
        ...prev,
        [name]: value && !/^\d{6}$/.test(value) ? 'OTP must be a 6-digit number.' : '',
      }));
    }
  };

  // Resend OTP by calling preSignup again
  const handleRequestOtp = async () => {
    if (!signupData) return;

    try {
      setLoading(true);
      await preSignup(signupData.name, signupData.email, signupData.password, signupData.ip);
      toast.success('New OTP sent to your email!', {
        style: { fontSize: '12px', background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and complete signup, then redirect to login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(formData.otp)) {
      setFieldErrors((prev) => ({
        ...prev,
        otp: 'OTP must be a 6-digit number.',
      }));
      toast.error('Invalid OTP format.', {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
        style: { fontSize: '12px', background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' },
      });
      return;
    }

    if (!signupData) {
      toast.error('No signup data found. Please try signing up again.', {
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
        style: { fontSize: '12px', background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' },
      });
      navigate('/signup', { replace: true });
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(signupData.email, formData.otp);
      await signup(signupData.email);
      localStorage.removeItem('tempSignupData');
      toast.success('Account created successfully! Please log in.', {
        style: { fontSize: '12px', background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' },
      });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-[16px] font-bold text-gray-900 dark:text-white">Verify Your Email</h1>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-2">
            Enter the OTP sent to {signupData?.email || 'your email'}
          </p>
        </div>
        {error && (
          <div
            className="mb-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-3 rounded-r-md"
            role="alert"
            aria-describedby="otp-error"
          >
            <div className="flex items-start">
              <XCircleIcon className="h-4 w-4 text-red-500 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-[12px] text-red-700 dark:text-red-300" id="otp-error">
                {error}
              </span>
            </div>
          </div>
        )}
        <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="otp"
              className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              OTP
            </label>
            <div className="relative">
              <input
                type="text"
                name="otp"
                id="otp"
                value={formData.otp}
                onChange={handleChange}
                className="w-full pl-3 pr-3 py-2 text-[12px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                placeholder="Enter 6-digit OTP"
                required
                disabled={loading}
                ref={otpInputRef}
                aria-describedby={fieldErrors.otp ? 'otp-field-error' : undefined}
                aria-label="OTP"
              />
            </div>
            {fieldErrors.otp && (
              <p className="text-[12px] text-red-500 dark:text-red-400 mt-1" id="otp-field-error">
                {fieldErrors.otp}
              </p>
            )}
          </div>
          <div className="flex justify-between space-x-2">
            <button
              type="button"
              onClick={handleRequestOtp}
              disabled={loading || !signupData}
              className={`flex-1 py-2 px-4 rounded-md text-[12px] font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-200 flex items-center justify-center ${
                loading || !signupData
                  ? 'bg-pink-400 cursor-not-allowed'
                  : 'bg-pink-600 hover:bg-pink-700 shadow-sm'
              }`}
              aria-label="Resend OTP"
            >
              {loading ? (
                <>
                  <ApiLoader size="small" className="mr-2" />
                  Resending...
                </>
              ) : (
                'Resend OTP'
              )}
            </button>
            <button
              type="submit"
              disabled={loading || !formData.otp}
              className={`flex-1 py-2 px-4 rounded-md text-[12px] font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-200 flex items-center justify-center ${
                loading || !formData.otp
                  ? 'bg-pink-400 cursor-not-allowed'
                  : 'bg-pink-600 hover:bg-pink-700 shadow-sm'
              }`}
              aria-label="Verify OTP"
            >
              {loading ? (
                <>
                  <ApiLoader size="small" className="mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </button>
          </div>
        </form>
        <div className="mt-4 text-center">
          <p className="text-[12px] text-gray-500 dark:text-gray-400">
            Back to{' '}
            <Link
              to="/signup"
              className="font-medium text-pink-600 dark:text-pink-400 hover:text-pink-500 dark:hover:text-pink-300 hover:underline"
              aria-label="Go back to signup"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}