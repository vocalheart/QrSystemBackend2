import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
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
    customInstructions: '',
    logo: null,
    a4Loading: false,
    previewScale: window.innerWidth < 640 ? 0.3 : 0.6,
    showAdvanced: false,
    a4Styles: {
      primaryColor: '#db2777',
      secondaryColor: '#ffffff',
      fontFamily: 'Inter',
      layout: 'centered',
      headerAlignment: 'center',
      contentAlignment: 'center',
      footerAlignment: 'center',
      logoPosition: 'left',
      qrAlignment: 'center',
      qrCornerStyle: 'square',
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
      watermark: false,
      watermarkText: 'Confidential',
      watermarkOpacity: 0.1,
      marginTop: 20,
      marginBottom: 20,
      marginLeft: 20,
      marginRight: 20,
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
      customInstructions: state.customInstructions,
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
      customInstructions: template.customInstructions,
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
      customInstructions: defaultState.customInstructions,
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
        pixelRatio: 2, // Reduced pixel ratio for smaller file size
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
      const quality = { low: 0.5, medium: 0.75, high: 0.9 }[state.a4Styles.exportQuality]; // Reduced max quality for smaller size
      const dataUrl = await htmlToImage.toJpeg(a4PreviewRef.current, { // Changed to JPEG for better compression
        quality,
        pixelRatio: 1.5, // Reduced pixel ratio for smaller file size
        backgroundColor: state.a4Styles.secondaryColor,
      });
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compression: true,
      });
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight, '', 'FAST'); // Used FAST compression
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
            @page { size: A4; margin: ${state.a4Styles.marginTop}mm ${state.a4Styles.marginRight}mm ${state.a4Styles.marginBottom}mm ${state.a4Styles.marginLeft}mm; }
            body { margin: 0; padding: 0; font-family: ${state.a4Styles.fontFamily}, sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .a4-container {
              width: 210mm; height: 297mm; background-color: ${state.a4Styles.secondaryColor}; box-sizing: border-box;
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
              state.a4Styles.contentAlignment === 'center' ? 'left' : state.a4Styles.contentAlignment
            }; margin: 0; padding: 0; line-height: 1.5; }
            .instructions li { margin-bottom: 8px; }
            .footer { margin-top: 48px; padding-top: 16px; border-top: 2px solid ${state.a4Styles.primaryColor}; text-align: ${state.a4Styles.footerAlignment}; }
            .footer p { color: #4b5563; font-size: ${state.a4Styles.footerFontSize}px; font-weight: ${state.a4Styles.footerFontWeight}; margin: 0; line-height: 1.5; }
            .footer .powered { color: #9ca3af; font-size: ${state.a4Styles.footerFontSize - 2}px; margin-top: 8px; }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              opacity: ${state.a4Styles.watermarkOpacity};
              font-size: 48px;
              color: ${state.a4Styles.primaryColor};
              pointer-events: none;
            }
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

  const templates = [
    {
      name: 'Minimal',
      a4Styles: {
        primaryColor: '#4f46e5',
        secondaryColor: '#f9fafb',
        fontFamily: 'Inter',
        layout: 'centered',
        headerAlignment: 'center',
        contentAlignment: 'center',
        footerAlignment: 'center',
        logoPosition: 'center',
        qrAlignment: 'center',
        qrCornerStyle: 'square',
        backgroundPattern: 'none',
        qrFgColor: '#1f2937',
        qrBgColor: '#ffffff',
        headerFontSize: 32,
        bodyFontSize: 14,
        footerFontSize: 12,
        qrSize: 200,
        qrPadding: 8,
        qrBorderWidth: 0,
        qrBorderStyle: 'solid',
        logoMaxHeight: 60,
        qrGradient: false,
        headerFontWeight: 'bold',
        bodyFontWeight: 'normal',
        footerFontWeight: 'normal',
        exportQuality: 'high',
        watermark: false,
        watermarkText: '',
        watermarkOpacity: 0.1,
        marginTop: 25,
        marginBottom: 25,
        marginLeft: 25,
        marginRight: 25,
      },
    },
    {
      name: 'Professional',
      a4Styles: {
        primaryColor: '#1e40af',
        secondaryColor: '#f9fafb',
        fontFamily: 'Arial',
        layout: 'centered',
        headerAlignment: 'left',
        contentAlignment: 'left',
        footerAlignment: 'left',
        logoPosition: 'left',
        qrAlignment: 'right',
        qrCornerStyle: 'rounded',
        backgroundPattern: 'lines',
        qrFgColor: '#1e40af',
        qrBgColor: '#ffffff',
        headerFontSize: 36,
        bodyFontSize: 16,
        footerFontSize: 14,
        qrSize: 240,
        qrPadding: 12,
        qrBorderWidth: 3,
        qrBorderStyle: 'solid',
        logoMaxHeight: 70,
        qrGradient: true,
        headerFontWeight: 'bold',
        bodyFontWeight: 'medium',
        footerFontWeight: 'normal',
        exportQuality: 'high',
        watermark: true,
        watermarkText: 'Company Confidential',
        watermarkOpacity: 0.05,
        marginTop: 30,
        marginBottom: 30,
        marginLeft: 30,
        marginRight: 30,
      },
    },
    {
      name: 'Creative',
      a4Styles: {
        primaryColor: '#db2777',
        secondaryColor: '#fdf2f8',
        fontFamily: 'Georgia',
        layout: 'centered',
        headerAlignment: 'center',
        contentAlignment: 'center',
        footerAlignment: 'center',
        logoPosition: 'center',
        qrAlignment: 'center',
        qrCornerStyle: 'rounded',
        backgroundPattern: 'dots',
        qrFgColor: '#db2777',
        qrBgColor: '#ffffff',
        headerFontSize: 40,
        bodyFontSize: 18,
        footerFontSize: 14,
        qrSize: 280,
        qrPadding: 16,
        qrBorderWidth: 4,
        qrBorderStyle: 'dashed',
        logoMaxHeight: 80,
        qrGradient: true,
        headerFontWeight: 'bold',
        bodyFontWeight: 'normal',
        footerFontWeight: 'medium',
        exportQuality: 'high',
        watermark: false,
        watermarkText: '',
        watermarkOpacity: 0.1,
        marginTop: 20,
        marginBottom: 20,
        marginLeft: 20,
        marginRight: 20,
      },
    },
    {
      name: 'Modern',
      a4Styles: {
        primaryColor: '#059669',
        secondaryColor: '#f0fdf4',
        fontFamily: 'Helvetica',
        layout: 'centered',
        headerAlignment: 'right',
        contentAlignment: 'right',
        footerAlignment: 'right',
        logoPosition: 'right',
        qrAlignment: 'left',
        qrCornerStyle: 'square',
        backgroundPattern: 'lines',
        qrFgColor: '#059669',
        qrBgColor: '#ffffff',
        headerFontSize: 34,
        bodyFontSize: 16,
        footerFontSize: 12,
        qrSize: 220,
        qrPadding: 10,
        qrBorderWidth: 2,
        qrBorderStyle: 'dotted',
        logoMaxHeight: 65,
        qrGradient: false,
        headerFontWeight: 'medium',
        bodyFontWeight: 'normal',
        footerFontWeight: 'bold',
        exportQuality: 'medium',
        watermark: true,
        watermarkText: 'Draft',
        watermarkOpacity: 0.15,
        marginTop: 25,
        marginBottom: 25,
        marginLeft: 25,
        marginRight: 25,
      },
    },
    {
      name: 'Corporate',
      a4Styles: {
        primaryColor: '#374151',
        secondaryColor: '#ffffff',
        fontFamily: 'Arial',
        layout: 'centered',
        headerAlignment: 'center',
        contentAlignment: 'center',
        footerAlignment: 'center',
        logoPosition: 'center',
        qrAlignment: 'center',
        qrCornerStyle: 'square',
        backgroundPattern: 'none',
        qrFgColor: '#374151',
        qrBgColor: '#ffffff',
        headerFontSize: 38,
        bodyFontSize: 16,
        footerFontSize: 14,
        qrSize: 250,
        qrPadding: 12,
        qrBorderWidth: 3,
        qrBorderStyle: 'solid',
        logoMaxHeight: 75,
        qrGradient: false,
        headerFontWeight: 'bold',
        bodyFontWeight: 'medium',
        footerFontWeight: 'normal',
        exportQuality: 'high',
        watermark: false,
        watermarkText: '',
        watermarkOpacity: 0.1,
        marginTop: 30,
        marginBottom: 30,
        marginLeft: 30,
        marginRight: 30,
      },
    },
  ];

  const handleApplyTemplate = (template) => {
    updateState({ a4Styles: template.a4Styles });
    toast.success(`${template.name} template applied!`, { duration: 3000 });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 py-8 sm:px-6 lg:px-8 font-sans text-[10px] antialiased">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontSize: "10px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#ffffff",
            color: "#1e293b",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          },
          success: {
            iconTheme: { primary: "#4f46e5", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "#EF4444", secondary: "#fff" },
          },
        }}
      />
      <div className="max-w-full mx-auto">
        <div className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-[10px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                A4 Office Submission Form Customizer
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                Design and download professional QR code forms
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUndo}
                disabled={state.historyIndex <= 0}
                className="flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Undo"
              >
                <ArrowUturnLeftIcon className="h-4 w-4 mr-1" />
                Undo
              </button>
              <button
                onClick={handleRedo}
                disabled={state.historyIndex >= state.history.length - 1}
                className="flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Redo"
              >
                <ArrowUturnRightIcon className="h-4 w-4 mr-1" />
                Redo
              </button>
              <button
                onClick={handleSaveTemplate}
                className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow"
                aria-label="Save template"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Save
              </button>
              <button
                onClick={handleReset}
                className="flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all duration-200"
                aria-label="Reset to default"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Reset
              </button>
            </div>
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
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
              <div className="flex border-b border-slate-200 dark:border-slate-700 -mx-6 px-6 pb-4 mb-4">
                <button
                  className={`px-4 py-2 text-sm font-medium ${state.activeTab === 'content' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  onClick={() => updateState({ activeTab: 'content' })}
                >
                  Content
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${state.activeTab === 'style' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  onClick={() => updateState({ activeTab: 'style' })}
                >
                  Style
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${state.activeTab === 'templates' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  onClick={() => updateState({ activeTab: 'templates' })}
                >
                  Templates
                </button>
              </div>
              {state.activeTab === 'content' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Company Name</label>
                    <input
                      type="text"
                      value={state.companyName}
                      onChange={(e) => updateState({ companyName: e.target.value })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Person</label>
                    <input
                      type="text"
                      value={state.contactPerson}
                      onChange={(e) => updateState({ contactPerson: e.target.value })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter contact person"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Email</label>
                    <input
                      type="email"
                      value={state.contactEmail}
                      onChange={(e) => updateState({ contactEmail: e.target.value })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter contact email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Phone</label>
                    <input
                      type="tel"
                      value={state.contactPhone}
                      onChange={(e) => updateState({ contactPhone: e.target.value })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter contact phone"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Header Text</label>
                    <input
                      type="text"
                      value={state.headerText}
                      onChange={(e) => updateState({ headerText: e.target.value })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter header text"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tagline</label>
                    <input
                      type="text"
                      value={state.tagline}
                      onChange={(e) => updateState({ tagline: e.target.value })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter tagline"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Custom Instructions</label>
                    <textarea
                      value={state.customInstructions}
                      onChange={(e) => updateState({ customInstructions: e.target.value })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter custom instructions"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Logo</label>
                    <div
                      ref={dropZoneRef}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`mt-1 w-full p-4 border-2 ${state.isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 dark:border-slate-600'} rounded-lg text-center transition-all duration-200`}
                    >
                      {state.logo ? (
                        <div className="relative">
                          <img src={state.logo} alt="Logo preview" className="max-h-24 mx-auto" onError={handleImageError} />
                          <button
                            onClick={removeLogo}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                            aria-label="Remove logo"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Drag & drop logo here or click to upload</p>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleLogoUpload(e.target.files[0])}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Upload Logo
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {state.activeTab === 'style' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Primary Color</label>
                    <input
                      type="color"
                      value={state.a4Styles.primaryColor}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, primaryColor: e.target.value } })}
                      className="mt-1 w-16 h-10 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Secondary Color</label>
                    <input
                      type="color"
                      value={state.a4Styles.secondaryColor}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, secondaryColor: e.target.value } })}
                      className="mt-1 w-16 h-10 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Font Family</label>
                    <select
                      value={state.a4Styles.fontFamily}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, fontFamily: e.target.value } })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Tahoma">Tahoma</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Header Alignment</label>
                    <select
                      value={state.a4Styles.headerAlignment}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, headerAlignment: e.target.value } })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Content Alignment</label>
                    <select
                      value={state.a4Styles.contentAlignment}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, contentAlignment: e.target.value } })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Footer Alignment</label>
                    <select
                      value={state.a4Styles.footerAlignment}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, footerAlignment: e.target.value } })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Logo Position</label>
                    <select
                      value={state.a4Styles.logoPosition}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, logoPosition: e.target.value } })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">QR Code Alignment</label>
                    <select
                      value={state.a4Styles.qrAlignment}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, qrAlignment: e.target.value } })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">QR Corner Style</label>
                    <select
                      value={state.a4Styles.qrCornerStyle}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, qrCornerStyle: e.target.value } })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="square">Square</option>
                      <option value="rounded">Rounded</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Background Pattern</label>
                    <select
                      value={state.a4Styles.backgroundPattern}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, backgroundPattern: e.target.value } })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="none">None</option>
                      <option value="dots">Dots</option>
                      <option value="lines">Lines</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">QR Foreground Color</label>
                    <input
                      type="color"
                      value={state.a4Styles.qrFgColor}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, qrFgColor: e.target.value } })}
                      className="mt-1 w-16 h-10 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">QR Background Color</label>
                    <input
                      type="color"
                      value={state.a4Styles.qrBgColor}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, qrBgColor: e.target.value } })}
                      className="mt-1 w-16 h-10 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Header Font Size (px)</label>
                    <input
                      type="number"
                      value={state.a4Styles.headerFontSize}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, headerFontSize: parseInt(e.target.value) } })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      min="10"
                      max="60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Body Font Size (px)</label>
                    <input
                      type="number"
                      value={state.a4Styles.bodyFontSize}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, bodyFontSize: parseInt(e.target.value) } })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      min="10"
                      max="30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Footer Font Size (px)</label>
                    <input
                      type="number"
                      value={state.a4Styles.footerFontSize}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, footerFontSize: parseInt(e.target.value) } })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      min="8"
                      max="20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">QR Size (px)</label>
                    <input
                      type="number"
                      value={state.a4Styles.qrSize}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, qrSize: parseInt(e.target.value) } })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      min="100"
                      max="400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">QR Padding (px)</label>
                    <input
                      type="number"
                      value={state.a4Styles.qrPadding}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, qrPadding: parseInt(e.target.value) } })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      min="0"
                      max="50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">QR Border Width (px)</label>
                    <input
                      type="number"
                      value={state.a4Styles.qrBorderWidth}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, qrBorderWidth: parseInt(e.target.value) } })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      min="0"
                      max="10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">QR Border Style</label>
                    <select
                      value={state.a4Styles.qrBorderStyle}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, qrBorderStyle: e.target.value } })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                      <option value="dotted">Dotted</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Logo Max Height (px)</label>
                    <input
                      type="number"
                      value={state.a4Styles.logoMaxHeight}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, logoMaxHeight: parseInt(e.target.value) } })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      min="20"
                      max="150"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Header Font Weight</label>
                    <select
                      value={state.a4Styles.headerFontWeight}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, headerFontWeight: e.target.value } })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="normal">Normal</option>
                      <option value="medium">Medium</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Body Font Weight</label>
                    <select
                      value={state.a4Styles.bodyFontWeight}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, bodyFontWeight: e.target.value } })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="normal">Normal</option>
                      <option value="medium">Medium</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Footer Font Weight</label>
                    <select
                      value={state.a4Styles.footerFontWeight}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, footerFontWeight: e.target.value } })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="normal">Normal</option>
                      <option value="medium">Medium</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Export Quality</label>
                    <select
                      value={state.a4Styles.exportQuality}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, exportQuality: e.target.value } })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={state.a4Styles.watermark}
                        onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, watermark: e.target.checked } })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 rounded"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Enable Watermark</span>
                    </label>
                    {state.a4Styles.watermark && (
                      <input
                        type="text"
                        value={state.a4Styles.watermarkText}
                        onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, watermarkText: e.target.value } })}
                        className="mt-2 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="Enter watermark text"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Watermark Opacity</label>
                    <input
                      type="number"
                      value={state.a4Styles.watermarkOpacity}
                      onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, watermarkOpacity: parseFloat(e.target.value) } })}
                      className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      min="0"
                      max="1"
                      step="0.01"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Margin Top (mm)</label>
                      <input
                        type="number"
                        value={state.a4Styles.marginTop}
                        onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, marginTop: parseInt(e.target.value) } })}
                        className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        min="10"
                        max="50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Margin Bottom (mm)</label>
                      <input
                        type="number"
                        value={state.a4Styles.marginBottom}
                        onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, marginBottom: parseInt(e.target.value) } })}
                        className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        min="10"
                        max="50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Margin Left (mm)</label>
                      <input
                        type="number"
                        value={state.a4Styles.marginLeft}
                        onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, marginLeft: parseInt(e.target.value) } })}
                        className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        min="10"
                        max="50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Margin Right (mm)</label>
                      <input
                        type="number"
                        value={state.a4Styles.marginRight}
                        onChange={(e) => updateState({ a4Styles: { ...state.a4Styles, marginRight: parseInt(e.target.value) } })}
                        className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        min="10"
                        max="50"
                      />
                    </div>
                  </div>
                </div>
              )}
              {state.activeTab === 'templates' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Predefined Templates</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <div key={template.name} className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">{template.name}</h4>
                        <button
                          onClick={() => handleApplyTemplate(template)}
                          className="mt-2 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          Apply Template
                        </button>
                      </div>
                    ))}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-6">Saved Templates</h3>
                  {state.savedTemplates.length > 0 ? (
                    <div className="space-y-2">
                      {state.savedTemplates.map((template, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-600 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{template.companyName || 'Untitled'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(template.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleLoadTemplate(template)}
                              className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(index)}
                              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                              aria-label="Delete template"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No saved templates yet.</p>
                  )}
                </div>
              )}
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Preview</h2>
              <div className="flex justify-between items-center mb-4">
                
                <div className="flex gap-2">
                  <button
                    onClick={handleZoomIn}
                    className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                    aria-label="Zoom in"
                  >
                    <MagnifyingGlassPlusIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                    aria-label="Zoom out"
                  >
                    <MagnifyingGlassMinusIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleDownloadA4}
                    disabled={state.a4Loading}
                    className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Download as PNG"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    PNG
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={state.a4Loading}
                    className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Download as PDF"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    PDF
                  </button>
                  <button
                    onClick={handlePrintA4}
                    disabled={state.a4Loading}
                    className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Print"
                  >
                    <PrinterIcon className="h-4 w-4 mr-1" />
                    Print
                  </button>
                </div>
              </div>
              <div className="overflow-auto">
                <div
                  ref={a4PreviewRef}
                  className="a4-container relative"
                  style={{
                    width: '210mm',
                    height: '297mm',
                    backgroundColor: state.a4Styles.secondaryColor,
                    padding: `${state.a4Styles.marginTop}mm ${state.a4Styles.marginRight}mm ${state.a4Styles.marginBottom}mm ${state.a4Styles.marginLeft}mm`,
                    boxSizing: 'border-box',
                    fontFamily: state.a4Styles.fontFamily,
                    backgroundImage:
                      state.a4Styles.backgroundPattern === 'dots'
                        ? `radial-gradient(${state.a4Styles.primaryColor}33 1px, transparent 1px)`
                        : state.a4Styles.backgroundPattern === 'lines'
                        ? `repeating-linear-gradient(0deg, ${state.a4Styles.primaryColor}33, ${state.a4Styles.primaryColor}33 1px, transparent 1px, transparent 20px)`
                        : 'none',
                    backgroundSize: state.a4Styles.backgroundPattern === 'dots' ? '10px 10px' : 'auto',
                    transform: `scale(${state.previewScale})`,
                    transformOrigin: 'top left',
                  }}
                >
                  {state.a4Styles.watermark && (
                    <div
                      className="watermark"
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%) rotate(-45deg)',
                        opacity: state.a4Styles.watermarkOpacity,
                        fontSize: '48px',
                        color: state.a4Styles.primaryColor,
                        pointerEvents: 'none',
                      }}
                    >
                      {state.a4Styles.watermarkText}
                    </div>
                  )}
                  <div
                    className="header"
                    style={{
                      display: 'flex',
                      justifyContent: state.a4Styles.headerAlignment,
                      alignItems: 'center',
                      marginBottom: '20px',
                      paddingBottom: '16px',
                      borderBottom: `2px solid ${state.a4Styles.primaryColor}`,
                    }}
                  >
                    <div style={{ textAlign: state.a4Styles.logoPosition }}>
                      {state.logo && !state.failedImage ? (
                        <img
                          src={state.logo}
                          alt="Company Logo"
                          style={{ maxHeight: `${state.a4Styles.logoMaxHeight}px`, maxWidth: '200px', objectFit: 'contain' }}
                          onError={handleImageError}
                        />
                      ) : null}
                      <h1 style={{ color: state.a4Styles.primaryColor, fontSize: `${state.a4Styles.headerFontSize}px`, fontWeight: state.a4Styles.headerFontWeight, margin: 0 }}>
                        {state.headerText}
                      </h1>
                      <p style={{ color: '#4b5563', fontSize: '14px', margin: '4px 0' }}>{state.tagline}</p>
                    </div>
                  </div>
                  <div className="content" style={{ textAlign: state.a4Styles.contentAlignment, marginBottom: '32px' }}>
                    <h2 style={{ color: state.a4Styles.primaryColor, fontSize: `${state.a4Styles.headerFontSize}px`, fontWeight: state.a4Styles.headerFontWeight, marginBottom: '16px' }}>
                      Scan to Submit
                    </h2>
                    <p style={{ color: '#4b5563', fontSize: `${state.a4Styles.bodyFontSize}px`, fontWeight: state.a4Styles.bodyFontWeight, maxWidth: '400px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
                      Use your smartphone to scan the QR code below and submit your office documents quickly and securely.
                    </p>
                    <div
                      className="qr-container"
                      style={{ display: 'flex', justifyContent: state.a4Styles.qrAlignment, marginBottom: '32px' }}
                    >
                      <div
                        style={{
                          border: `${state.a4Styles.qrBorderWidth}px ${state.a4Styles.qrBorderStyle} ${state.a4Styles.primaryColor}`,
                          padding: `${state.a4Styles.qrPadding}px`,
                          backgroundColor: state.a4Styles.qrBgColor,
                          width: `${state.a4Styles.qrSize}px`,
                          height: `${state.a4Styles.qrSize}px`,
                          borderRadius: state.a4Styles.qrCornerStyle === 'rounded' ? '12px' : '0',
                        }}
                      >
                        {state.a4Styles.qrGradient ? (
                          <svg width={state.a4Styles.qrSize} height={state.a4Styles.qrSize}>
                            <defs>
                              <linearGradient id="qrGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: state.a4Styles.qrFgColor, stopOpacity: 1 }} />
                                <stop offset="100%" style={{ stopColor: state.a4Styles.primaryColor, stopOpacity: 1 } } />
                              </linearGradient>
                            </defs>
                            <QRCode
                              value={state.selectedQR.url}
                              size={state.a4Styles.qrSize}
                              fgColor="url(#qrGradient)"
                              bgColor={state.a4Styles.qrBgColor}
                            />
                          </svg>
                        ) : (
                          <QRCode
                            value={state.selectedQR.url}
                            size={state.a4Styles.qrSize}
                            fgColor={state.a4Styles.qrFgColor}
                            bgColor={state.a4Styles.qrBgColor}
                          />
                        )}
                      </div>
                    </div>
                    <div
                      className="instructions"
                      style={{
                        display: 'inline-block',
                        maxWidth: '400px',
                        padding: '24px',
                        border: `1px solid ${state.a4Styles.primaryColor}`,
                        backgroundColor: `${state.a4Styles.primaryColor}10`,
                        borderRadius: '12px',
                      }}
                    >
                      <p style={{ color: '#374151', fontSize: `${state.a4Styles.bodyFontSize}px`, fontWeight: state.a4Styles.bodyFontWeight, marginBottom: '12px' }}>
                        Instructions:
                      </p>
                      <ol style={{ color: '#374151', fontSize: `${state.a4Styles.bodyFontSize}px`, fontWeight: state.a4Styles.bodyFontWeight, listStyle: 'decimal', listStylePosition: 'inside', textAlign: state.a4Styles.contentAlignment === 'center' ? 'left' : state.a4Styles.contentAlignment, margin: 0, padding: 0, lineHeight: 1.5 }}>
                        <li style={{ marginBottom: '8px' }}>Open your camera or QR code scanner app.</li>
                        <li style={{ marginBottom: '8px' }}>Point it at the QR code above.</li>
                        <li style={{ marginBottom: '8px' }}>Follow the link to submit your documents.</li>
                        <li>Ensure all required fields are completed.</li>
                      </ol>
                      {state.customInstructions && (
                        <p style={{ color: '#374151', fontSize: `${state.a4Styles.bodyFontSize}px`, fontWeight: state.a4Styles.bodyFontWeight, marginTop: '16px' }}>
                          {state.customInstructions}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    className="footer"
                    style={{
                      marginTop: '48px',
                      paddingTop: '16px',
                      borderTop: `2px solid ${state.a4Styles.primaryColor}`,
                      textAlign: state.a4Styles.footerAlignment,
                    }}
                  >
                    {state.companyName && <p style={{ color: '#4b5563', fontSize: `${state.a4Styles.footerFontSize}px`, fontWeight: state.a4Styles.footerFontWeight, margin: 0, lineHeight: 1.5 }}>{state.companyName}</p>}
                    {state.contactPerson && <p style={{ color: '#4b5563', fontSize: `${state.a4Styles.footerFontSize}px`, fontWeight: state.a4Styles.footerFontWeight, margin: 0, lineHeight: 1.5 }}>{state.contactPerson}</p>}
                    {state.contactEmail && <p style={{ color: '#4b5563', fontSize: `${state.a4Styles.footerFontSize}px`, fontWeight: state.a4Styles.footerFontWeight, margin: 0, lineHeight: 1.5 }}>{state.contactEmail}</p>}
                    {state.contactPhone && <p style={{ color: '#4b5563', fontSize: `${state.a4Styles.footerFontSize}px`, fontWeight: state.a4Styles.footerFontWeight, margin: 0, lineHeight: 1.5 }}>{state.contactPhone}</p>}
                    <p style={{ color: '#9ca3af', fontSize: `${state.a4Styles.footerFontSize - 2}px`, marginTop: '8px' }}>
                      Powered by VocalHeart
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default A4Customizer;