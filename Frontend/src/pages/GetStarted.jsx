
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, ArrowRight, Users, BarChart2, Mail } from 'lucide-react';

export default function GetStarted() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 text-slate-900 font-[Inter] text-[12px]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 sm:py-24">
        <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 opacity-20 blur-3xl animate-pulse z-0" />
        <div className="absolute bottom-8 right-8 w-80 h-80 rounded-full bg-gradient-to-r from-purple-300 to-indigo-300 opacity-20 blur-3xl animate-pulse z-0" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-4xl sm:text-5xl font-bold mb-4"
          >
            Get Started with QRVibe
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="text-lg sm:text-xl text-slate-200 mb-8 max-w-3xl mx-auto"
          >
            Streamline office visitor management with secure, QR-based check-in technology.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <button
              onClick={() => navigate('/usage')}
              className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 hover:shadow-lg transform hover:scale-105 transition-all duration-200 shadow-md"
            >
              How It Works
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-indigo-100 hover:text-indigo-600 hover:border-indigo-100 transition-all duration-200 shadow-md"
            >
              Contact Us
            </button>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse"></div>
      </section>

      {/* Options Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-3xl font-bold text-slate-900 text-center mb-12"
          >
            How to Begin
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white border border-slate-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center mb-4">
                <QrCode className="w-10 h-10 text-indigo-600 mr-4" />
                <h3 className="text-xl font-semibold text-slate-900">
                  As a Visitor
                </h3>
              </div>
              <p className="text-slate-600 mb-4">
                Scan a QR code at the office entrance to check in securely and receive a digital visitor pass.
              </p>
              <button
                onClick={() => navigate('/usage')}
                className="flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Learn how to check in <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white border border-slate-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center mb-4">
                <Users className="w-10 h-10 text-indigo-600 mr-4" />
                <h3 className="text-xl font-semibold text-slate-900">
                  As an Organization
                </h3>
              </div>
              <p className="text-slate-600 mb-4">
                Create QR codes to manage visitor check-ins, enhance security, and streamline access control.
              </p>
              <button
                onClick={() => navigate('/contact')}
                className="flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Get started <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-3xl font-bold text-slate-900 text-center mb-12"
          >
            Why Choose QRVibe?
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <QrCode className="w-8 h-8 text-indigo-600" />,
                title: 'Secure Check-Ins',
                desc: 'Encrypted QR codes ensure only authorized visitors gain access.',
              },
              {
                icon: <BarChart2 className="w-8 h-8 text-indigo-600" />,
                title: 'Efficient Management',
                desc: 'Streamline visitor tracking and access control processes.',
              },
              {
                icon: <Users className="w-8 h-8 text-indigo-600" />,
                title: 'User-Friendly',
                desc: 'Intuitive check-in process for visitors of all tech levels.',
              },
              {
                icon: <Mail className="w-8 h-8 text-indigo-600" />,
                title: 'Real-Time Updates',
                desc: 'Instant notifications for visitor check-ins and pass issuance.',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white border border-slate-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center mb-3">
                  {feature.icon}
                  <h3 className="text-lg font-semibold text-slate-900 ml-3">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-slate-600">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
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
            Ready to Enhance Your Office Security?
          </h2>
          <p className="text-lg text-slate-200 mb-8 max-w-2xl mx-auto">
            QRVibe makes visitor check-ins secure, fast, and effortless for both visitors and organizations.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/usage')}
              className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 hover:shadow-lg transform hover:scale-105 transition-all duration-200 shadow-md"
            >
              Learn More
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-indigo-100 hover:text-indigo-600 hover:border-indigo-100 transition-all duration-200 shadow-md"
            >
              Contact Us
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
