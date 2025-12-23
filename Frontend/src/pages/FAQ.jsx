import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronDownIcon,
  ArrowRightIcon,
  EnvelopeIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline';
import { QrCode } from "lucide-react";

export default function FAQ() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "How do I scan a QR code with QRVibe?",
      answer: "Simply open your smartphone's camera app and point it at the QR code. When a notification appears, tap it to open the QRVibe form in your browser. Alternatively, you can use a QR scanner app from your device's app store."
    },
    {
      question: "Why is my location not being recognized?",
      answer: "Make sure you've enabled location services for your browser in your device settings. Also ensure you're physically present at the required location when scanning. If issues persist, try refreshing the page or moving to an area with better GPS signal."
    },
    {
      question: "Is my data secure with QRVibe?",
      answer: "Yes, QRVibe uses end-to-end encryption for all form submissions. Your data is only accessible to the organization that provided the QR code. We never store sensitive information beyond what's necessary for the submission process."
    },
    {
      question: "What should I do if the form submission fails?",
      answer: "First, check your internet connection. If the problem continues, ensure all required fields are filled correctly. For file uploads, verify the file type and size meet the requirements. If the issue persists, contact the organization that provided the QR code."
    },
    {
      question: "Can I use QRVibe without an internet connection?",
      answer: "You need an active internet connection to submit forms through QRVibe. However, you can scan QR codes offline - the form will load once your device reconnects to the internet."
    },
    {
      question: "How do organizations create QRVibe codes?",
      answer: "Organizations can generate QRVibe codes through our dashboard after creating an account. The process includes setting up the form fields, location requirements, and customizing the submission workflow."
    },
    {
      question: "What types of forms can be submitted via QRVibe?",
      answer: "QRVibe supports various form types including job applications, event registrations, visitor check-ins, feedback forms, and more. Organizations can customize fields to collect the specific information they need."
    },
    {
      question: "How long does it take to receive confirmation after submission?",
      answer: "Confirmations are typically instant. You'll receive an on-screen confirmation and may get an email receipt if the organization has enabled this feature. If you don't receive confirmation, check your spam folder or contact the organization."
    }
  ];

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
              Frequently Asked Questions
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="text-lg sm:text-xl text-slate-200 mb-8 max-w-3xl mx-auto md:mx-0"
            >
              Find answers to common questions about using QRVibe’s QR-based visitor management system.
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
                onClick={() => navigate('/usage')}
                className="px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-indigo-100 hover:text-indigo-600 hover:border-indigo-100 transition-all duration-200 shadow-md"
              >
                Learn How to Use
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
              <div className="relative bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl p-4 shadow-2xl border-2 border-indigo-800 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white p-3 rounded-t-lg text-center font-semibold text-sm flex items-center justify-between">
                  <span className="flex items-center">
                    <QrCode className="w-5 h-5 mr-2" />
                    QRVibe FAQ Access
                  </span>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
                {/* QR Code Area */}
                <div className="bg-white rounded-lg p-6 flex flex-col items-center justify-center relative">
                  {/* Mock QR Code */}
                  <div className="w-52 h-52 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-lg relative overflow-hidden shadow-inner">
                    {/* QR Code Pattern (Static Mockup) */}
                    <div className="absolute inset-0 grid grid-cols-7 grid-rows-7 gap-1 p-2">
                      {[...Array(49)].map((_, i) => (
                        <div
                          key={i}
                          className={`${
                            Math.random() > 0.5 ? 'bg-slate-900' : 'bg-white'
                          } rounded-sm`}
                        ></div>
                      ))}
                    </div>
                    {/* Corner Markers */}
                    <div className="absolute top-2 left-2 w-9 h-9 border-3 border-indigo-600 rounded-md">
                      <div className="absolute inset-1 border-3 border-indigo-600 rounded-sm"></div>
                    </div>
                    <div className="absolute top-2 right-2 w-9 h-9 border-3 border-indigo-600 rounded-md">
                      <div className="absolute inset-1 border-3 border-indigo-600 rounded-sm"></div>
                    </div>
                    <div className="absolute bottom-2 left-2 w-9 h-9 border-3 border-indigo-600 rounded-md">
                      <div className="absolute inset-1 border-3 border-indigo-600 rounded-sm"></div>
                    </div>
                    {/* Scanning Animation Overlay */}
                    <motion.div
                      className="absolute top-0 left-0 w-full h-2 bg-indigo-600/40"
                      animate={{ y: [0, 188, 0] }}
                      transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
                    />
                  </div>
                  {/* Glowing Effect */}
                  <div className="absolute -inset-4 bg-indigo-500/20 blur-lg animate-pulse rounded-lg"></div>
                  <p className="text-slate-800 text-center font-semibold text-sm mt-4">
                    Scan for QRVibe Support
                  </p>
                  <p className="text-slate-600 text-center text-xs mt-1">
                    Access quick guides and support resources
                  </p>
                </div>
                {/* Footer */}
                <div className="bg-slate-50/90 p-3 rounded-b-lg flex justify-center">
                  <button
                    onClick={() => navigate('/usage')}
                    className="text-slate-600 flex items-center text-xs font-medium hover:text-indigo-600 transition-colors"
                  >
                    <QrCode className="w-4 h-4 mr-1" />
                    How to Scan
                  </button>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-indigo-600 rounded-full opacity-15 blur-2xl z-0 animate-pulse"></div>
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-purple-600 rounded-full opacity-15 blur-2xl z-0 animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl -z-10"></div>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse"></div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="border border-slate-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full flex justify-between items-center p-6 text-left bg-slate-50 hover:bg-indigo-50 transition-colors duration-200"
                >
                  <h2 className="text-lg font-medium text-slate-900">
                    {faq.question}
                  </h2>
                  <ChevronDownIcon 
                    className={`w-5 h-5 text-indigo-600 transition-transform duration-200 ${
                      activeIndex === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                <div 
                  className={`px-6 pb-6 pt-0 bg-white transition-all duration-300 ${
                    activeIndex === index ? 'block' : 'hidden'
                  }`}
                >
                  <p className="text-slate-600">
                    {faq.answer}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 md:p-12 bg-indigo-50">
                <div className="flex items-center mb-4">
                  <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-indigo-600 mr-3" />
                  <h2 className="text-2xl font-bold text-slate-900">
                    Still Need Help?
                  </h2>
                </div>
                <p className="text-slate-600 mb-6">
                  Our support team is ready to assist you with any questions not covered in our FAQs.
                </p>
                <button
                  onClick={() => navigate('/contact')}
                  className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-300 shadow-md hover:scale-105 inline-flex items-center"
                >
                  Contact Support <ArrowRightIcon className="w-4 h-4 ml-2" />
                </button>
              </div>
              <div className="p-8 md:p-12">
                <div className="flex items-center mb-4">
                  <EnvelopeIcon className="w-8 h-8 text-indigo-600 mr-3" />
                  <h2 className="text-2xl font-bold text-slate-900">
                    Email Us Directly
                  </h2>
                </div>
                <p className="text-slate-600 mb-6">
                  Prefer to email? Send your questions to our support team and we'll get back to you within 24 hours.
                </p>
                <a
                  href="mailto:support@qrvibe.com"
                  className="px-6 py-3 bg-white border border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors duration-300 shadow-md hover:scale-105 inline-flex items-center"
                >
                  support@qrvibe.com <ArrowRightIcon className="w-4 h-4 ml-2" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-3xl font-bold text-slate-900 text-center mb-12"
          >
            Related Resources
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              onClick={() => navigate('/usage')}
              className="bg-slate-50 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            >
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                How QRVibe Works
              </h3>
              <p className="text-slate-600 mb-4">
                Learn about the step-by-step process for scanning QR codes and submitting forms.
              </p>
              <div className="text-indigo-600 font-medium flex items-center">
                Learn more <ArrowRightIcon className="w-4 h-4 ml-1" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              onClick={() => navigate('/get-started')}
              className="bg-slate-50 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            >
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Getting Started Guide
              </h3>
              <p className="text-slate-600 mb-4">
                New to QRVibe? Follow our beginner's guide to start using the platform.
              </p>
              <div className="text-indigo-600 font-medium flex items-center">
                Get started <ArrowRightIcon className="w-4 h-4 ml-1" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              onClick={() => navigate('/contact')}
              className="bg-slate-50 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            >
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Technical Support
              </h3>
              <p className="text-slate-600 mb-4">
                Need technical assistance? Contact our support team for help.
              </p>
              <div className="text-indigo-600 font-medium flex items-center">
                Contact us <ArrowRightIcon className="w-4 h-4 ml-1" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}