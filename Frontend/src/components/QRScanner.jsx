import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from './AuthContext';
import { Html5Qrcode } from 'html5-qrcode';
import toast, { Toaster } from 'react-hot-toast';
import { CameraIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function QRScanner() {
  const [data, setData] = useState('Not Found');
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const qrCodeRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    let html5QrCode = null;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode('qr-code-scanner');
        qrCodeRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            setData(decodedText);
            try {
              const url = new URL(decodedText);
              toast.success(`Redirecting to ${url.hostname}...`, { duration: 2000 });
              setIsScanning(false);
              html5QrCode.stop();
              setTimeout(() => {
                window.location.href = decodedText;
              }, 1000);
            } catch (e) {
              setError('Invalid QR code URL');
              toast.error('Invalid URL in QR code.', { duration: 3000 });
            }
          },
          (err) => {
            console.error('Scan Error:', err);
            setError(err.message || 'Failed to scan QR code.');
            toast.error(err.message || 'Failed to scan QR code.', { duration: 3000 });
          }
        );
        setIsScanning(true);
      } catch (err) {
        console.error('Scanner Start Error:', err);
        setError(err.message || 'Failed to start scanner.');
        toast.error(err.message || 'Failed to start scanner.', { duration: 3000 });
      }
    };

    startScanner();

    return () => {
      if (html5QrCode && isScanning) {
        html5QrCode.stop().catch((err) => console.error('Stop Scanner Error:', err));
      }
    };
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-4 py-8 font-roboto roboto-normal text-xs">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <img
            src="https://i.ibb.co/gbPrfVSB/Whats-App-Image-2025-03-03-at-17-45-28-b944d3a4-removebg-preview-1.png"
            alt="VocalHeart Logo"
            className="mx-auto h-12 mb-4 transition-transform duration-300 hover:scale-110"
          />
          <h1 className="font-semibold text-gray-900 dark:text-white roboto-bold">
            QR Code Scanner
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300 roboto-light-italic">
            Scan a QR code to visit the encoded URL
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CameraIcon className="h-6 w-6 text-gray-400 dark:text-gray-200" />
            <h3 className="font-semibold text-gray-900 dark:text-white roboto-bold">
              Scan QR Code
            </h3>
          </div>
          {error ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 roboto-bold">
                    Scan Error
                  </h3>
                  <div className="mt-1 text-gray-600 dark:text-gray-300 roboto-light-italic">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div id="qr-code-scanner" className="w-full max-w-[500px] mx-auto rounded-lg"></div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-pink-600 dark:border-pink-400 rounded-lg"></div>
              </div>
            </div>
          )}
          <p className="mt-4 text-center text-gray-600 dark:text-gray-300 roboto-normal">
            Last scanned: {data}
          </p>
        </div>
      </div>
    </div>
  );
}

export default QRScanner;