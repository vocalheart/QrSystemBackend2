import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { CartContext } from '../Contex/NotificationConterContex.jsx';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  DocumentArrowUpIcon,
  MapPinIcon,
  UserIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import ApiLoader from '../Loader/ApiLoader';

export default function QRForm() {
  const { id: code } = useParams();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const { fetchNotificationCounter } = useContext(CartContext);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    reason: '',
    application_type: '',
    resume: null,
  });

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [dataError, setDataError] = useState(null);

  // Location state
  const [userLocation, setUserLocation] = useState(null);
  const [withinRange, setWithinRange] = useState(null); // null means not checked
  const [requiresLocation, setRequiresLocation] = useState(false);
  const [locationRetries, setLocationRetries] = useState(0);
  const [permissionState, setPermissionState] = useState(null);

  // Data state
  const [applicationTypes, setApplicationTypes] = useState([]);

  // Fetch application types
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const response = await axios.get(`${API_URL}/qrcodes/${code}/data`, {
          timeout: 15000,
        });

        setApplicationTypes(response.data.applicationTypes || []);

        // Set default values if available
        setFormData((prev) => ({
          ...prev,
          application_type: response.data.applicationTypes[0]?.name || '',
        }));

        if (!response.data.applicationTypes.length) {
          setDataError('No application types available for this QR code.');
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Failed to load form data. Please try again.';
        setDataError(errorMsg);
        showErrorToast(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, [code, API_URL]);

  // Check geolocation permission state
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setPermissionState(result.state);
          result.onchange = () => setPermissionState(result.state);
        })
        .catch(() => {});
    }
  }, []);

  // Check if location validation is required and validate
  useEffect(() => {
    const checkAndValidateLocation = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/qrcodes/${code}/location`, {
          timeout: 15000,
        });

        if (response.data.required) {
          setRequiresLocation(true);
          await getAndValidateUserLocation();
        } else {
          setWithinRange(true);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setWithinRange(true);
          setRequiresLocation(false);
        } else {
          const errorMsg = err.response?.data?.message || 'Failed to check location requirements.';
          setLocationError(errorMsg);
          showErrorToast(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAndValidateLocation();
  }, [code, API_URL]);

  // Get and validate user's current location
  const getAndValidateUserLocation = async () => {
    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by your browser.';
      setLocationError(errorMsg);
      showErrorToast(errorMsg);
      setWithinRange(false);
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      setUserLocation({ latitude, longitude });

      // Validate on server
      const validationResponse = await axios.post(
        `${API_URL}/qrcodes/validate/${code}`,
        { latitude, longitude },
        { timeout: 15000 }
      );

      setWithinRange(validationResponse.data.withinRange);
      if (!validationResponse.data.withinRange) {
        const errorMsg = validationResponse.data.message || 'You are not within the allowed range.';
        setLocationError(errorMsg);
        showErrorToast(errorMsg);
      }
    } catch (err) {
      let errorMsg = 'Unable to retrieve or validate your location.';
      if (err.code === err.PERMISSION_DENIED) {
        errorMsg = 'Location access was denied. Please enable it in your browser settings to continue.';
      } else if (err.code === err.TIMEOUT) {
        errorMsg = 'Location request timed out. Please try again.';
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        errorMsg = 'Location information is unavailable. Please check your connection or try again.';
      } else if (err.response) {
        errorMsg = err.response.data.message || 'Validation failed. Please try again.';
      }

      setLocationError(errorMsg);
      showErrorToast(errorMsg);
      setWithinRange(false);
    } finally {
      setLocationLoading(false);
    }
  };

  // Toast utilities
  const showErrorToast = (message) => {
    toast.error(message, {
      style: {
        background: '#FEE2E2',
        color: '#B91C1C',
        border: '1px solid #FECACA',
        fontSize: '12px',
      },
      icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
    });
  };

  const showSuccessToast = (message) => {
    toast.success(message, {
      style: {
        background: '#D1FAE5',
        color: '#065F46',
        border: '1px solid #A7F3D0',
        fontSize: '12px',
      },
      icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
    });
  };

  // Form handlers
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'resume') {
      const file = files[0];
      if (!file) return;

      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!validTypes.includes(file.type)) {
        showErrorToast('Only PDF, DOC, or DOCX files are allowed.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showErrorToast('File size exceeds 5MB limit.');
        return;
      }

      setFormData({ ...formData, resume: file });
    } else {
      setFormData({ ...formData, [name]: value.trim() });
    }
  };

  const isFormValid = () => {
    const { name, email, application_type } = formData;
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    return name.trim() && emailValid && application_type.trim() && applicationTypes.length > 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (requiresLocation && withinRange === false) {
      showErrorToast(locationError || 'You are not within the allowed range.');
      return;
    }

    if (requiresLocation && withinRange === null) {
      showErrorToast('Location verification required. Please allow location access.');
      return;
    }

    if (!isFormValid()) {
      showErrorToast('Please fill in all required fields with valid data.');
      return;
    }

    setSubmitting(true);

    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('email', formData.email);
      form.append('reason', formData.reason);
      form.append('application_type', formData.application_type);

      if (formData.resume) {
        form.append('resume', formData.resume);
      }

      if (userLocation) {
        form.append('latitude', userLocation.latitude);
        form.append('longitude', userLocation.longitude);
      }

      const response = await axios.post(`${API_URL}/form/${code}/submit`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 20000,
      });

      showSuccessToast('Form submitted successfully!');

      setFormData({
        name: '',
        email: '',
        reason: '',
        application_type: applicationTypes[0]?.name || '',
        resume: null,
      });

      fetchNotificationCounter();

      setTimeout(() => navigate(`/pass/${response.data.user_id}`), 1500);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit form. Please try again.';
      showErrorToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryLocation = () => {
    if (locationRetries >= 3) {
      showErrorToast('Maximum retries reached. Please check your settings and try again later.');
      return;
    }
    setLocationRetries((prev) => prev + 1);
    getAndValidateUserLocation();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-6 font-roboto text-[12px] antialiased">
        <div className="flex flex-col items-center gap-4">
          <ApiLoader />
          <div className="text-center space-y-2">
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              Loading form and checking requirements
            </p>
            <p className="text-[12px] text-gray-500 dark:text-gray-400">
              Please ensure location services are enabled if prompted
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Location error or validation failed state
  if (requiresLocation && (locationError || withinRange === false || withinRange === null)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-6 font-roboto text-[12px] antialiased">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-500 dark:text-red-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-[14px] font-bold text-gray-900 dark:text-white">
              {locationLoading ? 'Verifying Location...' : 'Location Verification Required'}
            </h2>
            <p className="text-[12px] text-gray-600 dark:text-gray-400" id="location-error">
              {locationError || 'We need to verify your location to submit this form.'}
            </p>
            {locationError?.includes('denied') && (
              <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-2">
                To enable location access:<br />
                - Chrome: Settings &gt; Privacy and security &gt; Site settings &gt; Location<br />
                - Firefox: about:preferences#privacy &gt; Permissions &gt; Location<br />
                - Safari: Settings &gt; Websites &gt; Location<br />
                Allow access for this site and refresh the page.
              </p>
            )}
          </div>
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleRetryLocation}
              disabled={locationLoading}
              className={`flex items-center justify-center px-4 py-2 text-[12px] font-medium rounded-md transition-all duration-200 ${
                locationLoading
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-pink-600 hover:bg-pink-700 text-white shadow-sm'
              }`}
              aria-label={locationLoading ? 'Verifying location' : 'Verify location'}
            >
              {locationLoading ? (
                <ApiLoader size="small" className="mr-2" />
              ) : (
                <MapPinIcon className="w-4 h-4 mr-2" />
              )}
              {locationLoading ? 'Verifying...' : 'Verify Location'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-[12px] text-pink-600 dark:text-pink-400 hover:underline"
              aria-label="View all locations"
            >
              View app
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main form render
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 flex items-center justify-center font-roboto text-[12px] antialiased">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: { fontSize: '12px' },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />

      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="relative bg-pink-600 p-4 sm:p-6">
          <div className="absolute top-4 right-4">
            <button
              onClick={() => navigate('/')}
              className="p-1 rounded-full hover:bg-pink-700 transition-all duration-200 text-white"
              aria-label="Close form"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-md backdrop-blur-sm">
              <DocumentArrowUpIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-white">Application Form</h2>
              <p className="text-[12px] text-pink-100">QR Code: {code}</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {submitting && (
          <div className="relative h-1 bg-gray-200 dark:bg-gray-700">
            <div className="absolute top-0 left-0 h-full bg-pink-500 animate-[progress_3s_linear] w-full"></div>
          </div>
        )}

        {/* Form content */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Error messages */}
          {dataError && (
            <div
              className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 p-3 rounded-r-md"
              role="alert"
              aria-describedby="data-error"
            >
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
                <p className="ml-2 text-[12px] text-yellow-700 dark:text-yellow-300" id="data-error">
                  {dataError}
                </p>
              </div>
            </div>
          )}

          {/* Main form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-1">
              <label className="flex items-center text-[12px] font-medium text-gray-700 dark:text-gray-300">
                <UserIcon className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" />
                Name <span className="text-pink-500 ml-1">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-[12px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                placeholder="John Doe"
                aria-required="true"
                aria-label="Name"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="flex items-center text-[12px] font-medium text-gray-700 dark:text-gray-300">
                <EnvelopeIcon className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" />
                Email <span className="text-pink-500 ml-1">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-[12px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                placeholder="john@example.com"
                aria-required="true"
                aria-label="Email"
              />
              {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                <p className="text-[12px] text-red-500 dark:text-red-400 mt-1">Please enter a valid email address</p>
              )}
            </div>

            {/* Application Type */}
            <div className="space-y-1">
              <label className="flex items-center text-[12px] font-medium text-gray-700 dark:text-gray-300">
                <DocumentArrowUpIcon className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" />
                Application Type <span className="text-pink-500 ml-1">*</span>
              </label>
              <select
                name="application_type"
                value={formData.application_type}
                onChange={handleChange}
                required
                disabled={applicationTypes.length === 0}
                className="w-full px-3 py-2 text-[12px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                aria-required="true"
                aria-label="Application Type"
              >
                {applicationTypes.length === 0 ? (
                  <option value="">No application types available</option>
                ) : (
                  applicationTypes.map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Reason Field */}
            <div className="space-y-1">
              <label className="flex items-center text-[12px] font-medium text-gray-700 dark:text-gray-300">
                <DocumentArrowUpIcon className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" />
                Reason for Application
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 text-[12px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                placeholder="Briefly describe your reason for applying..."
                aria-label="Reason for application"
              ></textarea>
            </div>

            {/* Resume Upload */}
            <div className="space-y-1">
              <label className="flex items-center text-[12px] font-medium text-gray-700 dark:text-gray-300">
                <DocumentArrowUpIcon className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" />
                Resume (Optional, PDF/DOC/DOCX, Max 5MB)
              </label>
              <div className="flex items-center space-x-3">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    name="resume"
                    accept=".pdf,.doc,.docx"
                    onChange={handleChange}
                    className="hidden"
                    aria-label="Upload resume"
                  />
                  <div className="px-3 py-2 text-[12px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 text-center">
                    {formData.resume ? formData.resume.name : 'Choose file'}
                  </div>
                </label>
                {formData.resume && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, resume: null })}
                    className="p-1.5 text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                    aria-label="Remove resume"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
              {formData.resume && (
                <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1">
                  Selected: {formData.resume.name} ({(formData.resume.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {/* Form Actions */}
            <div className="pt-3 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                type="submit"
                disabled={submitting || !isFormValid()}
                className={`flex-1 flex items-center justify-center px-4 py-2 text-[12px] font-medium rounded-md transition-all duration-200 ${
                  submitting || !isFormValid()
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-pink-600 hover:bg-pink-700 text-white shadow-sm'
                }`}
                aria-label={submitting ? 'Submitting application' : 'Submit application'}
              >
                {submitting ? (
                  <ApiLoader size="small" className="mr-2" />
                ) : (
                  <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                )}
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/locations')}
                className="flex-1 flex items-center justify-center px-4 py-2 text-[12px] font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-all duration-200"
                aria-label="Cancel"
              >
                <XMarkIcon className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}