import { useNavigate } from 'react-router-dom';
import {
  QrCodeIcon,
  MapPinIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function Usage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 text-[12px]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-pink-500 to-purple-500 dark:from-pink-600 dark:to-purple-600 text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 animate-fade-in">
            How to Use QRVibe
          </h1>
          <p className="text-lg sm:text-xl text-gray-100 dark:text-gray-200 mb-8 max-w-3xl mx-auto">
            Your secure, QR-based platform for streamlined office visitor management and access control.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/get-started')}
              className="px-6 py-3 bg-white text-pink-600 dark:text-pink-400 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 text-[12px] shadow-md hover:scale-105"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors duration-300 text-[12px] shadow-md hover:scale-105"
            >
              Back to Home
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 to-purple-400 dark:from-pink-500 dark:to-purple-500 animate-pulse"></div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Introduction */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <InformationCircleIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Welcome to QRVibe
              </h2>
            </div>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                QRVibe is a cutting-edge platform designed to streamline and secure office visitor management. Using QR codes and location-based validation, QRVibe ensures only authorized visitors gain access to your workplace.
              </p>
              <p>
                Whether you're a visitor checking in for a meeting or an organization managing access, QRVibe offers a seamless, secure, and efficient experience. Our platform leverages advanced geolocation technology to verify visitors are at the correct office location before granting access.
              </p>
            </div>
          </div>

          {/* Prerequisites */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <InformationCircleIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Before You Begin
              </h2>
            </div>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>To ensure a smooth visitor check-in process with QRVibe, prepare the following:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>
                  <span className="font-medium">A Valid QR Code</span>: Obtain the QR code from the office reception or host.
                </li>
                <li>
                  <span className="font-medium">A Compatible Device</span>: Use a smartphone or tablet with a modern web browser.
                </li>
                <li>
                  <span className="font-medium">QR Code Scanner</span>: Use your device’s camera or a QR scanning app.
                </li>
                <li>
                  <span className="font-medium">Location Services Enabled</span>: Ensure your device’s location services are active.
                </li>
              </ul>
            </div>
          </div>

          {/* Step-by-Step Guide */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <InformationCircleIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Step-by-Step Instructions
              </h2>
            </div>

            <div className="space-y-8">
              {/* Step 1 */}
              <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-pink-100 dark:bg-pink-900/20 rounded-full p-3">
                    <QrCodeIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                      1. Scan the QR Code
                    </h3>
                    <div className="space-y-3 text-gray-600 dark:text-gray-400">
                      <p>Begin by scanning the unique QR code provided by the office reception or host.</p>
                      <p className="font-medium">How to Scan the QR Code:</p>
                      <ol className="list-decimal list-inside space-y-2 pl-4">
                        <li>Open your smartphone’s camera or QR scanner app.</li>
                        <li>Point the camera at the QR code until a link appears.</li>
                        <li>Tap the link to access the QRVibe check-in form in your browser.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-pink-100 dark:bg-pink-900/20 rounded-full p-3">
                    <MapPinIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                      2. Allow Location Access
                    </h3>
                    <div className="space-y-3 text-gray-600 dark:text-gray-400">
                      <p>After scanning, QRVibe will request access to your device’s location to verify you’re at the office.</p>
                      <p className="font-medium">How to Allow Location Access:</p>
                      <ol className="list-decimal list-inside space-y-2 pl-4">
                        <li>Click “Allow” when prompted by your browser for location access.</li>
                        <li>Ensure location services are enabled in your device settings.</li>
                        <li>Wait briefly as QRVibe confirms your location.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-pink-100 dark:bg-pink-900/20 rounded-full p-3">
                    <DocumentTextIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                      3. Complete the Check-In Form
                    </h3>
                    <div className="space-y-3 text-gray-600 dark:text-gray-400">
                      <p>Once your location is verified, fill out the visitor check-in form.</p>
                      <p className="font-medium">Form Fields Explained:</p>
                      <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><span className="font-medium">Full Name (Required)</span>: Enter your full name.</li>
                        <li><span className="font-medium">Email (Required)</span>: Provide a valid email address.</li>
                        <li><span className="font-medium">Purpose of Visit (Required)</span>: Specify the reason (e.g., meeting, interview).</li>
                        <li><span className="font-medium">Host Name (Optional)</span>: Enter the name of the person you’re meeting.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-pink-100 dark:bg-pink-900/20 rounded-full p-3">
                    <CheckCircleIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                      4. Submit and Receive Your Digital Pass
                    </h3>
                    <div className="space-y-3 text-gray-600 dark:text-gray-400">
                      <p>Submit the form to receive your digital visitor pass instantly.</p>
                      <p className="font-medium">What the Digital Pass Does:</p>
                      <ul className="list-disc list-inside space-y-2 pl-4">
                        <li>Grants secure access to the office premises.</li>
                        <li>Allows tracking of your visit for security purposes.</li>
                        <li>Facilitates communication with the office host or reception.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <ExclamationTriangleIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Troubleshooting Common Issues
              </h2>
            </div>
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-xl">
                <p className="font-medium text-red-600 dark:text-red-400 mb-2">
                  "Unable to Retrieve Location" Error
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 pl-4">
                  <li>Refresh the page and select “Allow” for location access.</li>
                  <li>Verify that location services are enabled in your device settings.</li>
                </ul>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/10 p-6 rounded-xl">
                <p className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                  "You Are Not Within the Allowed Range" Error
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 pl-4">
                  <li>Ensure you are at the designated office location.</li>
                  <li>Confirm the QR code’s location requirements with the office reception.</li>
                </ul>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl">
                <p className="font-medium text-blue-600 dark:text-blue-400 mb-2">
                  "Failed to Submit Form" Error
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 pl-4">
                  <li>Verify all required fields (e.g., name, email) are completed.</li>
                  <li>Ensure your internet connection is stable.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <InformationCircleIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <p className="font-medium text-gray-800 dark:text-white">
                  Q: Do I need an account to use QRVibe for visitor check-in?
                </p>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  No, QRVibe’s check-in process is account-free and accessible via QR code.
                </p>
              </div>
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <p className="font-medium text-gray-800 dark:text-white">
                  Q: What if I’m not at the office location?
                </p>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  You’ll receive an “Access Denied” message and cannot submit the form until you’re at the correct location.
                </p>
              </div>
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <p className="font-medium text-gray-800 dark:text-white">
                  Q: Can I reuse the same QR code for multiple visits?
                </p>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  QR codes are typically single-use for security. Contact the office for a new QR code for each visit.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <EnvelopeIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Contact QRVibe Support
              </h2>
            </div>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>Need assistance with QRVibe? Our support team is ready to help with any issues or questions.</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>
                  <span className="font-medium">Email</span>: <a href="mailto:support@qrvibe.com" className="hover:text-pink-400 transition-colors duration-200">support@qrvibe.com</a>
                </li>
                <li>
                  <span className="font-medium">Response Time</span>: Within 24 hours on business days
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-pink-600 dark:bg-pink-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Streamline Visitor Management?
          </h2>
          <p className="text-lg text-gray-100 dark:text-gray-200 mb-8 max-w-2xl mx-auto">
            Experience secure and efficient office check-ins with QRVibe’s innovative platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/get-started')}
              className="px-6 py-3 bg-white text-pink-600 dark:text-pink-400 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 text-[12px] shadow-md hover:scale-105"
            >
              Get Started Now
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors duration-300 text-[12px] shadow-md hover:scale-105"
            >
              Contact Support
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">QRVibe</h3>
              <p className="text-gray-400 text-[12px]">
                Secure, QR-based solutions for efficient office visitor management.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2 text-[12px]">
                {[
                  { name: 'Home', path: '/' },
                  { name: 'About', path: '/about' },
                  { name: 'How It Works', path: '/usage' },
                  { name: 'Get Started', path: '/get-started' },
                  { name: 'FAQ', path: '/faq' },
                  { name: 'Contact', path: '/contact' },
                ].map((item) => (
                  <li key={item.name}>
                    <button
                      onClick={() => navigate(item.path)}
                      className="text-gray-400 hover:text-pink-400 transition-colors duration-200"
                    >
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-[12px]">
                {[
                  { name: 'Privacy Policy', path: '/privacy' },
                  { name: 'Terms of Service', path: '/terms' },
                  { name: 'Security', path: '/security' },
                ].map((item) => (
                  <li key={item.name}>
                    <button
                      onClick={() => navigate(item.path)}
                      className="text-gray-400 hover:text-pink-400 transition-colors duration-200"
                    >
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Connect</h3>
              <p className="text-gray-400 text-[12px] mb-2">
                <EnvelopeIcon className="w-4 h-4 inline mr-2" />
                <a href="mailto:support@qrvibe.com" className="hover:text-pink-400 transition-colors duration-200">
                  support@qrvibe.com
                </a>
              </p>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="text-gray-400 hover:text-pink-400 transition-colors duration-200">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 4.01c-1 .49-1.98.689-3 .99-1.121-1.265-2.783-1.335-4.38-.737S11.977 6.323 12 8v1c-3.245.083-6.135-1.395-8-4 0 0-4.182 7.433 4 11-1.872 1.247-3.739 2.088-6 2 4.308 1.784 9.165 1.418 12-1 1.989-.233 3.675-1.384 4-3 0 0 .575-3.375-1-6z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-pink-400 transition-colors duration-200">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-700 pt-6 text-center">
            <p className="text-gray-400 text-[12px]">
              © {new Date().getFullYear()} QRVibe Technologies. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}