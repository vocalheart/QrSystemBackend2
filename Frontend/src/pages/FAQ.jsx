import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDownIcon,
  ArrowRightIcon,
  EnvelopeIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-[12px]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-pink-500 to-purple-500 dark:from-pink-600 dark:to-purple-600 text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 animate-fade-in">
            Frequently Asked Questions
          </h1>
          <p className="text-lg sm:text-xl text-pink-100 dark:text-pink-200 mb-8 max-w-3xl mx-auto">
            Find answers to common questions about QRVibe
          </p>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 to-purple-400 dark:from-pink-500 dark:to-purple-500 animate-pulse"></div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full flex justify-between items-center p-6 text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  <h2 className="text-lg font-medium text-gray-800 dark:text-white">
                    {faq.question}
                  </h2>
                  <ChevronDownIcon 
                    className={`w-5 h-5 text-pink-600 dark:text-pink-400 transition-transform duration-200 ${
                      activeIndex === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                <div 
                  className={`px-6 pb-6 pt-0 bg-white dark:bg-gray-800 transition-all duration-300 ${
                    activeIndex === index ? 'block' : 'hidden'
                  }`}
                >
                  <p className="text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 md:p-12 bg-pink-50 dark:bg-pink-900/10">
                <div className="flex items-center mb-4">
                  <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-pink-600 dark:text-pink-400 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Still Need Help?
                  </h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Our support team is ready to assist you with any questions not covered in our FAQs.
                </p>
                <button
                  onClick={() => navigate('/contact')}
                  className="px-6 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition-colors duration-300 shadow-md hover:scale-105 inline-flex items-center"
                >
                  Contact Support <ArrowRightIcon className="w-4 h-4 ml-2" />
                </button>
              </div>
              <div className="p-8 md:p-12">
                <div className="flex items-center mb-4">
                  <EnvelopeIcon className="w-8 h-8 text-pink-600 dark:text-pink-400 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Email Us Directly
                  </h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Prefer to email? Send your questions to our support team and we'll get back to you within 24 hours.
                </p>
                <a
                  href="mailto:support@qrvibe.com"
                  className="px-6 py-3 bg-white dark:bg-gray-700 border border-pink-600 text-pink-600 dark:text-pink-400 font-semibold rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors duration-300 shadow-md hover:scale-105 inline-flex items-center"
                >
                  support@qrvibe.com <ArrowRightIcon className="w-4 h-4 ml-2" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-12">
            Related Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              onClick={() => navigate('/usage')}
              className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            >
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                How QRVibe Works
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Learn about the step-by-step process for scanning QR codes and submitting forms.
              </p>
              <div className="text-pink-600 dark:text-pink-400 font-medium flex items-center">
                Learn more <ArrowRightIcon className="w-4 h-4 ml-1" />
              </div>
            </div>
            <div 
              onClick={() => navigate('/get-started')}
              className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            >
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                Getting Started Guide
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                New to QRVibe? Follow our beginner's guide to start using the platform.
              </p>
              <div className="text-pink-600 dark:text-pink-400 font-medium flex items-center">
                Get started <ArrowRightIcon className="w-4 h-4 ml-1" />
              </div>
            </div>
            <div 
              onClick={() => navigate('/contact')}
              className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            >
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                Technical Support
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Need technical assistance? Contact our support team for help.
              </p>
              <div className="text-pink-600 dark:text-pink-400 font-medium flex items-center">
                Contact us <ArrowRightIcon className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}