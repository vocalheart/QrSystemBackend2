import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from './AuthContext';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import QRCode from 'react-qr-code';
import * as htmlToImage from 'html-to-image';
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import jsPDF from 'jspdf';
import {
  ArrowDownTrayIcon,
  PrinterIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  TrashIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
} from '@heroicons/react/24/outline';

const A4Customizer = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { qrCode } = useParams();
  const API_URL = import.meta.env.VITE_API_URL;

  const [state, setState] = useState({
    selectedQR: null,
    loading: false,
    error: null,
    companyName: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    headerText: 'Submit Your Office Submission',
    tagline: 'Your input is valuable to us!',
    logo: null,
    a4Loading: false,
    previewScale: window.innerWidth < 640 ? 0.3 : 0.6, // Adjusted for mobile
    showAdvanced: false,
    a4Styles: {
      primaryColor: '#db2777', // Pink
      secondaryColor: '#ffffff',
      fontFamily: 'Inter', // Modern font
      layout: 'centered',
      headerAlignment: 'center', // New: Separate header alignment
      contentAlignment: 'center', // New: Separate content alignment
      footerAlignment: 'center', // New: Separate footer alignment
      logoPosition: 'left', // New: Logo position
      qrAlignment: 'center',
      qrCornerStyle: 'square', // New: QR corner style
      backgroundPattern: 'none',
      qrFgColor: '#000000',
      qrBgColor: '#ffffff',
      headerFontSize: 30,
      bodyFontSize: 16,
      footerFontSize: 16,
      qrSize: 256,
      qrPadding: 16,
      qrBorderWidth: 4,
      qrBorderStyle: 'solid',
      logoMaxHeight: 80,
      qrGradient: false,
      headerFontWeight: 'bold',
      bodyFontWeight: 'normal',
      footerFontWeight: 'medium',
      exportQuality: 'high',
    },
    failedImage: false,
    savedTemplates: [],
    activeTab: 'content',
    history: [],
    historyIndex: -1,
    isDragging: false,
  });
  const defaultState = { ...state };
  const updateState = (updates) => {
    setState((prev) => {
      const newState = { ...prev, ...updates };
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newState);
      return { ...newState, history: newHistory, historyIndex: newHistory.length - 1 };
    });
  };
  const a4PreviewRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const token = localStorage.getItem('token');
  const authAxios = axios.create({
    headers: { Authorization: `Bearer ${token}` },
  });

  const handleUndo = () => {
    if (state.historyIndex > 0) {
      const prevState = state.history[state.historyIndex - 1];
      setState({ ...prevState, history: state.history, historyIndex: state.historyIndex - 1 });
      toast.success('Undo successful', { duration: 3000 });
    }
  };

  const handleRedo = () => {
    if (state.historyIndex < state.history.length - 1) {
      const nextState = state.history[state.historyIndex + 1];
      setState({ ...nextState, history: state.history, historyIndex: state.historyIndex + 1 });
      toast.success('Redo successful', { duration: 3000 });
    }
  };

  const fetchQRCode = useCallback(async () => {
    updateState({ loading: true, error: null });
    try {
      const response = await authAxios.get(`${API_URL}/qrcodes`);
      const qr = response.data.data.find((q) => q.code === qrCode);
      if (!qr) {
        throw new Error('QR code not found');
      }
      updateState({ selectedQR: qr, loading: false });
    } catch (error) {
      const message =
        error.response?.status === 401 || error.response?.status === 403
          ? 'Your session has expired. Please log in again.'
          : error.response?.data?.message || 'Unable to load QR code.';
      updateState({ error: message, loading: false });
      toast.error(message, { duration: 3000 });
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      }
    }
  }, [qrCode, navigate, API_URL]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchQRCode();
    const savedTemplates = JSON.parse(localStorage.getItem('a4Templates') || '[]');
    if (savedTemplates.length > 0) {
      updateState({ savedTemplates });
      updateState({ ...savedTemplates[0] });
    }
    const handleResize = () => {
      updateState({ previewScale: window.innerWidth < 640 ? 0.3 : 0.6 });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [user, fetchQRCode, navigate]);

  const handleImageError = useCallback(() => {
    updateState({ failedImage: true });
  }, []);

  const handleLogoUpload = (file) => {
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo size should be less than 2MB', { duration: 3000 });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateState({ logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    updateState({ isDragging: true });
  };

  const handleDragLeave = () => {
    updateState({ isDragging: false });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    updateState({ isDragging: false });
    const file = e.dataTransfer.files[0];
    handleLogoUpload(file);
  };

  const handleSaveTemplate = () => {
    const template = {
      companyName: state.companyName,
      contactPerson: state.contactPerson,
      contactEmail: state.contactEmail,
      contactPhone: state.contactPhone,
      headerText: state.headerText,
      tagline: state.tagline,
      logo: state.logo,
      a4Styles: state.a4Styles,
      createdAt: new Date().toISOString(),
    };
    const updatedTemplates = [
      template,
      ...state.savedTemplates.filter(
        (t) => t.companyName !== state.companyName || t.contactPerson !== state.contactPerson
      ).slice(0, 4),
    ];
    localStorage.setItem('a4Templates', JSON.stringify(updatedTemplates));
    updateState({ savedTemplates: updatedTemplates });
    toast.success('Template saved!', { duration: 3000 });
  };

  const handleLoadTemplate = (template) => {
    updateState({
      companyName: template.companyName,
      contactPerson: template.contactPerson,
      contactEmail: template.contactEmail,
      contactPhone: template.contactPhone,
      headerText: template.headerText,
      tagline: template.tagline,
      logo: template.logo,
      a4Styles: template.a4Styles,
    });
    toast.success('Template loaded!', { duration: 3000 });
  };

  const handleDeleteTemplate = (index) => {
    const updatedTemplates = state.savedTemplates.filter((_, i) => i !== index);
    localStorage.setItem('a4Templates', JSON.stringify(updatedTemplates));
    updateState({ savedTemplates: updatedTemplates });
    toast.success('Template deleted!', { duration: 3000 });
  };

  const handleReset = () => {
    updateState({
      companyName: defaultState.companyName,
      contactPerson: defaultState.contactPerson,
      contactEmail: defaultState.contactEmail,
      contactPhone: defaultState.contactPhone,
      headerText: defaultState.headerText,
      tagline: defaultState.tagline,
      logo: defaultState.logo,
      a4Styles: defaultState.a4Styles,
    });
    toast.success('Template reset to default!', { duration: 3000 });
  };

  const handleZoomIn = () => {
    updateState({ previewScale: Math.min(state.previewScale + 0.1, 1.2) });
  };

  const handleZoomOut = () => {
    updateState({ previewScale: Math.max(state.previewScale - 0.1, 0.2) });
  };

  const handleDownloadA4 = async () => {
    if (!a4PreviewRef.current) return;
    updateState({ a4Loading: true });
    try {
      const quality = { low: 0.5, medium: 0.75, high: 1 }[state.a4Styles.exportQuality];
      const dataUrl = await htmlToImage.toPng(a4PreviewRef.current, {
        quality,
        pixelRatio: 3,
        backgroundColor: state.a4Styles.secondaryColor,
      });
      const link = document.createElement('a');
      link.download = `office-submission-${state.companyName || 'form'}-${new Date()
        .toISOString()
        .slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('A4 page downloaded!', { duration: 3000 });
    } catch (error) {
      toast.error('Failed to generate A4 page', { duration: 3000 });
      console.error('Download error:', error);
    } finally {
      updateState({ a4Loading: false });
    }
  };

  const handleDownloadPDF = async () => {
    if (!a4PreviewRef.current) return;
    updateState({ a4Loading: true });
    try {
      const quality = { low: 0.5, medium: 0.75, high: 1 }[state.a4Styles.exportQuality];
      const dataUrl = await htmlToImage.toPng(a4PreviewRef.current, {
        quality,
        pixelRatio: 3,
        backgroundColor: state.a4Styles.secondaryColor,
      });
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`office-submission-${state.companyName || 'form'}-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('A4 page downloaded as PDF!', { duration: 3000 });
    } catch (error) {
      toast.error('Failed to generate PDF', { duration: 3000 });
      console.error('PDF error:', error);
    } finally {
      updateState({ a4Loading: false });
    }
  };

  const handlePrintA4 = () => {
    if (!a4PreviewRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocker prevented opening print window. Please allow popups for this site.', {
        duration: 3000,
      });
      return;
    }
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Office Submission Form - ${state.companyName || 'VocalHeart'}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; font-family: ${state.a4Styles.fontFamily}, sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .a4-container {
              width: 210mm; height: 297mm; background-color: ${state.a4Styles.secondaryColor}; padding: 20mm; box-sizing: border-box;
              ${
                state.a4Styles.backgroundPattern === 'dots'
                  ? `background-image: radial-gradient(${state.a4Styles.primaryColor}33 1px, transparent 1px); background-size: 10px 10px;`
                  : state.a4Styles.backgroundPattern === 'lines'
                  ? `background-image: repeating-linear-gradient(0deg, ${state.a4Styles.primaryColor}33, ${state.a4Styles.primaryColor}33 1px, transparent 1px, transparent 20px);`
                  : ''
              }
            }
            .header {
              display: flex; justify-content: ${state.a4Styles.headerAlignment}; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid ${state.a4Styles.primaryColor};
            }
            .header img { max-height: ${state.a4Styles.logoMaxHeight}px; max-width: 200px; object-fit: contain; }
            .header h1 { color: ${state.a4Styles.primaryColor}; font-size: ${state.a4Styles.headerFontSize}px; font-weight: ${state.a4Styles.headerFontWeight}; margin: 0; }
            .header p { color: #4b5563; font-size: 14px; margin: 4px 0; }
            .content { text-align: ${state.a4Styles.contentAlignment}; margin-bottom: 32px; }
            .content h2 { color: ${state.a4Styles.primaryColor}; font-size: ${state.a4Styles.headerFontSize}px; font-weight: ${state.a4Styles.headerFontWeight}; margin-bottom: 16px; }
            .content p { color: #4b5563; font-size: ${state.a4Styles.bodyFontSize}px; font-weight: ${state.a4Styles.bodyFontWeight}; max-width: 400px; margin: 0 auto 24px auto; line-height: 1.5; }
            .qr-container { display: flex; justify-content: ${state.a4Styles.qrAlignment}; margin-bottom: 32px; }
            .qr-container img, .qr-container div { border: ${state.a4Styles.qrBorderWidth}px ${state.a4Styles.qrBorderStyle} ${state.a4Styles.primaryColor}; padding: ${state.a4Styles.qrPadding}px; background-color: ${state.a4Styles.qrBgColor}; width: ${state.a4Styles.qrSize}px; height: ${state.a4Styles.qrSize}px; border-radius: ${state.a4Styles.qrCornerStyle === 'rounded' ? '12px' : '0'}; }
            .instructions { display: inline-block; max-width: 400px; padding: 24px; border: 1px solid ${state.a4Styles.primaryColor}; background-color: ${state.a4Styles.primaryColor}10; border-radius: 12px; }
            .instructions p { color: #374151; font-size: ${state.a4Styles.bodyFontSize}px; font-weight: ${state.a4Styles.bodyFontWeight}; margin-bottom: 12px; }
            .instructions ol { color: #374151; font-size: ${state.a4Styles.bodyFontSize}px; font-weight: ${state.a4Styles.bodyFontWeight}; list-style: decimal; list-style-position: inside; text-align: ${
              state.a4Styles.contentAlignment === 'centered' ? 'left' : state.a4Styles.contentAlignment
            }; margin: 0; padding: 0; line-height: 1.5; }
            .instructions li { margin-bottom: 8px; }
            .footer { margin-top: 48px; padding-top: 16px; border-top: 2px solid ${state.a4Styles.primaryColor}; text-align: ${state.a4Styles.footerAlignment}; }
            .footer p { color: #4b5563; font-size: ${state.a4Styles.footerFontSize}px; font-weight: ${state.a4Styles.footerFontWeight}; margin: 0; line-height: 1.5; }
            .footer .powered { color: #9ca3af; font-size: ${state.a4Styles.footerFontSize - 2}px; margin-top: 8px; }
            @media print {
              body, .a4-container { width: 210mm !important; height: 297mm !important; margin: 0 !important; padding: 0 !important; }
              .header, .content, .footer { width: 100%; max-width: none; }
            }
            @media screen and (max-width: 640px) {
              .a4-container { padding: 10mm; }
              .header h1, .content h2 { font-size: calc(${state.a4Styles.headerFontSize}px * 0.8); }
              .content p, .instructions p, .instructions li, .footer p { font-size: calc(${state.a4Styles.bodyFontSize}px * 0.9); }
            }
          </style>
        </head>
        <body>
          ${a4PreviewRef.current ? a4PreviewRef.current.innerHTML : ''}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() { window.close(); }, 100);
              }, 200);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const toggleAdvanced = () => {
    updateState({ showAdvanced: !state.showAdvanced });
  };

  const removeLogo = () => {
    updateState({ logo: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 px-4 sm:px-6 lg:px-8 py-6 font-inter text-sm antialiased">
      <Toaster position="top-right" toastOptions={{ style: { fontSize: '14px', padding: '12px' } }} />
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-4">
            <img
              src="https://i.ibb.co/gbPrfVSB/Whats-App-Image-2025-03-03-at-17-45-28-b944d3a4-removebg-preview-1.png"
              alt="VocalHeart Logo"
              className="mx-auto h-10 sm:h-12 mb-2 transition-transform duration-300 hover:scale-110"
            />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              A4 Office Submission Form Customizer
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Design and download professional QR code forms
            </p>
          </div>
        </div>

        {state.loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-pink-600 dark:border-pink-400"></div>
          </div>
        ) : state.error ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Error
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{state.error}</p>
              </div>
            </div>
          </div>
        ) : state.selectedQR ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Customization Options
                </h2>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleUndo}
                    disabled={state.historyIndex <= 0}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-all flex items-center text-sm"
                  >
                    <ArrowUturnLeftIcon className="w-4 h-4 mr-2" />
                    Undo
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={state.historyIndex >= state.history.length - 1}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-all flex items-center text-sm"
                  >
                    <ArrowUturnRightIcon className="w-4 h-4 mr-2" />
                    Redo
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    className="px-4 py-2 bg-pink-600 dark:bg-pink-500 text-white rounded-lg hover:bg-pink-700 dark:hover:bg-pink-600 transition-all flex items-center text-sm"
                  >
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Save
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center text-sm"
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Reset
                  </button>
                </div>
              </div>

              {state.savedTemplates.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Saved Templates
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {state.savedTemplates.slice(0, 3).map((template, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <button
                          onClick={() => handleLoadTemplate(template)}
                          className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors truncate max-w-[150px] sm:max-w-[180px] flex items-center gap-2"
                          title={template.companyName || 'Untitled Template'}
                        >
                          {template.logo && (
                            <img
                              src={template.logo}
                              alt="Template Preview"
                              className="h-6 w-6 object-contain"
                            />
                          )}
                          {template.companyName || `Template ${index + 1}`}
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(index)}
                          className="p-1.5 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-500"
                          title="Delete template"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-b border-gray-200 dark:border-gray-700 -mb-px flex space-x-4">
                <button
                  onClick={() => updateState({ activeTab: 'content' })}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    state.activeTab === 'content'
                      ? 'border-pink-600 dark:border-pink-400 text-pink-600 dark:text-pink-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Content
                </button>
                <button
                  onClick={() => updateState({ activeTab: 'design' })}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    state.activeTab === 'design'
                      ? 'border-pink-600 dark:border-pink-400 text-pink-600 dark:text-pink-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Design
                </button>
              </div>

              {state.activeTab === 'content' ? (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      placeholder="Your company name"
                      value={state.companyName}
                      onChange={(e) => updateState({ companyName: e.target.value })}
                      className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        placeholder="Name"
                        value={state.contactPerson}
                        onChange={(e) => updateState({ contactPerson: e.target.value })}
                        className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        placeholder="email@company.com"
                        value={state.contactEmail}
                        onChange={(e) => updateState({ contactEmail: e.target.value })}
                        className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (123) 456-7890"
                      value={state.contactPhone}
                      onChange={(e) => updateState({ contactPhone: e.target.value })}
                      className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Header Text
                    </label>
                    <input
                      type="text"
                      placeholder="Form title"
                      value={state.headerText}
                      onChange={(e) => updateState({ headerText: e.target.value })}
                      className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Footer Tagline
                    </label>
                    <input
                      type="text"
                      placeholder="Inspirational message"
                      value={state.tagline}
                      onChange={(e) => updateState({ tagline: e.target.value })}
                      className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-4 text-center ${
                      state.isDragging
                        ? 'border-pink-600 dark:border-pink-400 bg-pink-50 dark:bg-pink-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Company Logo
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e.target.files[0])}
                      className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg file:mr-2 file:py-2 file:px-4 file:border-0 file:text-sm file:font-medium file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-200 hover:file:bg-gray-200 dark:hover:file:bg-gray-600"
                    />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      Drag and drop an image here or click to upload
                    </p>
                    {state.logo && (
                      <div className="flex items-center justify-center gap-3 mt-2">
                        <img
                          src={state.logo}
                          alt="Logo Preview"
                          className="max-h-16 sm:max-h-20 object-contain"
                        />
                        <button
                          onClick={removeLogo}
                          className="p-1.5 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-500"
                          title="Remove logo"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Logo Position
                    </label>
                    <select
                      value={state.a4Styles.logoPosition}
                      onChange={(e) =>
                        updateState({ a4Styles: { ...state.a4Styles, logoPosition: e.target.value } })
                      }
                      className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Primary Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={state.a4Styles.primaryColor}
                          onChange={(e) =>
                            updateState({ a4Styles: { ...state.a4Styles, primaryColor: e.target.value } })
                          }
                          className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 dark:border-gray-600"
                        />
                        <input
                          type="text"
                          value={state.a4Styles.primaryColor}
                          onChange={(e) =>
                            updateState({ a4Styles: { ...state.a4Styles, primaryColor: e.target.value } })
                          }
                          className="flex-1 p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={state.a4Styles.secondaryColor}
                          onChange={(e) =>
                            updateState({ a4Styles: { ...state.a4Styles, secondaryColor: e.target.value } })
                          }
                          className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 dark:border-gray-600"
                        />
                        <input
                          type="text"
                          value={state.a4Styles.secondaryColor}
                          onChange={(e) =>
                            updateState({ a4Styles: { ...state.a4Styles, secondaryColor: e.target.value } })
                          }
                          className="flex-1 p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        QR Foreground
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={state.a4Styles.qrFgColor}
                          onChange={(e) =>
                            updateState({ a4Styles: { ...state.a4Styles, qrFgColor: e.target.value } })
                          }
                          className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 dark:border-gray-600"
                        />
                        <input
                          type="text"
                          value={state.a4Styles.qrFgColor}
                          onChange={(e) =>
                            updateState({ a4Styles: { ...state.a4Styles, qrFgColor: e.target.value } })
                          }
                          className="flex-1 p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        QR Background
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={state.a4Styles.qrBgColor}
                          onChange={(e) =>
                            updateState({ a4Styles: { ...state.a4Styles, qrBgColor: e.target.value } })
                          }
                          className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 dark:border-gray-600"
                        />
                        <input
                          type="text"
                          value={state.a4Styles.qrBgColor}
                          onChange={(e) =>
                            updateState({ a4Styles: { ...state.a4Styles, qrBgColor: e.target.value } })
                          }
                          className="flex-1 p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      QR Gradient
                    </label>
                    <input
                      type="checkbox"
                      checked={state.a4Styles.qrGradient}
                      onChange={(e) =>
                        updateState({ a4Styles: { ...state.a4Styles, qrGradient: e.target.checked } })
                      }
                      className="h-4 w-4 text-pink-600 dark:text-pink-400 focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                      Apply gradient to QR code
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      QR Alignment
                    </label>
                    <select
                      value={state.a4Styles.qrAlignment}
                      onChange={(e) =>
                        updateState({ a4Styles: { ...state.a4Styles, qrAlignment: e.target.value } })
                      }
                      className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="center">Center</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      QR Corner Style
                    </label>
                    <select
                      value={state.a4Styles.qrCornerStyle}
                      onChange={(e) =>
                        updateState({ a4Styles: { ...state.a4Styles, qrCornerStyle: e.target.value } })
                      }
                      className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="square">Square</option>
                      <option value="rounded">Rounded</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      QR Border Style
                    </label>
                    <select
                      value={state.a4Styles.qrBorderStyle}
                      onChange={(e) =>
                        updateState({ a4Styles: { ...state.a4Styles, qrBorderStyle: e.target.value } })
                      }
                      className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                      <option value="dotted">Dotted</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Background Pattern
                    </label>
                    <select
                      value={state.a4Styles.backgroundPattern}
                      onChange={(e) =>
                        updateState({ a4Styles: { ...state.a4Styles, backgroundPattern: e.target.value } })
                      }
                      className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="none">None</option>
                      <option value="dots">Dots</option>
                      <option value="lines">Lines</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Font Family
                    </label>
                    <select
                      value={state.a4Styles.fontFamily}
                      onChange={(e) =>
                        updateState({ a4Styles: { ...state.a4Styles, fontFamily: e.target.value } })
                      }
                      className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Header Alignment
                    </label>
                    <select
                      value={state.a4Styles.headerAlignment}
                      onChange={(e) =>
                        updateState({ a4Styles: { ...state.a4Styles, headerAlignment: e.target.value } })
                      }
                      className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="center">Center</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Content Alignment
                    </label>
                    <select
                      value={state.a4Styles.contentAlignment}
                      onChange={(e) =>
                        updateState({ a4Styles: { ...state.a4Styles, contentAlignment: e.target.value } })
                      }
                      className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="center">Center</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Footer Alignment
                    </label>
                    <select
                      value={state.a4Styles.footerAlignment}
                      onChange={(e) =>
                        updateState({ a4Styles: { ...state.a4Styles, footerAlignment: e.target.value } })
                      }
                      className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="center">Center</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Export Quality
                    </label>
                    <select
                      value={state.a4Styles.exportQuality}
                      onChange={(e) =>
                        updateState({ a4Styles: { ...state.a4Styles, exportQuality: e.target.value } })
                      }
                      className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <button
                    onClick={toggleAdvanced}
                    className="flex items-center justify-between w-full p-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <span>Advanced Settings</span>
                    {state.showAdvanced ? (
                      <ChevronUpIcon className="w-5 h-5 text-gray-400 dark:text-gray-200" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-400 dark:text-gray-200" />
                    )}
                  </button>
                  {state.showAdvanced && (
                    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Header Font Size: {state.a4Styles.headerFontSize}px
                        </label>
                        <input
                          type="range"
                          min="20"
                          max="40"
                          value={state.a4Styles.headerFontSize}
                          onChange={(e) =>
                            updateState({
                              a4Styles: { ...state.a4Styles, headerFontSize: parseInt(e.target.value) },
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Header Font Weight
                        </label>
                        <select
                          value={state.a4Styles.headerFontWeight}
                          onChange={(e) =>
                            updateState({ a4Styles: { ...state.a4Styles, headerFontWeight: e.target.value } })
                          }
                          className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          <option value="normal">Normal</option>
                          <option value="medium">Medium</option>
                          <option value="bold">Bold</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Body Font Size: {state.a4Styles.bodyFontSize}px
                        </label>
                        <input
                          type="range"
                          min="12"
                          max="20"
                          value={state.a4Styles.bodyFontSize}
                          onChange={(e) =>
                            updateState({
                              a4Styles: { ...state.a4Styles, bodyFontSize: parseInt(e.target.value) },
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Body Font Weight
                        </label>
                        <select
                          value={state.a4Styles.bodyFontWeight}
                          onChange={(e) =>
                            updateState({ a4Styles: { ...state.a4Styles, bodyFontWeight: e.target.value } })
                          }
                          className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          <option value="normal">Normal</option>
                          <option value="medium">Medium</option>
                          <option value="bold">Bold</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Footer Font Size: {state.a4Styles.footerFontSize}px
                        </label>
                        <input
                          type="range"
                          min="12"
                          max="20"
                          value={state.a4Styles.footerFontSize}
                          onChange={(e) =>
                            updateState({
                              a4Styles: { ...state.a4Styles, footerFontSize: parseInt(e.target.value) },
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Footer Font Weight
                        </label>
                        <select
                          value={state.a4Styles.footerFontWeight}
                          onChange={(e) =>
                            updateState({ a4Styles: { ...state.a4Styles, footerFontWeight: e.target.value } })
                          }
                          className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          <option value="normal">Normal</option>
                          <option value="medium">Medium</option>
                          <option value="bold">Bold</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          QR Size: {state.a4Styles.qrSize}px
                        </label>
                        <input
                          type="range"
                          min="150"
                          max="300"
                          value={state.a4Styles.qrSize}
                          onChange={(e) =>
                            updateState({
                              a4Styles: { ...state.a4Styles, qrSize: parseInt(e.target.value) },
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          QR Border Width: {state.a4Styles.qrBorderWidth}px
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="8"
                          value={state.a4Styles.qrBorderWidth}
                          onChange={(e) =>
                            updateState({
                              a4Styles: { ...state.a4Styles, qrBorderWidth: parseInt(e.target.value) },
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          QR Padding: {state.a4Styles.qrPadding}px
                        </label>
                        <input
                          type="range"
                          min="8"
                          max="32"
                          value={state.a4Styles.qrPadding}
                          onChange={(e) =>
                            updateState({
                              a4Styles: { ...state.a4Styles, qrPadding: parseInt(e.target.value) },
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Logo Max Height: {state.a4Styles.logoMaxHeight}px
                        </label>
                        <input
                          type="range"
                          min="40"
                          max="120"
                          value={state.a4Styles.logoMaxHeight}
                          onChange={(e) =>
                            updateState({
                              a4Styles: { ...state.a4Styles, logoMaxHeight: parseInt(e.target.value) },
                            })
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Form Preview
                </h2>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleZoomIn}
                    disabled={state.previewScale >= 1.2}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-all flex items-center text-sm"
                  >
                    <MagnifyingGlassPlusIcon className="w-4 h-4 mr-2" />
                    Zoom In
                  </button>
                  <button
                    onClick={handleZoomOut}
                    disabled={state.previewScale <= 0.2}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-all flex items-center text-sm"
                  >
                    <MagnifyingGlassMinusIcon className="w-4 h-4 mr-2" />
                    Zoom Out
                  </button>
                  <button
                    onClick={handleDownloadA4}
                    disabled={state.a4Loading}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-all flex items-center text-sm"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                    {state.a4Loading ? 'Downloading...' : 'Download PNG'}
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={state.a4Loading}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-all flex items-center text-sm"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                    {state.a4Loading ? 'Downloading...' : 'Download PDF'}
                  </button>
                  <button
                    onClick={handlePrintA4}
                    className="px-4 py-2 bg-pink-600 dark:bg-pink-500 text-white rounded-lg hover:bg-pink-700 dark:hover:bg-pink-600 transition-all flex items-center text-sm"
                  >
                    <PrinterIcon className="w-4 h-4 mr-2" />
                    Print
                  </button>
                </div>
              </div>

              <div className="flex justify-center overflow-auto max-h-[600px] sm:max-h-[700px]">
                <div
                  ref={a4PreviewRef}
                  className="a4-container bg-white dark:bg-gray-800 p-8 border border-gray-200 dark:border-gray-700 shadow-md"
                  style={{
                    width: '210mm',
                    height: '297mm',
                    fontFamily: state.a4Styles.fontFamily,
                    backgroundColor: state.a4Styles.secondaryColor,
                    transform: `scale(${state.previewScale})`,
                    transformOrigin: 'top center',
                    backgroundImage:
                      state.a4Styles.backgroundPattern === 'dots'
                        ? `radial-gradient(${state.a4Styles.primaryColor}33 1px, transparent 1px)`
                        : state.a4Styles.backgroundPattern === 'lines'
                        ? `repeating-linear-gradient(0deg, ${state.a4Styles.primaryColor}33, ${state.a4Styles.primaryColor}33 1px, transparent 1px, transparent 20px)`
                        : 'none',
                    backgroundSize: state.a4Styles.backgroundPattern !== 'none' ? '10px 10px' : 'auto',
                  }}
                >
                  <div
                    className={`flex header justify-${state.a4Styles.headerAlignment} items-center mb-6 border-b-2 pb-4`}
                    style={{ borderColor: state.a4Styles.primaryColor }}
                  >
                    <div
                      className={`flex items-center gap-4 justify-${state.a4Styles.logoPosition}`}
                      style={{ width: state.a4Styles.logoPosition === 'center' ? '100%' : 'auto' }}
                    >
                      {state.logo && (
                        <img
                          src={state.logo}
                          alt="Company Logo"
                          className="object-contain transition-transform duration-300 hover:scale-110"
                          style={{ maxHeight: `${state.a4Styles.logoMaxHeight}px`, maxWidth: '200px' }}
                        />
                      )}
                      {state.companyName && (
                        <h1
                          className="font-bold"
                          style={{
                            color: state.a4Styles.primaryColor,
                            fontSize: `${state.a4Styles.headerFontSize}px`,
                            fontWeight: state.a4Styles.headerFontWeight,
                            lineHeight: 1.2,
                          }}
                        >
                          {state.companyName}
                        </h1>
                      )}
                    </div>
                    <div className={`text-${state.a4Styles.headerAlignment}`}>
                      {state.contactPerson && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {state.contactPerson}
                        </p>
                      )}
                      {state.contactEmail && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {state.contactEmail}
                        </p>
                      )}
                      {state.contactPhone && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {state.contactPhone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    className={`content text-${state.a4Styles.contentAlignment} mb-8`}
                  >
                    <h2
                      className="font-semibold mb-4"
                      style={{
                        color: state.a4Styles.primaryColor,
                        fontSize: `${state.a4Styles.headerFontSize}px`,
                        fontWeight: state.a4Styles.headerFontWeight,
                        lineHeight: 1.2,
                      }}
                    >
                      {state.headerText}
                    </h2>
                    <p
                      className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto"
                      style={{
                        fontSize: `${state.a4Styles.bodyFontSize}px`,
                        fontWeight: state.a4Styles.bodyFontWeight,
                        lineHeight: 1.5,
                      }}
                    >
                      Scan the QR code below with your smartphone to access our office submission form.
                    </p>

                    <div
                      className={`qr-container flex justify-${state.a4Styles.qrAlignment} mb-8`}
                    >
                      {state.selectedQR.image && !state.failedImage ? (
                        <img
                          src={state.selectedQR.image}
                          alt="QR Code"
                          className="object-contain"
                          style={{
                            width: `${state.a4Styles.qrSize}px`,
                            height: `${state.a4Styles.qrSize}px`,
                            border: `${state.a4Styles.qrBorderWidth}px ${state.a4Styles.qrBorderStyle} ${state.a4Styles.primaryColor}`,
                            padding: `${state.a4Styles.qrPadding}px`,
                            backgroundColor: state.a4Styles.qrBgColor,
                            borderRadius: state.a4Styles.qrCornerStyle === 'rounded' ? '12px' : '0',
                          }}
                          onError={handleImageError}
                        />
                      ) : (
                        <div
                          style={{
                            width: `${state.a4Styles.qrSize}px`,
                            height: `${state.a4Styles.qrSize}px`,
                            border: `${state.a4Styles.qrBorderWidth}px ${state.a4Styles.qrBorderStyle} ${state.a4Styles.primaryColor}`,
                            padding: `${state.a4Styles.qrPadding}px`,
                            backgroundColor: state.a4Styles.qrBgColor,
                            borderRadius: state.a4Styles.qrCornerStyle === 'rounded' ? '12px' : '0',
                            backgroundImage: state.a4Styles.qrGradient
                              ? `linear-gradient(45deg, ${state.a4Styles.qrFgColor}, ${state.a4Styles.primaryColor})`
                              : 'none',
                          }}
                        >
                          <QRCode
                            value={state.selectedQR.url}
                            size={state.a4Styles.qrSize - state.a4Styles.qrPadding * 2}
                            bgColor={state.a4Styles.qrBgColor}
                            fgColor={state.a4Styles.qrGradient ? 'transparent' : state.a4Styles.qrFgColor}
                            style={{ borderRadius: state.a4Styles.qrCornerStyle === 'rounded' ? '8px' : '0' }}
                          />
                        </div>
                      )}
                    </div>

                    <div
                      className="instructions p-6 rounded-xl inline-block max-w-md border"
                      style={{
                        borderColor: state.a4Styles.primaryColor,
                        backgroundColor: `${state.a4Styles.primaryColor}10`,
                      }}
                    >
                      <p
                        className="text-gray-700 dark:text-gray-300 font-semibold mb-3"
                        style={{
                          fontSize: `${state.a4Styles.bodyFontSize}px`,
                          fontWeight: state.a4Styles.bodyFontWeight,
                          lineHeight: 1.5,
                        }}
                      >
                        <strong>Instructions:</strong>
                      </p>
                      <ol
                        className={`text-gray-700 dark:text-gray-300 list-decimal list-inside space-y-2 text-${
                          state.a4Styles.contentAlignment === 'centered' ? 'left' : state.a4Styles.contentAlignment
                        }`}
                        style={{
                          fontSize: `${state.a4Styles.bodyFontSize}px`,
                          fontWeight: state.a4Styles.bodyFontWeight,
                          lineHeight: 1.5,
                        }}
                      >
                        <li>Open your smartphone camera.</li>
                        <li>Point it at the QR code above.</li>
                        <li>Tap the notification that appears.</li>
                        <li>Complete the office submission form.</li>
                        <li>Submit your response.</li>
                      </ol>
                    </div>
                  </div>

                  <div
                    className={`footer mt-12 pt-4 border-t-2 text-${state.a4Styles.footerAlignment}`}
                    style={{ borderColor: state.a4Styles.primaryColor }}
                  >
                    <p
                      className="text-gray-600 dark:text-gray-300"
                      style={{
                        fontSize: `${state.a4Styles.footerFontSize}px`,
                        fontWeight: state.a4Styles.footerFontWeight,
                        lineHeight: 1.5,
                      }}
                    >
                      {state.tagline}
                    </p>
                    <p
                      className="text-gray-400 dark:text-gray-500 mt-2"
                      style={{
                        fontSize: `${state.a4Styles.footerFontSize - 2}px`,
                        fontWeight: state.a4Styles.footerFontWeight,
                        lineHeight: 1.5,
                      }}
                    >
                      Powered by VocalHeart
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Error
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">No QR code found.</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate('/qrgenerator')}
          className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm text-gray-800 dark:text-gray-200"
          aria-label="Back to QR Generator"
        >
          <XMarkIcon className="w-5 h-5" />
          Close
        </button>
      </div>
    </div>
  );
};

export default A4Customizer;