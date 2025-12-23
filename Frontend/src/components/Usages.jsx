import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  QrCode,
  MapPin,
  FileText,
  CheckCircle,
  Info,
  Mail,
  AlertTriangle,
  Twitter,
  Linkedin,
} from 'lucide-react';

export default function Usage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 text-slate-900 font-[Inter] text-[12px]">
      {/* Hero Section with QR Code Display */}
      <section className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 sm:py-24">
        <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 opacity-20 blur-3xl animate-pulse z-0" />
        <div className="absolute bottom-8 right-8 w-80 h-80 rounded-full bg-gradient-to-r from-purple-300 to-indigo-300 opacity-20 blur-3xl animate-pulse z-0" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-4xl sm:text-5xl font-bold mb-4"
            >
              How to Use QRVibe
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="text-lg sm:text-xl text-slate-200 mb-8 max-w-3xl mx-auto md:mx-0"
            >
              Your secure, QR-based platform for streamlined office visitor management and access control.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
              className="flex flex-col sm:flex-row justify-center md:justify-start gap-4"
            >
              <button
                onClick={() => navigate('/get-started')}
                className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 hover:shadow-lg transform hover:scale-105 transition-all duration-200 shadow-md"
              >
                Get Started
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-indigo-100 hover:text-indigo-600 hover:border-indigo-100 transition-all duration-200 shadow-md"
              >
                Back to Home
              </button>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex-1 flex justify-center mt-6 md:mt-0"
          >
            <div className="relative max-w-xs mx-auto">
              {/* QR Code Display Frame */}
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 shadow-2xl border-2 border-slate-900 overflow-hidden">
                {/* Header */}
                <div className="bg-indigo-600 text-white p-3 rounded-t-lg text-center font-semibold text-sm flex items-center justify-between">
                  <span className="flex items-center">
                    <QrCode className="w-5 h-5 mr-2" />
                    QRVibe Code
                  </span>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-white/30 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
                {/* QR Code Area */}
                <div className="bg-white rounded-lg p-6 flex flex-col items-center justify-center relative">
                  {/* Mock QR Code */}
                  <div className="w-48 h-48 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg relative overflow-hidden shadow-inner">
                    {/* QR Code Pattern (Static Mockup) */}
                    <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-1 p-2">
                      {[...Array(36)].map((_, i) => (
                        <div
                          key={i}
                          className={`${
                            Math.random() > 0.5 ? 'bg-slate-900' : 'bg-white'
                          } rounded-sm`}
                        ></div>
                      ))}
                    </div>
                    {/* Corner Markers */}
                    <div className="absolute top-2 left-2 w-8 h-8 border-2 border-slate-900 rounded-sm">
                      <div className="absolute inset-1 border-2 border-slate-900 rounded-sm"></div>
                    </div>
                    <div className="absolute top-2 right-2 w-8 h-8 border-2 border-slate-900 rounded-sm">
                      <div className="absolute inset-1 border-2 border-slate-900 rounded-sm"></div>
                    </div>
                    <div className="absolute bottom-2 left-2 w-8 h-8 border-2 border-slate-900 rounded-sm">
                      <div className="absolute inset-1 border-2 border-slate-900 rounded-sm"></div>
                    </div>
                    {/* Scanning Animation Overlay */}
                    <motion.div
                      className="absolute top-0 left-0 w-full h-2 bg-indigo-500/50"
                      animate={{ y: [0, 176, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    />
                  </div>
                  {/* Glowing Effect */}
                  <div className="absolute -inset-4 bg-indigo-400/20 blur-md animate-pulse rounded-lg"></div>
                  <p className="text-slate-800 text-center font-semibold text-sm mt-4">
                    Scan this QR Code to Begin
                  </p>
                  <p className="text-slate-600 text-center text-xs mt-1">
                    Use your device’s camera to access the check-in form
                  </p>
                </div>
                {/* Footer */}
                <div className="bg-slate-50/80 p-3 rounded-b-lg flex justify-center">
                  <button className="text-slate-600 flex items-center text-xs font-medium hover:text-indigo-600 transition-colors">
                    <Info className="w-4 h-4 mr-1" />
                    Learn More
                  </button>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-indigo-500 rounded-full opacity-10 blur-2xl z-0 animate-pulse"></div>
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-purple-500 rounded-full opacity-10 blur-2xl z-0 animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-2xl -z-10"></div>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse"></div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <Info className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-semibold text-slate-900">
                Welcome to QRVibe
              </h2>
            </div>
            <div className="space-y-4 text-slate-600">
              <p>
                QRVibe is a cutting-edge platform designed to streamline and secure office visitor management. Using QR codes and location-based validation, QRVibe ensures only authorized visitors gain access to your workplace.
              </p>
              <p>
                Whether you're a visitor checking in for a meeting or an organization managing access, QRVibe offers a seamless, secure, and efficient experience. Our platform leverages advanced geolocation technology to verify visitors are at the correct office location before granting access.
              </p>
            </div>
          </motion.div>

          {/* Prerequisites */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <Info className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-semibold text-slate-900">
                Before You Begin
              </h2>
            </div>
            <div className="space-y-4 text-slate-600">
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
          </motion.div>

          {/* Step-by-Step Guide */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <Info className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-semibold text-slate-900">
                Step-by-Step Instructions
              </h2>
            </div>

            <div className="space-y-8">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white border border-slate-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-indigo-50 rounded-full p-3">
                    <QrCode className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">
                      1. Scan the QR Code
                    </h3>
                    <div className="space-y-3 text-slate-600">
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
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white border border-slate-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-indigo-50 rounded-full p-3">
                    <MapPin className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">
                      2. Allow Location Access
                    </h3>
                    <div className="space-y-3 text-slate-600">
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
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white border border-slate-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-indigo-50 rounded-full p-3">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">
                      3. Complete the Check-In Form
                    </h3>
                    <div className="space-y-3 text-slate-600">
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
              </motion.div>

              {/* Step 4 */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-white border border-slate-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-indigo-50 rounded-full p-3">
                    <CheckCircle className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">
                      4. Submit and Receive Your Digital Pass
                    </h3>
                    <div className="space-y-3 text-slate-600">
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
              </motion.div>
            </div>
          </motion.div>

          {/* Troubleshooting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-semibold text-slate-900">
                Troubleshooting Common Issues
              </h2>
            </div>
            <div className="space-y-4">
              <div className="bg-red-50 p-6 rounded-lg">
                <p className="font-medium text-red-600 mb-2">
                  "Unable to Retrieve Location" Error
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-4">
                  <li>Refresh the page and select “Allow” for location access.</li>
                  <li>Verify that location services are enabled in your device settings.</li>
                </ul>
              </div>
              <div className="bg-yellow-50 p-6 rounded-lg">
                <p className="font-medium text-yellow-600 mb-2">
                  "You Are Not Within the Allowed Range" Error
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-4">
                  <li>Ensure you are at the designated office location.</li>
                  <li>Confirm the QR code’s location requirements with the office reception.</li>
                </ul>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="font-medium text-blue-600 mb-2">
                  "Failed to Submit Form" Error
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-4">
                  <li>Verify all required fields (e.g., name, email) are completed.</li>
                  <li>Ensure your internet connection is stable.</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* FAQs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <Info className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-semibold text-slate-900">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <p className="font-medium text-slate-900">
                  Q: Do I need an account to use QRVibe for visitor check-in?
                </p>
                <p className="text-slate-600 mt-2">
                  No, QRVibe’s check-in process is account-free and accessible via QR code.
                </p>
              </div>
              <div className="border-b border-slate-200 pb-4">
                <p className="font-medium text-slate-900">
                  Q: What if I’m not at the office location?
                </p>
                <p className="text-slate-600 mt-2">
                  You’ll receive an “Access Denied” message and cannot submit the form until you’re at the correct location.
                </p>
              </div>
              <div className="border-b border-slate-200 pb-4">
                <p className="font-medium text-slate-900">
                  Q: Can I reuse the same QR code for multiple visits?
                </p>
                <p className="text-slate-600 mt-2">
                  QR codes are typically single-use for security. Contact the office for a new QR code for each visit.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Contact Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-semibold text-slate-900">
                Contact QRVibe Support
              </h2>
            </div>
            <div className="space-y-4 text-slate-600">
              <p>Need assistance with QRVibe? Our support team is ready to help with any issues or questions.</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>
                  <span className="font-medium">Email</span>: <a href="mailto:support@qrvibe.com" className="hover:text-indigo-600 transition-colors duration-200">support@qrvibe.com</a>
                </li>
                <li>
                  <span className="font-medium">Response Time</span>: Within 24 hours on business days
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-indigo-700 to-purple-700 text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <h2 className="text-3xl font-bold mb-4">
            Ready to Streamline Visitor Management?
          </h2>
          <p className="text-lg text-slate-200 mb-8 max-w-2xl mx-auto">
            Experience secure and efficient office check-ins with QRVibe’s innovative platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/get-started')}
              className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 hover:shadow-lg transform hover:scale-105 transition-all duration-200 shadow-md"
            >
              Get Started Now
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-indigo-100 hover:text-indigo-600 hover:border-indigo-100 transition-all duration-200 shadow-md"
            >
              Contact Support
            </button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">QRVibe</h3>
              <p className="text-slate-400 text-[12px]">
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
                      className="text-slate-400 hover:text-indigo-400 transition-colors duration-200"
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
                      className="text-slate-400 hover:text-indigo-400 transition-colors duration-200"
                    >
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Connect</h3>
              <p className="text-slate-400 text-[12px] mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                <a href="mailto:support@qrvibe.com" className="hover:text-indigo-400 transition-colors duration-200">
                  support@qrvibe.com
                </a>
              </p>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors duration-200">
                  <Twitter className="w-5 h-5" />
                  <span className="sr-only">Twitter</span>
                </a>
                <a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors duration-200">
                  <Linkedin className="w-5 h-5" />
                  <span className="sr-only">LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-700 pt-6 text-center">
            <p className="text-slate-400 text-[12px]">
              © {new Date().getFullYear()} QRVibe Technologies. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}