import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import ApiLoader from '../Loader/ApiLoader';

function ResetPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    otp: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inputRefs = useRef([]);
  const emailInputRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Check for email in URL params
  useEffect(() => {
    const urlEmail = searchParams.get('email');
    if (urlEmail) {
      setEmail(decodeURIComponent(urlEmail));
    }
    emailInputRef.current?.focus();
  }, [searchParams]);

  // Focus first OTP input when not verified
  useEffect(() => {
    if (!isOtpVerified && !email) {
      emailInputRef.current?.focus();
    } else if (!isOtpVerified) {
      inputRefs.current[0]?.focus();
    }
  }, [isOtpVerified, email]);

  // Handle resend OTP cooldown
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (password) => password.length >= 8;
  const getPasswordStrength = (password) => {
    if (password.length < 8) return { strength: 'Weak', color: 'text-red-500' };
    if (password.length < 12) return { strength: 'Moderate', color: 'text-yellow-500' };
    return { strength: 'Strong', color: 'text-green-500' };
  };

  const handleOtpChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setFieldErrors((prev) => ({ ...prev, otp: '' }));

      // Auto-focus next input if value entered
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit if last digit entered
      if (index === 5 && value) {
        const form = document.getElementById('otp-form');
        setTimeout(() => form?.requestSubmit(), 100);
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const newOtp = pasteData.split('').slice(0, 6);
      setOtp(newOtp);
      setFieldErrors((prev) => ({ ...prev, otp: '' }));
      inputRefs.current[5]?.focus();
      const form = document.getElementById('otp-form');
      setTimeout(() => form?.requestSubmit(), 100);
    } else {
      setFieldErrors((prev) => ({ ...prev, otp: 'Invalid OTP format' }));
      toast.error('Invalid OTP format', {
        style: { fontSize: '12px', background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors((prev) => ({ ...prev, email: '', otp: '' }));
    setLoading(true);

    if (!isValidEmail(email)) {
      setFieldErrors((prev) => ({ ...prev, email: 'Please enter a valid email address.' }));
      toast.error('Invalid email format.', {
        style: { fontSize: '12px', background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      setLoading(false);
      return;
    }

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setFieldErrors((prev) => ({ ...prev, otp: 'Please enter a 6-digit OTP.' }));
      toast.error('Please enter a 6-digit OTP.', {
        style: { fontSize: '12px', background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_URL}/auth/verify-otp`, { email, otp: otpCode }, { timeout: 15000 });
      setIsOtpVerified(true);
      toast.success('OTP verified successfully!', {
        style: { fontSize: '12px', background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' },
        icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
      });
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Invalid or expired OTP';
      setError(errorMsg);
      toast.error(errorMsg, {
        style: { fontSize: '12px', background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    setLoading(true);

    if (!isValidPassword(password)) {
      setFieldErrors((prev) => ({
        ...prev,
        password: 'Password must be at least 8 characters long.',
      }));
      toast.error('Password too short.', {
        style: { fontSize: '12px', background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
      toast.error('Passwords do not match.', {
        style: { fontSize: '12px', background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      setLoading(false);
      return;
    }

    try {
      await axios.post(
        `${API_URL}/auth/reset-password`,
        { email, otp: otp.join(''), password },
        { timeout: 15000 }
      );
      toast.success('Password reset successfully! Redirecting to login...', {
        style: { fontSize: '12px', background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' },
        icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
      });
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to reset password';
      setError(errorMsg);
      toast.error(errorMsg, {
        style: { fontSize: '12px', background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError('');
    setFieldErrors((prev) => ({ ...prev, email: '' }));
    setLoading(true);

    if (!isValidEmail(email)) {
      setFieldErrors((prev) => ({ ...prev, email: 'Please enter a valid email address.' }));
      toast.error('Invalid email format.', {
        style: { fontSize: '12px', background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_URL}/auth/resend-otp`, { email }, { timeout: 15000 });
      setOtp(['', '', '', '', '', '']);
      setResendCooldown(60); // 60-second cooldown
      toast.success('New OTP sent to your email!', {
        style: { fontSize: '12px', background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' },
        icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
      });
      inputRefs.current[0]?.focus();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to resend OTP';
      setError(errorMsg);
      toast.error(errorMsg, {
        style: { fontSize: '12px', background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);

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
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-pink-600 p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-md">
              <LockClosedIcon className="h-8 w-8 text-pink-600 dark:text-pink-400" />
            </div>
          </div>
          <h2 className="text-[16px] font-bold text-white">
            {isOtpVerified ? 'Set New Password' : 'Verify OTP'}
          </h2>
          <p className="text-[12px] text-pink-100 mt-2">
            {isOtpVerified
              ? 'Enter your new password'
              : `Enter the 6-digit OTP sent to ${email || 'your email'}`}
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {error && (
            <div
              className="mb-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-3 rounded-r-md"
              role="alert"
              aria-describedby="reset-error"
            >
              <div className="flex items-start">
                <XCircleIcon className="h-4 w-4 text-red-500 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-[12px] text-red-700 dark:text-red-300" id="reset-error">
                  {error}
                </span>
              </div>
            </div>
          )}

          {!isOtpVerified ? (
            <form id="otp-form" onSubmit={handleOtpSubmit} className="space-y-6" noValidate>
              <div>
                <label
                  htmlFor="email"
                  className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center"
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  className="w-full px-3 py-2 text-[12px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  disabled={loading}
                  ref={emailInputRef}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  aria-label="Email address"
                />
                {fieldErrors.email && (
                  <p className="text-[12px] text-red-500 dark:text-red-400 mt-1" id="email-error">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1"
                  id="otp-label"
                >
                  OTP Code
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      ref={(el) => (inputRefs.current[index] = el)}
                      className="w-full aspect-square text-center text-[14px] font-semibold rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                      required
                      disabled={loading}
                      aria-label={`OTP digit ${index + 1}`}
                      aria-describedby={fieldErrors.otp ? 'otp-error' : undefined}
                    />
                  ))}
                </div>
                {fieldErrors.otp && (
                  <p className="text-[12px] text-red-500 dark:text-red-400 mt-1" id="otp-error">
                    {fieldErrors.otp}
                  </p>
                )}
                <div className="mt-3 text-right">
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={loading || !email || resendCooldown > 0}
                    className={`text-[12px] font-medium ${
                      loading || !email || resendCooldown > 0
                        ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'text-pink-600 dark:text-pink-400 hover:text-pink-500 dark:hover:text-pink-300 hover:underline'
                    }`}
                    aria-label="Resend OTP"
                  >
                    {resendCooldown > 0
                      ? `Resend OTP in ${resendCooldown}s`
                      : "Didn't receive code? Resend"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 rounded-md text-[12px] font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-200 flex items-center justify-center ${
                  loading
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
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-6" noValidate>
              <div>
                <label
                  htmlFor="password"
                  className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center"
                >
                  <LockClosedIcon className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    className="w-full px-3 py-2 text-[12px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                    placeholder="At least 8 characters"
                    required
                    minLength="8"
                    disabled={loading}
                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                    aria-label="New password"
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
                {password && (
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
                  htmlFor="confirm-password"
                  className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center"
                >
                  <LockClosedIcon className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }}
                    className="w-full px-3 py-2 text-[12px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                    placeholder="Confirm your password"
                    required
                    minLength="8"
                    disabled={loading}
                    aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
                    aria-label="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? (
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

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 rounded-md text-[12px] font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-200 flex items-center justify-center ${
                  loading
                    ? 'bg-pink-400 cursor-not-allowed'
                    : 'bg-pink-600 hover:bg-pink-700 shadow-sm'
                }`}
                aria-label="Reset password"
              >
                {loading ? (
                  <>
                    <ApiLoader size="small" className="mr-2" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-[12px] font-medium text-pink-600 dark:text-pink-400 hover:text-pink-500 dark:hover:text-pink-300 hover:underline"
              aria-label="Back to login"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;