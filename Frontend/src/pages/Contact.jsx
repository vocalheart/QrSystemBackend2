import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function Contact() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', message: '' });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-[12px] font-[Inter] antialiased">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 animate-fade-in">
            Contact QRVibe
          </h1>
          <p className="text-lg sm:text-xl text-indigo-100 dark:text-indigo-200 mb-8 max-w-3xl mx-auto">
            We're here to help! Reach out to our team for support, inquiries, or partnership opportunities.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 animate-pulse"></div>
      </section>

      {/* Contact Options */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-slate-50 dark:bg-slate-700 p-8 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center">
                <ChatBubbleBottomCenterTextIcon className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
                Send Us a Message
              </h2>
              
              {submitSuccess ? (
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 p-4 rounded-lg mb-6">
                  Thank you for your message! We'll get back to you soon.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Your Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows="5"
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      required
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 hover:bg-gradient-to-r hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 shadow-sm ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
                Contact Information
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/20 p-3 rounded-lg">
                    <EnvelopeIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Email Us</h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                      <a href="mailto:support@qrvibe.com" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline">
                        support@qrvibe.com
                      </a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/20 p-3 rounded-lg">
                    <PhoneIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Call Us</h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                      <a href="tel:+911234567890" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline">
                        +91 123 456 7890
                      </a>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                      Monday to Friday, 9am to 6pm IST
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/20 p-3 rounded-lg">
                    <MapPinIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Our Office</h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                      123 Tech Park, Sector 22<br />
                      Bengaluru, Karnataka 560001<br />
                      India
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/20 p-3 rounded-lg">
                    <ClockIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Business Hours</h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                      Monday - Friday: 9:00 AM - 6:00 PM<br />
                      Saturday: 10:00 AM - 2:00 PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="py-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            Have Questions?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Check out our FAQs for quick answers to common questions about QRVibe.
          </p>
          <button
            onClick={() => navigate('/faq')}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 transition-colors duration-300 shadow-md hover:scale-105 inline-flex items-center"
          >
            Visit FAQ Page <ArrowRightIcon className="w-4 h-4 ml-2" />
          </button>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 text-center mb-12">
            Meet Our Team
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: 'Aarav Patel',
                role: 'Customer Support',
                email: 'aarav@qrvibe.com',
                img: 'https://randomuser.me/api/portraits/men/32.jpg'
              },
              {
                name: 'Priya Sharma',
                role: 'Technical Support',
                email: 'priya@qrvibe.com',
                img: 'https://randomuser.me/api/portraits/women/44.jpg'
              },
              {
                name: 'Rohan Singh',
                role: 'Sales Executive',
                email: 'rohan@qrvibe.com',
                img: 'https://randomuser.me/api/portraits/men/22.jpg'
              },
              {
                name: 'Neha Gupta',
                role: 'Implementation Specialist',
                email: 'neha@qrvibe.com',
                img: 'https://randomuser.me/api/portraits/women/68.jpg'
              }
            ].map((member, index) => (
              <div key={index} className="bg-slate-50 dark:bg-slate-700 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-indigo-500">
                  <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{member.name}</h3>
                <p className="text-indigo-600 dark:text-indigo-400 mb-2">{member.role}</p>
                <a 
                  href={`mailto:${member.email}`} 
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
                >
                  {member.email}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-indigo-100 dark:text-indigo-200 mb-8 max-w-2xl mx-auto">
            Contact us today to learn how QRVibe can streamline your application processes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/get-started')}
              className="px-6 py-3 bg-white text-indigo-600 dark:text-indigo-400 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-300 shadow-md hover:scale-105"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300 shadow-md hover:scale-105"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}