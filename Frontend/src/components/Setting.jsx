import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from './AuthContext';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import {
  UserCircleIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import ApiLoader from '../Loader/ApiLoader';

function Setting() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  // State management
  const [state, setState] = useState({
    userData: null,
    loading: true,
    formLoading: false,
    error: null,
    name: '',
    email: '',
    newEmail: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    otp: '',
    profileOtp: '',
    changeEmailOtp: '',
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
    showOtp: false,
    showProfileOtp: false,
    showEmailChange: false,
    activeTab: 'profile',
    passwordStrength: 0,
  });

  const updateState = (updates) => setState((prev) => ({ ...prev, ...updates }));

  const fetchUserProfile = async () => {
    try {
      updateState({ loading: true, error: null });
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const currentUser = response.data.data;
      if (!currentUser || currentUser.email !== user.email) throw new Error('User not found');

      updateState({
        userData: currentUser,
        name: currentUser.name,
        email: currentUser.email,
        loading: false,
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to load profile data.';
      updateState({ error: errorMsg, loading: false });
      toast.error(errorMsg, {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login', { replace: true });
      }
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    fetchUserProfile();
  }, [user, navigate]);

  useEffect(() => {
    if (!state.newPassword) {
      updateState({ passwordStrength: 0 });
      return;
    }

    let strength = 0;
    if (state.newPassword.length >= 8) strength++;
    if (/\d/.test(state.newPassword)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(state.newPassword)) strength++;
    if (/[A-Z]/.test(state.newPassword)) strength++;

    updateState({ passwordStrength: strength });
  }, [state.newPassword]);

  const isValidName = (name) => name.trim().length >= 2;
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleRequestProfileOtp = async () => {
    if (!isValidName(state.name)) {
      toast.error('Name must be at least 2 characters long.', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      return;
    }

    try {
      updateState({ formLoading: true });
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/auth/request-otp`,
        { email: state.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateState({ showProfileOtp: true });
      toast.success('OTP sent to your email for profile update!', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to send OTP.';
      toast.error(errorMsg, {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
    } finally {
      updateState({ formLoading: false });
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!isValidName(state.name)) {
      toast.error('Name must be at least 2 characters long.', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      return;
    }

    if (!state.profileOtp) {
      toast.error('Please enter the OTP.', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      return;
    }

    updateState({ formLoading: true });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/user/${state.userData.id}`,
        { name: state.name, email: state.email, otp: state.profileOtp },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateState({
        userData: response.data.data,
        profileOtp: '',
        showProfileOtp: false,
      });
      toast.success('Profile updated successfully!', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to verify OTP or update profile.';
      toast.error(errorMsg, {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
    } finally {
      updateState({ formLoading: false });
    }
  };

  const handleRequestEmailChangeOtp = async () => {
    if (!isValidEmail(state.newEmail)) {
      toast.error('Please enter a valid new email address.', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      return;
    }

    try {
      updateState({ formLoading: true });
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/auth/request-otp`,
        { email: state.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateState({ showEmailChange: true });
      toast.success('OTP sent to your current email for verification!', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to send OTP.';
      toast.error(errorMsg, {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
    } finally {
      updateState({ formLoading: false });
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    if (!isValidEmail(state.newEmail)) {
      toast.error('Please enter a valid new email address.', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      return;
    }

    if (!state.changeEmailOtp) {
      toast.error('Please enter the OTP.', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      return;
    }

    updateState({ formLoading: true });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/user/${state.userData.id}`,
        { name: state.name, email: state.newEmail, otp: state.changeEmailOtp },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateState({
        userData: response.data.data,
        email: response.data.data.email,
        newEmail: '',
        changeEmailOtp: '',
        showEmailChange: false,
      });
      toast.success('Email updated successfully!', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to verify OTP or update email.';
      toast.error(errorMsg, {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
    } finally {
      updateState({ formLoading: false });
    }
  };

  const handleRequestPasswordOtp = async () => {
    if (!state.currentPassword || !state.newPassword || !state.confirmPassword) {
      toast.error('Please fill in all password fields.', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      return;
    }

    if (state.newPassword !== state.confirmPassword) {
      toast.error('Passwords do not match.', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      return;
    }

    if (state.passwordStrength < 3) {
      toast.error('Please choose a stronger password.', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      return;
    }

    try {
      updateState({ formLoading: true });
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/auth/request-otp`,
        { email: state.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateState({ showOtp: true });
      toast.success('OTP sent to your email for password change!', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to send OTP.';
      toast.error(errorMsg, {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
    } finally {
      updateState({ formLoading: false });
    }
  };

  const handleVerifyOtpAndChangePassword = async (e) => {
    e.preventDefault();
    if (!state.currentPassword || !state.newPassword || !state.confirmPassword) {
      toast.error('Please fill in all password fields.', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      return;
    }

    if (state.newPassword !== state.confirmPassword) {
      toast.error('Passwords do not match.', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      return;
    }

    if (state.passwordStrength < 3) {
      toast.error('Please choose a stronger password.', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      return;
    }

    if (!state.otp) {
      toast.error('Please enter the OTP.', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
      return;
    }

    updateState({ formLoading: true });
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/auth/change-password`,
        {
          currentPassword: state.currentPassword,
          newPassword: state.newPassword,
          confirmPassword: state.confirmPassword,
          otp: state.otp,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Password changed successfully!', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
      });
      updateState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        otp: '',
        showOtp: false,
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to verify OTP or change password.';
      toast.error(errorMsg, {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      });
    } finally {
      updateState({ formLoading: false });
    }
  };

  const passwordStrengthMeter = () => {
    if (!state.newPassword) return null;

    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-green-500'];
    const strengthText = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong'];

    return (
      <div className="mt-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
            Password Strength:{' '}
            <span className={`font-bold ${state.passwordStrength > 2 ? 'text-green-500' : 'text-red-500'}`}>
              {strengthText[state.passwordStrength]}
            </span>
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${strengthColors[state.passwordStrength]} transition-all duration-300`}
            style={{ width: `${(state.passwordStrength / 4) * 100}%` }}
          ></div>
        </div>
        {state.passwordStrength < 3 && (
          <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400 flex items-center">
            <InformationCircleIcon className="inline h-4 w-4 mr-1" />
            Tip: Use at least 8 characters with numbers, special characters, and uppercase letters
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 py-6 sm:px-6 lg:px-8 font-roboto text-[12px] antialiased">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
          success: { iconTheme: { primary: '#4f46e5', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />

      <div className="max-w-full sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-4">
          <div>
            <h1 className="text-[14px] font-bold text-slate-900 dark:text-slate-100">Account Settings</h1>
            <p className="mt-1 text-[12px] text-slate-600 dark:text-slate-300">
              Manage your profile and security preferences
            </p>
          </div>
        </div>

        {state.loading ? (
          <div className="flex justify-center items-center py-6">
            <ApiLoader />
          </div>
        ) : state.error ? (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-center">
            <p className="text-[12px] text-slate-500 dark:text-slate-300">{state.error}</p>
          </div>
        ) : state.userData ? (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-64 flex-shrink-0">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 sticky top-6">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white">
                      <UserCircleIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-[12px] font-medium text-slate-900 dark:text-slate-100 truncate">
                        {state.userData.name}
                      </h3>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate">
                        {state.userData.email}
                      </p>
                    </div>
                  </div>
                </div>
                <nav className="p-4 space-y-1">
                  <button
                    onClick={() => updateState({ activeTab: 'profile' })}
                    className={`w-full flex items-center px-4 py-2 text-[12px] font-medium rounded-md transition-colors duration-200 ${
                      state.activeTab === 'profile'
                        ? 'bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                    aria-current={state.activeTab === 'profile' ? 'page' : undefined}
                  >
                    <UserCircleIcon className="h-4 w-4 mr-2" />
                    Profile
                  </button>
                  <button
                    onClick={() => updateState({ activeTab: 'security' })}
                    className={`w-full flex items-center px-4 py-2 text-[12px] font-medium rounded-md transition-colors duration-200 ${
                      state.activeTab === 'security'
                        ? 'bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                    aria-current={state.activeTab === 'security' ? 'page' : undefined}
                  >
                    <ShieldCheckIcon className="h-4 w-4 mr-2" />
                    Security
                  </button>
                </nav>
              </div>
            </div>

            <div className="flex-1">
              {state.activeTab === 'profile' && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
                  <div className="mb-4">
                    <h2 className="text-[14px] font-bold text-slate-900 dark:text-slate-100 flex items-center">
                      <UserCircleIcon className="h-5 w-5 text-indigo-600 mr-2" />
                      Profile Information
                    </h2>
                    <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                      Update your basic profile details
                    </p>
                  </div>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"
                      >
                        <UserCircleIcon className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-400" />
                        Enter New Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={state.name}
                        onChange={(e) => updateState({ name: e.target.value })}
                        className="w-full px-3 py-2 text-[12px] border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all duration-300"
                        placeholder="Your full name"
                        required
                        disabled={state.formLoading}
                        aria-label="Enter New Name"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"
                      >
                        <EnvelopeIcon className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-400" />
                        Current Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={state.email}
                        readOnly
                        className="w-full px-3 py-2 text-[12px] border border-slate-300 dark:border-slate-600 rounded-md bg-slate-100 dark:bg-slate-600 text-slate-900 dark:text-slate-100 transition-all duration-300"
                        aria-label="Current Email Address"
                      />
                    </div>
                    {state.showProfileOtp && (
                      <div>
                        <label
                          htmlFor="profile-otp"
                          className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-400" />
                          OTP (Sent to your email)
                        </label>
                        <input
                          id="profile-otp"
                          type="text"
                          value={state.profileOtp}
                          onChange={(e) => updateState({ profileOtp: e.target.value })}
                          className="w-full px-3 py-2 text-[12px] border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all duration-300"
                          placeholder="Enter 6-digit OTP"
                          required
                          disabled={state.formLoading}
                          aria-label="Profile OTP"
                        />
                      </div>
                    )}
                    <div className="flex justify-end space-x-2">
                      {!state.showProfileOtp && (
                        <button
                          type="button"
                          onClick={handleRequestProfileOtp}
                          disabled={state.formLoading || !state.name || !isValidName(state.name)}
                          className={`inline-flex items-center px-4 py-2 text-[12px] font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm hover:shadow ${
                            state.formLoading || !state.name || !isValidName(state.name)
                              ? 'bg-indigo-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                          }`}
                          aria-label="Request OTP for Profile"
                        >
                          {state.formLoading ? (
                            <div className="flex items-center">
                              <ApiLoader size="small" className="mr-2" />
                              <span>Requesting...</span>
                            </div>
                          ) : (
                            'Request OTP'
                          )}
                        </button>
                      )}
                      {state.showProfileOtp && (
                        <button
                          type="submit"
                          disabled={state.formLoading || !state.profileOtp}
                          className={`inline-flex items-center px-4 py-2 text-[12px] font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm hover:shadow ${
                            state.formLoading || !state.profileOtp
                              ? 'bg-indigo-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                          }`}
                          aria-label="Update Profile"
                        >
                          {state.formLoading ? (
                            <div className="flex items-center">
                              <ApiLoader size="small" className="mr-2" />
                              <span>Saving...</span>
                            </div>
                          ) : (
                            'Save Changes'
                          )}
                        </button>
                      )}
                    </div>
                  </form>
                  <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
                    <h3 className="text-[14px] font-bold text-slate-900 dark:text-slate-100 mb-2">
                      Change Email Address
                    </h3>
                    <button
                      type="button"
                      onClick={() => updateState({ showEmailChange: true })}
                      className="inline-flex items-center px-4 py-2 text-[12px] font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm hover:shadow"
                      aria-label="Change Email"
                    >
                      Change Email
                    </button>
                    {state.showEmailChange && (
                      <form onSubmit={handleEmailChange} className="mt-4 space-y-4">
                        <div>
                          <label
                            htmlFor="new-email"
                            className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"
                          >
                            <EnvelopeIcon className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-400" />
                            New Email Address
                          </label>
                          <input
                            id="new-email"
                            type="email"
                            value={state.newEmail}
                            onChange={(e) => updateState({ newEmail: e.target.value })}
                            className="w-full px-3 py-2 text-[12px] border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all duration-300"
                            placeholder="Enter new email address"
                            required
                            disabled={state.formLoading}
                            aria-label="New Email Address"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="change-email-otp"
                            className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-400" />
                            OTP (Sent to your current email)
                          </label>
                          <input
                            id="change-email-otp"
                            type="text"
                            value={state.changeEmailOtp}
                            onChange={(e) => updateState({ changeEmailOtp: e.target.value })}
                            className="w-full px-3 py-2 text-[12px] border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all duration-300"
                            placeholder="Enter 6-digit OTP"
                            required
                            disabled={state.formLoading}
                            aria-label="Email Change OTP"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={handleRequestEmailChangeOtp}
                            disabled={state.formLoading || !state.newEmail}
                            className={`inline-flex items-center px-4 py-2 text-[12px] font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm hover:shadow ${
                              state.formLoading || !state.newEmail
                                ? 'bg-indigo-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                            }`}
                            aria-label="Request OTP for Email Change"
                          >
                            {state.formLoading ? (
                              <div className="flex items-center">
                                <ApiLoader size="small" className="mr-2" />
                                <span>Requesting...</span>
                              </div>
                            ) : (
                              'Request OTP'
                            )}
                          </button>
                          <button
                            type="submit"
                            disabled={state.formLoading || !state.changeEmailOtp}
                            className={`inline-flex items-center px-4 py-2 text-[12px] font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm hover:shadow ${
                              state.formLoading || !state.changeEmailOtp
                                ? 'bg-indigo-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                            }`}
                            aria-label="Update Email"
                          >
                            {state.formLoading ? (
                              <div className="flex items-center">
                                <ApiLoader size="small" className="mr-2" />
                                <span>Updating...</span>
                              </div>
                            ) : (
                              'Update Email'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateState({ showEmailChange: false, newEmail: '', changeEmailOtp: '' })
                            }
                            className="inline-flex items-center px-4 py-2 text-[12px] font-medium rounded-md text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                            aria-label="Cancel Email Change"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {state.activeTab === 'security' && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
                  <div className="mb-4">
                    <h2 className="text-[14px] font-bold text-slate-900 dark:text-slate-100 flex items-center">
                      <ShieldCheckIcon className="h-5 w-5 text-indigo-600 mr-2" />
                      Security Settings
                    </h2>
                    <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                      Manage your password and account security
                    </p>
                  </div>
                  <form onSubmit={handleVerifyOtpAndChangePassword} className="space-y-4">
                    <div>
                      <label
                        htmlFor="current-password"
                        className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"
                      >
                        <LockClosedIcon className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-400" />
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          id="current-password"
                          type={state.showCurrentPassword ? 'text' : 'password'}
                          value={state.currentPassword}
                          onChange={(e) => updateState({ currentPassword: e.target.value })}
                          className="w-full px-3 py-2 text-[12px] border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all duration-300"
                          placeholder="Enter current password"
                          required
                          disabled={state.formLoading}
                          aria-label="Current Password"
                        />
                        <button
                          type="button"
                          onClick={() => updateState({ showCurrentPassword: !state.showCurrentPassword })}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          aria-label={state.showCurrentPassword ? 'Hide current password' : 'Show current password'}
                        >
                          {state.showCurrentPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="new-password"
                        className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"
                      >
                        <LockClosedIcon className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-400" />
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          id="new-password"
                          type={state.showNewPassword ? 'text' : 'password'}
                          value={state.newPassword}
                          onChange={(e) => updateState({ newPassword: e.target.value })}
                          className="w-full px-3 py-2 text-[12px] border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all duration-300"
                          placeholder="Enter new password"
                          required
                          disabled={state.formLoading}
                          aria-label="New Password"
                        />
                        <button
                          type="button"
                          onClick={() => updateState({ showNewPassword: !state.showNewPassword })}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          aria-label={state.showNewPassword ? 'Hide new password' : 'Show new password'}
                        >
                          {state.showNewPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordStrengthMeter()}
                    </div>
                    <div>
                      <label
                        htmlFor="confirm-password"
                        className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"
                      >
                        <LockClosedIcon className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-400" />
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          id="confirm-password"
                          type={state.showConfirmPassword ? 'text' : 'password'}
                          value={state.confirmPassword}
                          onChange={(e) => updateState({ confirmPassword: e.target.value })}
                          className="w-full px-3 py-2 text-[12px] border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all duration-300"
                          placeholder="Confirm new password"
                          required
                          disabled={state.formLoading}
                          aria-label="Confirm New Password"
                        />
                        <button
                          type="button"
                          onClick={() => updateState({ showConfirmPassword: !state.showConfirmPassword })}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          aria-label={state.showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {state.showConfirmPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {state.showOtp && (
                      <div>
                        <label
                          htmlFor="otp"
                          className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-400" />
                          OTP (Sent to your email)
                        </label>
                        <input
                          id="otp"
                          type="text"
                          value={state.otp}
                          onChange={(e) => updateState({ otp: e.target.value })}
                          className="w-full px-3 py-2 text-[12px] border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all duration-300"
                          placeholder="Enter 6-digit OTP"
                          required
                          disabled={state.formLoading}
                          aria-label="OTP"
                        />
                      </div>
                    )}
                    <div className="flex justify-end space-x-2">
                      {!state.showOtp && (
                        <button
                          type="button"
                          onClick={handleRequestPasswordOtp}
                          disabled={
                            state.formLoading ||
                            !state.newPassword ||
                            !state.confirmPassword ||
                            state.newPassword !== state.confirmPassword ||
                            state.passwordStrength < 3
                          }
                          className={`inline-flex items-center px-4 py-2 text-[12px] font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm hover:shadow ${
                            state.formLoading ||
                            !state.newPassword ||
                            !state.confirmPassword ||
                            state.newPassword !== state.confirmPassword ||
                            state.passwordStrength < 3
                              ? 'bg-indigo-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                          }`}
                          aria-label="Request OTP for Password"
                        >
                          {state.formLoading ? (
                            <div className="flex items-center">
                              <ApiLoader size="small" className="mr-2" />
                              <span>Requesting...</span>
                            </div>
                          ) : (
                            'Request OTP'
                          )}
                        </button>
                      )}
                      {state.showOtp && (
                        <button
                          type="submit"
                          disabled={state.formLoading || !state.otp}
                          className={`inline-flex items-center px-4 py-2 text-[12px] font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm hover:shadow ${
                            state.formLoading || !state.otp
                              ? 'bg-indigo-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                          }`}
                          aria-label="Change Password"
                        >
                          {state.formLoading ? (
                            <div className="flex items-center">
                              <ApiLoader size="small" className="mr-2" />
                              <span>Updating...</span>
                            </div>
                          ) : (
                            'Update Password'
                          )}
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-center">
            <p className="text-[12px] text-slate-500 dark:text-slate-300">
              No profile data available. We couldn't retrieve your profile information.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Setting;