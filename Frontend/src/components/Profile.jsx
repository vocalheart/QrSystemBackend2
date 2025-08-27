import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from './AuthContext';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import {
  UserCircleIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  GlobeAltIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import ApiLoader from '../Loader/ApiLoader';

function Profile() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  // Consolidated state management
  const [state, setState] = useState({
    userData: null,
    loading: true,
    error: null,
    activeTab: 'overview',
    isRefreshing: false,
  });

  const updateState = (updates) => setState((prev) => ({ ...prev, ...updates }));

  const fetchUserProfile = async () => {
    try {
      updateState({ loading: true, error: null });
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await axios.get(`${API_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const currentUser = response.data.data.find((u) => u.email === user.email);
      if (!currentUser) throw new Error('User not found');

      updateState({ userData: currentUser, loading: false });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to load profile data.';
      updateState({ error: errorMsg, loading: false });
      toast.error(errorMsg, { icon: <ExclamationTriangleIcon className="h-5 w-5 text-red-500" /> });
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      }
    }
  };

  const handleRefresh = async () => {
    updateState({ isRefreshing: true });
    await fetchUserProfile();
    updateState({ isRefreshing: false });
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserProfile();
  }, [user, navigate]);

  const handleTabChange = (tab) => {
    updateState({ activeTab: tab });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 sm:px-6 lg:px-8 font-roboto text-[12px] antialiased">
      <Toaster position="top-right" toastOptions={{ style: { fontSize: "12px" } }} />

      <div className="max-w-full sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
        {/* Header with breadcrumbs */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-4">
          <div>
            <nav className="flex mb-2 sm:mb-0" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li>
                  <a href="#" className="text-[12px] font-medium text-pink-600 hover:text-pink-700">
                    Home
                  </a>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="ml-2 text-[12px] font-medium text-gray-600 dark:text-gray-400">Profile</span>
                  </div>
                </li>
              </ol>
            </nav>
            <h1 className="text-[12px] font-bold text-gray-900 dark:text-white">My Profile</h1>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/settings')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-[12px] font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
              aria-label="Go to settings"
            >
              <Cog6ToothIcon className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
              Settings
            </button>
            <button
              onClick={handleRefresh}
              className="flex items-center px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              aria-label="Refresh profile"
              disabled={state.loading || state.isRefreshing}
            >
              {state.isRefreshing ? (
                <ApiLoader size="small" />
              ) : (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-1" />
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>

        {state.loading ? (
          <div className="flex justify-center items-center py-6">
            <ApiLoader />
          </div>
        ) : state.error ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-[12px] text-gray-500 dark:text-gray-300">
              {state.error}
            </p>
          </div>
        ) : state.userData ? (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar - Profile Summary */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 sticky top-6">
                <div className="flex flex-col items-center text-center pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative mb-4">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white">
                      <UserCircleIcon className="h-12 w-12" />
                    </div>
                    <span className="absolute bottom-0 right-0 block h-4 w-4 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800"></span>
                  </div>
                  <h2 className="text-[12px] font-bold text-gray-900 dark:text-white">{state.userData.name}</h2>
                  <p className="text-[12px] text-pink-600 dark:text-pink-400 mt-1 flex items-center">
                    <EnvelopeIcon className="mr-1 h-4 w-4" />
                    {state.userData.email}
                  </p>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-2">
                    Member since{' '}
                    {new Date(state.userData.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>

                {/* Navigation */}
                <nav className="mt-6 space-y-1">
                  <button
                    onClick={() => handleTabChange('overview')}
                    className={`w-full flex items-center px-4 py-2 text-[12px] font-medium rounded-md transition-colors ${
                      state.activeTab === 'overview' ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    aria-current={state.activeTab === 'overview' ? 'page' : undefined}
                  >
                    <UserCircleIcon className="h-4 w-4 mr-2" />
                    Overview
                  </button>
                  <button
                    onClick={() => handleTabChange('security')}
                    className={`w-full flex items-center px-4 py-2 text-[12px] font-medium rounded-md transition-colors ${
                      state.activeTab === 'security' ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    aria-current={state.activeTab === 'security' ? 'page' : undefined}
                  >
                    <ShieldCheckIcon className="h-4 w-4 mr-2" />
                    Security
                  </button>
                </nav>

                {/* Quick Actions */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate('/settings')}
                      className="w-full flex items-center justify-between px-4 py-2 text-[12px] font-medium text-pink-700 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded-md transition-colors duration-200"
                      aria-label="Edit profile"
                    >
                      <span>Edit Profile</span>
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => navigate('/settings/security')}
                      className="w-full flex items-center justify-between px-4 py-2 text-[12px] font-medium text-pink-700 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded-md transition-colors duration-200"
                      aria-label="Change password"
                    >
                      <span>Change Password</span>
                      <LockClosedIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
              {/* Overview Tab */}
              {state.activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Welcome Card */}
                  <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg shadow-md p-6 text-white border border-pink-700/20">
                    <h2 className="text-[12px] font-bold mb-2">Welcome back, {state.userData.name.split(' ')[0]}!</h2>
                    <p className="text-[12px] opacity-90">Here's what's happening with your account today.</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <div className="bg-white/20 px-3 py-1.5 rounded-full text-[12px] flex items-center">
                        <ShieldCheckIcon className="h-4 w-4 mr-1 text-white" />
                        Account secured
                      </div>
                      <div className="bg-white/20 px-3 py-1.5 rounded-full text-[12px] flex items-center">
                        <LockClosedIcon className="h-4 w-4 mr-1 text-white" />
                        Member for{' '}
                        {Math.floor((new Date() - new Date(state.userData.created_at)) / (1000 * 60 * 60 * 24 * 30))}{' '}
                        months
                      </div>
                    </div>
                  </div>

                  {/* Personal Information Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-[12px] font-bold text-gray-900 dark:text-white">Personal Information</h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-[12px] font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                          <p className="text-[12px] text-gray-900 dark:text-gray-100 font-medium">{state.userData.name}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[12px] font-medium text-gray-500 dark:text-gray-400">Email Address</label>
                          <p className="text-[12px] text-gray-900 dark:text-gray-100 font-medium">{state.userData.email}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[12px] font-medium text-gray-500 dark:text-gray-400">User ID</label>
                          <p className="text-[12px] text-gray-900 dark:text-gray-100 font-mono">{state.userData.id}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[12px] font-medium text-gray-500 dark:text-gray-400">Member Since</label>
                          <p className="text-[12px] text-gray-900 dark:text-gray-100">
                            {new Date(state.userData.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location & Contact Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-[12px] font-bold text-gray-900 dark:text-white">Location & Contact</h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(state.userData.city || state.userData.region || state.userData.country) && (
                          <div className="space-y-1">
                            <label className="text-[12px] font-medium text-gray-500 dark:text-gray-400 flex items-center">
                              <MapPinIcon className="h-4 w-4 mr-1" />
                              Location
                            </label>
                            <p className="text-[12px] text-gray-900 dark:text-gray-100">
                              {[state.userData.city, state.userData.region, state.userData.country]
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                          </div>
                        )}
                        {state.userData.ip_addresses?.length > 0 && (
                          <div className="space-y-1">
                            <label className="text-[12px] font-medium text-gray-500 dark:text-gray-400 flex items-center">
                              <GlobeAltIcon className="h-4 w-4 mr-1" />
                              Recent IP Addresses
                            </label>
                            <div className="space-y-1">
                              {state.userData.ip_addresses.slice(0, 2).map((ip, index) => (
                                <p key={index} className="text-[12px] text-gray-900 dark:text-gray-100 font-mono">
                                  {ip}
                                </p>
                              ))}
                              {state.userData.ip_addresses.length > 2 && (
                                <p className="text-[12px] text-pink-600 dark:text-pink-400">
                                  +{state.userData.ip_addresses.length - 2} more
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {state.activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Security Status Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-[12px] font-bold text-gray-900 dark:text-white">Security Status</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-1">
                            <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-[12px] font-medium text-gray-900 dark:text-white">Strong Password</p>
                            <p className="text-[12px] text-gray-600 dark:text-gray-400">Your password meets all security requirements</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-1">
                            <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-[12px] font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                            <p className="text-[12px] text-gray-600 dark:text-gray-400">Add an extra layer of security to your account</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          onClick={() => navigate('/settings/security')}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-[12px] font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                          aria-label="Change password"
                        >
                          Change Password
                        </button>
                        <button
                          onClick={() => navigate('/settings/security')}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-[12px] font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                          aria-label="Set up 2FA"
                        >
                          Set Up 2FA
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-[12px] text-gray-500 dark:text-gray-300">
              Profile Not Found. We couldn't retrieve your profile information.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;