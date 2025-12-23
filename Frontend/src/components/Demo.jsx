// Demo.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
  UserIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

export default function Demo() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{8,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Demo request submitted successfully!', {
        icon: <CheckCircleIcon className="w-5 h-5 text-indigo-600" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
      setFormData({ name: '', email: '', phone: '', message: '' });
      navigate('/');
    } catch (err) {
      toast.error('Failed to submit demo request', {
        icon: <CheckCircleIcon className="w-5 h-5 text-red-500" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-[12px] font-[Inter] antialiased">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            fontSize: '14px',
            background: '#ffffff',
            color: '#1e293b',
            padding: '12px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
          success: { iconTheme: { primary: '#4f46e5', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
      {/* Header */}
      <section className="relative bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <h5 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Request a QRVibe Demo
          </h5>
          <p className="text-lg sm:text-xl md:text-2xl text-indigo-100 dark:text-indigo-200 mb-8 max-w-4xl mx-auto">
            Discover how QRVibe revolutionizes visitor management with a tailored demo. Our team will showcase key features, address your needs, and guide you through a seamless experience. Complete the form below to schedule your session.
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-[12px] text-white hover:text-indigo-200 dark:hover:text-indigo-300 underline transition-colors duration-200"
            aria-label="Return to home"
          >
            Back to Home
          </button>
        </div>
      </section>

      {/* Demo Request Form */}
      <section className="py-16 sm:py-20 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-10 sm:p-12">
            <h5 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 text-center mb-8">
              Schedule Your Demo
            </h5>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Name Field */}
              <div className="space-y-1.5">
                <label className="flex items-center text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                  <UserIcon className="w-5 h-5 mr-1.5 text-slate-500 dark:text-slate-400" />
                  Full Name <span className="text-indigo-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 text-[12px] rounded-md border ${
                    errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                  placeholder="John Doe"
                  aria-required="true"
                  aria-label="Full Name"
                  aria-describedby="name-helper name-error"
                  aria-invalid={!!errors.name}
                />
                <p id="name-helper" className="text-[12px] italic text-slate-500 dark:text-slate-400">
                  Your name for personalized demo communication.
                </p>
                {errors.name && (
                  <p id="name-error" className="text-[12px] text-red-500 dark:text-red-400">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="flex items-center text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                  <EnvelopeIcon className="w-5 h-5 mr-1.5 text-slate-500 dark:text-slate-400" />
                  Email Address <span className="text-indigo-500 ml-1">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 text-[12px] rounded-md border ${
                    errors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                  placeholder="john.doe@example.com"
                  aria-required="true"
                  aria-label="Email Address"
                  aria-describedby="email-helper email-error"
                  aria-invalid={!!errors.email}
                />
                <p id="email-helper" className="text-[12px] italic text-slate-500 dark:text-slate-400">
                  Your work email for scheduling details.
                </p>
                {errors.email && (
                  <p id="email-error" className="text-[12px] text-red-500 dark:text-red-400">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone Number Field */}
              <div className="space-y-1.5">
                <label className="flex items-center text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                  <PhoneIcon className="w-5 h-5 mr-1.5 text-slate-500 dark:text-slate-400" />
                  Phone Number <span className="text-indigo-500 ml-1">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 text-[12px] rounded-md border ${
                    errors.phone ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                  placeholder="+1 (123) 456-7890"
                  aria-required="true"
                  aria-label="Phone Number"
                  aria-describedby="phone-helper phone-error"
                  aria-invalid={!!errors.phone}
                />
                <p id="phone-helper" className="text-[12px] italic text-slate-500 dark:text-slate-400">
                  Your contact number for demo confirmation.
                </p>
                {errors.phone && (
                  <p id="phone-error" className="text-[12px] text-red-500 dark:text-red-400">
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Message Field */}
              <div className="space-y-1.5">
                <label className="flex items-center text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                  <DocumentTextIcon className="w-5 h-5 mr-1.5 text-slate-500 dark:text-slate-400" />
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 text-[12px] rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="Share your visitor management needs or questions for the demo..."
                  aria-label="Message"
                  aria-describedby="message-helper"
                ></textarea>
                <p id="message-helper" className="text-[12px] italic text-slate-500 dark:text-slate-400">
                  Optional details to tailor your demo experience.
                </p>
              </div>

              {/* Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 flex items-center justify-center px-6 py-3 text-[12px] font-medium rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 hover:shadow-lg transition-all duration-200 shadow-md ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                  } focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                  aria-label="Submit demo request"
                >
                  {isSubmitting ? (
                    <svg
                      className="w-5 h-5 mr-2 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                  )}
                  {isSubmitting ? 'Submitting...' : 'Submit Demo Request'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex-1 flex items-center justify-center px-6 py-3 text-[12px] font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:shadow-lg transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  aria-label="Cancel"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}