import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from './AuthContext';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import QRCode from 'react-qr-code';
import * as htmlToImage from 'html-to-image';
import { debounce } from 'lodash';
import {
  ArrowDownTrayIcon,
  ClipboardIcon,
  XMarkIcon,
  TrashIcon,
  EyeIcon,
  CogIcon,
  ExclamationTriangleIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';
import ApiLoader from '../Loader/ApiLoader';

// Generate random 10-character ID
const generateRandomId = () => {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Custom hook for QR code logic
const useQRCode = (user, navigate, API_URL) => {
  const [state, setState] = useState({
    url: 'https://admin.vocalheart.com/formsubmission/',
    qrValue: '',
    qrcodes: [],
    locations: [],
    loading: false,
    formLoading: false,
    error: null,
    isValidUrl: true,
    dialogOpen: false,
    selectedQR: null,
    showDeleteConfirm: false,
    qrToDelete: null,
    failedImages: {},
    imageLoading: {},
  });

  const updateState = (updates) => setState((prev) => ({ ...prev, ...updates }));

  const token = localStorage.getItem('token');
  const authAxios = axios.create({
    headers: { Authorization: `Bearer ${token}` },
  });

  const fetchQRCodes = useCallback(async () => {
    updateState({ loading: true, error: null });
    try {
      const response = await authAxios.get(`${API_URL}/qrcodes`);
      updateState({ qrcodes: response.data.data, loading: false });
    } catch (error) {
      const message =
        error.response?.status === 401 || error.response?.status === 403
          ? 'Your session has expired. Please log in again.'
          : error.response?.data?.message || 'Unable to load your QR codes.';
      updateState({ error: message, loading: false });
      toast.error(message, { 
        icon: <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      }
    }
  }, [navigate, API_URL]);

  const fetchLocations = useCallback(async () => {
    try {
      const response = await authAxios.get(`${API_URL}/locations`);
      const transformed = response.data.result.map((item) => ({
        ...item,
        nameuppercase: item.place_name.toUpperCase(),
      }));
      updateState({ locations: transformed });
    } catch (error) {
      toast.error('Failed to fetch locations', { 
        icon: <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
    }
  }, [API_URL]);

  const deleteQRCode = useCallback(
    async (id) => {
      try {
        await authAxios.delete(`${API_URL}/qrcodes/${id}`);
        updateState({
          qrcodes: state.qrcodes.filter((q) => q.id !== id),
          failedImages: { ...state.failedImages, [id]: undefined },
          imageLoading: { ...state.imageLoading, [id]: undefined },
          dialogOpen: state.selectedQR?.id === id ? false : state.dialogOpen,
          selectedQR: state.selectedQR?.id === id ? null : state.selectedQR,
          showDeleteConfirm: false,
          qrToDelete: null,
        });
        toast.success('QR code deleted! You can now generate a new one.', {
          style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
        });
      } catch {
        toast.error('Failed to delete QR code.', { 
          icon: <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />,
          style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
        });
      }
    },
    [API_URL, state.qrcodes, state.selectedQR, state.failedImages, state.imageLoading]
  );

  const copyToClipboard = useCallback((url) => {
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success('URL copied to clipboard!', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      }))
      .catch(() => toast.error('Failed to copy URL.', {
        icon: <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      }));
  }, []);

  const openQRDialog = useCallback((qr) => {
    updateState({ selectedQR: qr, dialogOpen: true });
  }, []);

  const closeQRDialog = useCallback(() => {
    updateState({ dialogOpen: false, selectedQR: null });
  }, []);

  const handleApplyClick = useCallback(
    (qr) => {
      navigate(`/formsubmission/${qr.code}`);
    },
    [navigate]
  );

  const handleCustomizeClick = useCallback(
    (qr) => {
      navigate(`/a4-customizer/${qr.code}`);
    },
    [navigate]
  );

  const handleImageLoad = useCallback(
    (qrId) => {
      updateState({ imageLoading: { ...state.imageLoading, [qrId]: false } });
    },
    [state.imageLoading]
  );

  const handleImageError = useCallback(
    (qrId) => {
      updateState({
        failedImages: { ...state.failedImages, [qrId]: true },
        imageLoading: { ...state.imageLoading, [qrId]: false },
      });
    },
    [state.failedImages, state.imageLoading]
  );

  return {
    state,
    updateState,
    fetchQRCodes,
    fetchLocations,
    deleteQRCode,
    copyToClipboard,
    openQRDialog,
    closeQRDialog,
    handleApplyClick,
    handleCustomizeClick,
    handleImageLoad,
    handleImageError,
  };
};

export default function QRGenerator() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const {
    state: {
      url,
      qrValue,
      qrcodes,
      locations,
      loading,
      formLoading,
      error,
      isValidUrl,
      dialogOpen,
      selectedQR,
      showDeleteConfirm,
      qrToDelete,
      failedImages,
      imageLoading,
    },
    updateState,
    fetchQRCodes,
    fetchLocations,
    deleteQRCode,
    copyToClipboard,
    openQRDialog,
    closeQRDialog,
    handleApplyClick,
    handleCustomizeClick,
    handleImageLoad,
    handleImageError,
  } = useQRCode(user, navigate, API_URL);

  const urlInputRef = useRef(null);
  const dialogRef = useRef(null);
  const qrRef = useRef(null);
  const hasRefreshed = useRef(false);

  // Debounced URL validation
  const validateUrl = useCallback(
    debounce((value) => {
      const isValid = value.startsWith('https://admin.vocalheart.com/formsubmission/');
      updateState({ isValidUrl: isValid });
      if (value && !isValid) {
        toast.error('URL must start with https://admin.vocalheart.com/formsubmission/', {
          icon: <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />,
          style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
        });
      }
    }, 400),
    []
  );

  // Validate on input
  useEffect(() => {
    validateUrl(url);
  }, [url, validateUrl]);

  // Fetch QR codes and locations on mount
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchQRCodes();
    fetchLocations();
  }, [user, fetchQRCodes, fetchLocations, navigate]);

  // Close dialog if clicked outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target)) {
        closeQRDialog();
      }
    };
    if (dialogOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [dialogOpen, closeQRDialog]);

  // Generate QR code
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (formLoading || qrcodes.length > 0) return;
    if (!isValidUrl) {
      toast.error('Enter a valid URL starting with https://admin.vocalheart.com/formsubmission/', {
        icon: <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
      return;
    }
    if (!user?.id) {
      toast.error('User not authenticated.', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
      return;
    }
    updateState({ formLoading: true });
    try {
      const token = localStorage.getItem('token');
      let randomCode;
      let uniqueCode = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!uniqueCode && attempts < maxAttempts) {
        randomCode = generateRandomId();
        const finalUrl = `${url}${randomCode}`;
        updateState({ qrValue: finalUrl });

        await new Promise((resolve) => setTimeout(resolve, 1000));
        const qrElement = qrRef.current;
        if (!qrElement) {
          throw new Error('QR code element not found');
        }

        // Generate QR code with specific dimensions (300x300)
        const image = await htmlToImage.toPng(qrElement, { width: 300, height: 300 });
        if (!image.startsWith('data:image/png;base64,')) {
          throw new Error('Failed to generate valid QR code image');
        }

        try {
          const response = await axios.post(
            `${API_URL}/qrcodes`,
            { code: randomCode, url: finalUrl, image, userId: user.id },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const newQR = response.data.data;
          uniqueCode = true;

          updateState({ qrcodes: [newQR], qrValue: finalUrl });

          // Automatic download
          const a = document.createElement('a');
          a.href = image;
          a.download = `qrcode-${newQR.code}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          toast.success('QR code created and downloaded successfully!', {
            style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
          });
          openQRDialog(newQR);
          updateState({ url: 'https://admin.vocalheart.com/formsubmission/' });
          urlInputRef.current?.focus();

          // Refresh page once after successful generation
          if (!hasRefreshed.current) {
            hasRefreshed.current = true;
            setTimeout(() => {
              window.location.reload();
            }, 1000); // Delay refresh to allow download to complete
          }
        } catch (err) {
          if (err.response?.status === 409) {
            if (err.response.data.message.includes('User already has a QR code')) {
              toast.error('You already have a QR code. Delete it to create a new one.', {
                icon: <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />,
                style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
              });
              return;
            }
            attempts++;
            continue;
          }
          throw err;
        }
      }

      if (!uniqueCode) {
        throw new Error('Failed to generate a unique code after multiple attempts.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate QR code.', {
        icon: <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
    } finally {
      updateState({ formLoading: false });
    }
  };

  // Manual download
  const handleDownload = async (qr) => {
    try {
      const image =
        qr?.image && !failedImages[qr.id]
          ? qr.image
          : await htmlToImage.toPng(
              document.getElementById(`qr-img-${qr.id}`) ||
                document.getElementById('qr-img-dialog'),
              { width: 300, height: 300 }
            );
      if (!image.startsWith('data:image/png;base64,')) {
        throw new Error('Invalid QR code image format');
      }
      const a = document.createElement('a');
      a.href = image;
      a.download = `qrcode-${qr.code}.png`;
      a.click();
      toast.success('QR code downloaded successfully!', {
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
    } catch {
      toast.error('Failed to download QR code.', { 
        icon: <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 py-6 sm:px-6 lg:px-8 font-[Inter] text-xs antialiased">
      <Toaster 
        position="bottom-right" 
        toastOptions={{ 
          style: { 
            fontSize: '12px', 
            padding: '10px 14px',
            borderRadius: '6px',
            background: '#ffffff',
            color: '#1e293b',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
          success: { iconTheme: { primary: '#4f46e5', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }} 
      />
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              QR Code Generator
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-xs">
              Create and customize QR codes for seamless form submissions
            </p>
          </div>
        </div>

        {/* Generation Form */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <label
                htmlFor="url"
                className="block font-medium text-slate-900 dark:text-slate-100 mb-2 text-xs"
              >
                Form Submission URL
              </label>
              <div className="relative">
                {/* <input
                  id="url"
                  ref={urlInputRef}
                  type="url"
                  value={url}
                  onChange={(e) => updateState({ url: e.target.value })}
                  placeholder="https://admin.vocalheart.com/formsubmission/"
                  className={`w-full px-3 py-2.5 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 border ${
                    isValidUrl ? 'border-slate-300 dark:border-slate-600' : 'border-red-500'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all duration-200 text-xs`}
                  required
                  disabled={qrcodes.length > 0 || formLoading}
                  aria-describedby={isValidUrl ? undefined : 'url-error'}
                /> */}
                {!isValidUrl && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ExclamationTriangleIcon className="h-3.5 w-3.5 text-red-500" />
                  </div>
                )}
              </div>
              {!isValidUrl && (
                <p id="url-error" className="mt-1.5 text-red-500 dark:text-red-400 text-xs">
                  URL must start with https://admin.vocalheart.com/formsubmission/
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              <button
                type="submit"
                disabled={formLoading || !isValidUrl || !user || qrcodes.length > 0}
                className="w-full sm:w-auto px-4 py-2.5 bg-indigo-500  text-white rounded-md hover:bg-gradient-to-r hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs flex items-center justify-center"
                aria-label="Generate QR code"
              >
                {formLoading ? (
                  <>
                    <ApiLoader size="small" />
                    <span className="ml-2">Generating...</span>
                  </>
                ) : (
                  <>
                    <QrCodeIcon className="w-3.5 h-3.5 mr-1.5" />
                    Generate QR Code
                  </>
                )}
              </button>
              
              {qrcodes.length > 0 && (
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  You already have a QR code. Delete it to generate a new one.
                  <span className="text-red-500 dark:text-red-400 block mt-0.5">
                    Note: Deleting will also remove associated form submission data.
                  </span>
                </p>
              )}
            </div>
            
            {qrValue && (
              <div
                id="qr-img"
                className="mx-auto mt-5 p-3 bg-white dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600"
                ref={qrRef}
              >
                <QRCode
                  value={qrValue}
                  size={256}
                  className="w-64 h-64"
                />
              </div>
            )}
          </form>
        </div>

        {/* QR Code Dialog */}
        {dialogOpen && selectedQR && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <div 
              className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 max-w-md w-full mx-4"
              ref={dialogRef}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wide">
                  Your QR Code
                </h3>
                <button
                  onClick={closeQRDialog}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  aria-label="Close dialog"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex justify-center mb-4">
                {selectedQR.image && !failedImages[selectedQR.id] ? (
                  imageLoading[selectedQR.id] ? (
                    <div className="w-64 h-64 flex justify-center items-center">
                      <ApiLoader size="medium" />
                    </div>
                  ) : (
                    <img
                      src={selectedQR.image}
                      alt={`QR Code ${selectedQR.code}`}
                      className="w-64 h-64 object-contain rounded-md"
                      onLoad={() => handleImageLoad(selectedQR.id)}
                      onError={() => handleImageError(selectedQR.id)}
                    />
                  )
                ) : (
                  <div id="qr-img-dialog" className="p-2 bg-white dark:bg-slate-700 rounded-md">
                    <QRCode
                      value={selectedQR.url}
                      size={240}
                    />
                  </div>
                )}
              </div>
              
              <p className="text-center text-slate-500 dark:text-slate-400 truncate mb-4 text-xs px-2 py-1.5 bg-slate-50 dark:bg-slate-700 rounded-md">
                {selectedQR.url}
              </p>
              
              <p className="text-center text-slate-600 dark:text-slate-300 mb-4 text-xs">
                Customize your QR code to match your brand or form design!
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCustomizeClick(selectedQR)}
                  className="px-3 py-2 bg-indigo-500 text-white rounded-md hover:bg-gradient-to-r hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 text-xs font-medium flex items-center justify-center"
                  aria-label="Customize QR Code and Form"
                >
                  <CogIcon className="w-3.5 h-3.5 mr-1.5" />
                  Customize
                </button>
                
                <button
                  onClick={() => copyToClipboard(selectedQR.url)}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md flex items-center justify-center text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
                  aria-label="Copy URL"
                >
                  <ClipboardIcon className="w-3.5 h-3.5 mr-1.5" />
                  Copy URL
                </button>
                
                <button
                  onClick={() => handleDownload(selectedQR)}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md flex items-center justify-center text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
                  aria-label="Download QR code"
                >
                  <ArrowDownTrayIcon className="w-3.5 h-3.5 mr-1.5" />
                  Download
                </button>
                
                <button
                  onClick={() => updateState({ qrToDelete: selectedQR.id, showDeleteConfirm: true })}
                  className="px-3 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500 rounded-md flex items-center justify-center text-xs hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                  aria-label="Delete QR code"
                >
                  <TrashIcon className="w-3.5 h-3.5 mr-1.5" />
                  Delete
                </button>
                
                <button
                  onClick={() => handleApplyClick(selectedQR)}
                  className="col-span-2 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white rounded-md hover:bg-gradient-to-r hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 text-xs font-medium"
                  aria-label="Apply QR code"
                >
                  Apply QR Code
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 max-w-md w-full mx-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-xs uppercase tracking-wide">
                Confirm Deletion
              </h3>
              
              <p className="text-slate-600 dark:text-slate-400 mb-5 text-xs leading-relaxed">
                Are you sure you want to delete this QR code? This action will also remove associated form submission data and cannot be undone.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <button
                  onClick={() => updateState({ showDeleteConfirm: false, qrToDelete: null })}
                  className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors duration-200 text-xs"
                  aria-label="Cancel"
                >
                  Cancel
                </button>
                
                <button
                  onClick={() => deleteQRCode(qrToDelete)}
                  className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 text-xs font-medium"
                  aria-label="Delete QR code"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Codes List */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <ApiLoader />
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-center">
            <p className="text-slate-500 dark:text-slate-300 text-xs">{error}</p>
          </div>
        ) : qrcodes.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-slate-400 dark:text-slate-400 mb-3">
              <QrCodeIcon className="w-12 h-12 mx-auto opacity-50" />
            </div>
            <p className="text-slate-500 dark:text-slate-300 text-xs">
              No QR codes found. Generate one to get started!
            </p>
          </div>
        ) : (
          <div>
            <h2 className="font-medium text-slate-900 dark:text-slate-100 mb-4 text-xs uppercase tracking-wide">
              Your QR Codes ({qrcodes.length})
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {qrcodes.map((qr) => (
                <div
                  key={qr.id}
                  className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                  onClick={() => openQRDialog(qr)}
                  role="button"
                  aria-label={`View QR code ${qr.code}`}
                >
                  <div
                    id={`qr-img-${qr.id}`}
                    className="mx-auto p-2 bg-white dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 mb-3"
                  >
                    {qr.image && !failedImages[qr.id] ? (
                      imageLoading[qr.id] ? (
                        <div className="w-32 h-32 flex justify-center items-center">
                          <ApiLoader size="small" />
                        </div>
                      ) : (
                        <img
                          src={qr.image}
                          alt={`QR Code ${qr.code}`}
                          className="mx-auto w-32 h-32 object-contain rounded-md"
                          onLoad={() => handleImageLoad(qr.id)}
                          onError={() => handleImageError(qr.id)}
                        />
                      )
                    ) : (
                      <QRCode
                        value={qr.url}
                        size={128}
                        className="mx-auto w-32 h-32"
                      />
                    )}
                  </div>
                  
                  <p className="text-center font-medium text-slate-900 dark:text-slate-100 truncate mb-3 text-xs">
                    {qr.code}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCustomizeClick(qr);
                      }}
                      className="px-2 py-1.5 bg-indigo-500 text-white rounded-md hover:bg-gradient-to-r hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors duration-200 text-xs flex items-center justify-center"
                      aria-label="Customize QR Code and Form"
                    >
                      <CogIcon className="w-3 h-3 mr-1" />
                      Customize
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(qr.url);
                      }}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-200"
                      aria-label="Copy URL"
                    >
                      <ClipboardIcon className="w-3 h-3 mr-1" />
                      Copy
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(qr);
                      }}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-200"
                      aria-label="Download QR code"
                    >
                      <ArrowDownTrayIcon className="w-3 h-3 mr-1" />
                      Download
                    </button>
                    {/*  dont remove cooments  others delete buttons will not hide */}
                    {/* <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateState({ qrToDelete: qr.id, showDeleteConfirm: true });
                      }}
                      className="px-2 py-1.5 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500 rounded-md flex items-center justify-center text-xs hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                      aria-label="Delete QR code"
                    >
                      <TrashIcon className="w-3 h-3 mr-1" />
                      Delete
                    </button> */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}