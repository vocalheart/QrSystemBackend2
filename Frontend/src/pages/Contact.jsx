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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-[12px]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-pink-500 to-purple-500 dark:from-pink-600 dark:to-purple-600 text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 animate-fade-in">
            Contact QRVibe
          </h1>
          <p className="text-lg sm:text-xl text-pink-100 dark:text-pink-200 mb-8 max-w-3xl mx-auto">
            We're here to help! Reach out to our team for support, inquiries, or partnership opportunities.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 to-purple-400 dark:from-pink-500 dark:to-purple-500 animate-pulse"></div>
      </section>

      {/* Contact Options */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-gray-50 dark:bg-gray-700 p-8 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <ChatBubbleBottomCenterTextIcon className="w-6 h-6 mr-2 text-pink-600 dark:text-pink-400" />
                Send Us a Message
              </h2>
              
              {submitSuccess ? (
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 p-4 rounded-lg mb-6">
                  Thank you for your message! We'll get back to you soon.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Your Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows="5"
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      required
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 px-4 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition duration-200 ${
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
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                Contact Information
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-pink-100 dark:bg-pink-900/20 p-3 rounded-lg">
                    <EnvelopeIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white">Email Us</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      <a href="mailto:support@qrvibe.com" className="text-pink-600 dark:text-pink-400 hover:underline">
                        support@qrvibe.com
                      </a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-pink-100 dark:bg-pink-900/20 p-3 rounded-lg">
                    <PhoneIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white">Call Us</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      <a href="tel:+911234567890" className="text-pink-600 dark:text-pink-400 hover:underline">
                        +91 123 456 7890
                      </a>
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                      Monday to Friday, 9am to 6pm IST
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-pink-100 dark:bg-pink-900/20 p-3 rounded-lg">
                    <MapPinIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white">Our Office</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      123 Tech Park, Sector 22<br />
                      Bengaluru, Karnataka 560001<br />
                      India
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-pink-100 dark:bg-pink-900/20 p-3 rounded-lg">
                    <ClockIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white">Business Hours</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
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
      <section className="py-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            Have Questions?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Check out our FAQs for quick answers to common questions about QRVibe.
          </p>
          <button
            onClick={() => navigate('/faq')}
            className="px-6 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition-colors duration-300 shadow-md hover:scale-105 inline-flex items-center"
          >
            Visit FAQ Page <ArrowRightIcon className="w-4 h-4 ml-2" />
          </button>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-12">
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
              <div key={index} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-pink-500">
                  <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{member.name}</h3>
                <p className="text-pink-600 dark:text-pink-400 mb-2">{member.role}</p>
                <a 
                  href={`mailto:${member.email}`} 
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:underline"
                >
                  {member.email}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-pink-600 dark:bg-pink-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-pink-100 dark:text-pink-200 mb-8 max-w-2xl mx-auto">
            Contact us today to learn how QRVibe can streamline your application processes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/get-started')}
              className="px-6 py-3 bg-white text-pink-600 dark:text-pink-400 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 shadow-md hover:scale-105"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors duration-300 shadow-md hover:scale-105"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}