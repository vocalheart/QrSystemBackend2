import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  MapPin,
  CheckCircle,
  FileText,
  Users,
  Mail,
  User,
  Building2,
  Twitter,
  Linkedin,
} from 'lucide-react';

import img1 from '../assets/qrbased.png'

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 text-slate-900" style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
      {/* QR Code Hero Section */}
      <section className="relative py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-8">
          {/* LEFT SIDE - IMAGE SECTION WITH WHITE BG */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="flex-1 text-center md:text-left"
          >
            {/* WHITE BG FOR IMAGE SECTION */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl">
              {/* RESPONSIVE IMAGE */}
              <div className="w-full max-w-md mx-auto mb-6">
                <img 
                  src={img1} 
                  alt="QRVibe Hero"
                  className="w-full h-auto max-h-64 object-contain rounded-lg"
                />
              </div>
              
              {/* BUTTONS WITH bg-indigo-500 text-white */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
              >
                <button
                  onClick={() => navigate('/get-started')}
                  className="px-6 py-3 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200 shadow-md flex-1 sm:flex-none"
                >
                  Get Started
                </button>
                <button
                  onClick={() => navigate('/usage')}
                  className="px-6 py-3 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200 shadow-md flex-1 sm:flex-none"
                >
                  Learn More
                </button>
              </motion.div>
            </div>
          </motion.div>
          
          {/* RIGHT SIDE - QR CODE */}
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
                    QRVibe Access Code
                  </span>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
                {/* QR Code Area */}
                <div className="bg-white rounded-lg p-6 flex flex-col items-center justify-center relative">
                  {/* Mock QR Code */}
                  <div className="w-56 h-56 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-lg relative overflow-hidden shadow-inner">
                    {/* QR Code Pattern (Static Mockup) */}
                    <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-1 p-2">
                      {[...Array(64)].map((_, i) => (
                        <div
                          key={i}
                          className={`${
                            Math.random() > 0.5 ? 'bg-slate-900' : 'bg-white'
                          } rounded-sm`}
                        ></div>
                      ))}
                    </div>
                    {/* Corner Markers */}
                    <div className="absolute top-2 left-2 w-10 h-10 border-3 border-indigo-600 rounded-md">
                      <div className="absolute inset-1 border-3 border-indigo-600 rounded-sm"></div>
                    </div>
                    <div className="absolute top-2 right-2 w-10 h-10 border-3 border-indigo-600 rounded-md">
                      <div className="absolute inset-1 border-3 border-indigo-600 rounded-sm"></div>
                    </div>
                    <div className="absolute bottom-2 left-2 w-10 h-10 border-3 border-indigo-600 rounded-md">
                      <div className="absolute inset-1 border-3 border-indigo-600 rounded-sm"></div>
                    </div>
                    {/* Scanning Animation Overlay */}
                    <motion.div
                      className="absolute top-0 left-0 w-full h-3 bg-indigo-600/40"
                      animate={{ y: [0, 208, 0] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                    />
                  </div>
                  {/* Glowing Effect */}
                  <div className="absolute -inset-4 bg-indigo-500/20 blur-lg animate-pulse rounded-lg"></div>
                  <p className="text-slate-800 text-center font-semibold text-sm mt-4">
                    Scan to Access QRVibe
                  </p>
                  <p className="text-slate-600 text-center text-xs mt-1">
                    Use your smartphone to start the check-in process
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
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-2xl font-bold text-slate-900 text-center mb-8"
          >
            Why Choose QRVibe for Visitor Management
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <QrCode className="w-8 h-8 text-indigo-600" />,
                title: "Secure QR Check-Ins",
                desc: "Unique QR codes ensure only authorized visitors can check in securely, protecting your workplace.",
              },
              {
                icon: <MapPin className="w-8 h-8 text-indigo-600" />,
                title: "Location Verification",
                desc: "Validate visitor locations to ensure check-ins occur at designated office premises, enhancing security.",
              },
              {
                icon: <CheckCircle className="w-8 h-8 text-indigo-600" />,
                title: "Instant Digital Passes",
                desc: "Generate digital visitor passes instantly upon check-in for seamless access control.",
              },
              {
                icon: <FileText className="w-8 h-8 text-indigo-600" />,
                title: "Streamlined Registration",
                desc: "Easy-to-use forms simplify visitor registration, capturing essential details efficiently.",
              },
            ].map(({ icon, title, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group p-5 rounded-lg bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                  {icon}
                </div>
                <h3 className="font-semibold text-slate-900 text-center mb-2">{title}</h3>
                <p className="text-slate-600 text-center">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 py-12 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-2xl font-bold text-slate-900 text-center mb-8"
          >
            How QRVibe Manages Visitors
          </motion.h2>
          <div className="space-y-10">
            {[
              {
                icon: <QrCode className="w-6 h-6 text-indigo-600" />,
                title: "1. Scan the QR Code",
                desc: "Visitors scan a unique QR code at the office entrance using a smartphone to access the secure check-in form.",
              },
              {
                icon: <MapPin className="w-6 h-6 text-indigo-600" />,
                title: "2. Verify Location",
                desc: "Enable location services to confirm the visitor is at the designated office location, ensuring secure access.",
              },
              {
                icon: <FileText className="w-6 h-6 text-indigo-600" />,
                title: "3. Complete Registration",
                desc: "Fill out a user-friendly form with details like name, purpose of visit, and contact information, then submit securely.",
              },
              {
                icon: <CheckCircle className="w-6 h-6 text-indigo-600" />,
                title: "4. Receive Digital Pass",
                desc: "Get an instant digital pass for secure office access or visitor tracking, sent directly to the visitor's device.",
              },
            ].map(({ icon, title, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex flex-col sm:flex-row items-center gap-5"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  {icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                  <p className="text-slate-600">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="text-center mt-8"
          >
            <button
              onClick={() => navigate('/usage')}
              className="px-5 py-2.5 bg-indigo-500 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 shadow-md"
            >
              See Detailed Guide
            </button>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-3xl font-bold text-slate-900 text-center mb-12"
          >
            Benefits of Using QRVibe
          </motion.h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="space-y-6"
            >
              <h3 className="text-xl font-semibold text-slate-900">For Visitors</h3>
              <ul className="space-y-4 text-slate-600">
                {[
                  {
                    title: "Fast Check-In",
                    desc: "Complete visitor registration in minutes with an intuitive QR-based interface.",
                  },
                  {
                    title: "Secure Access",
                    desc: "Encrypted QR codes ensure your data is protected during the check-in process.",
                  },
                  {
                    title: "Instant Pass",
                    desc: "Receive a digital pass immediately for seamless office entry.",
                  },
                ].map(({ title, desc }, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-slate-900">{title}</span>: {desc}
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="space-y-6"
            >
              <h3 className="text-xl font-semibold text-slate-900">For Organizations</h3>
              <ul className="space-y-4 text-slate-600">
                {[
                  {
                    title: "Enhanced Security",
                    desc: "Location-based QR validation ensures only authorized visitors enter your premises.",
                  },
                  {
                    title: "Efficient Tracking",
                    desc: "Monitor visitor data and access history with streamlined digital records.",
                  },
                  {
                    title: "Customizable Forms",
                    desc: "Tailor registration forms to collect specific visitor information, such as purpose or ID details.",
                  },
                ].map(({ title, desc }, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-slate-900">{title}</span>: {desc}
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 py-16 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-3xl font-bold text-slate-900 text-center mb-12"
          >
            What Our Users Say
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                text: "“QRVibe transformed our visitor management. The QR check-in system is fast, secure, and ensures only authorized visitors enter our office.”",
                author: "Anjali Gupta",
                role: "Facility Manager",
              },
              {
                text: "“Checking in with QRVibe was so simple! I scanned the QR code, filled the form, and got my digital pass in seconds. Highly efficient!”",
                author: "Vikram Singh",
                role: "Visitor",
              },
              {
                text: "“QRVibe's location verification ensures our office stays secure. The digital pass system simplifies visitor tracking for our team.”",
                author: "Priya Sharma",
                role: "HR Manager",
              },
            ].map(({ text, author, role }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white p-6 rounded-lg shadow-sm border border-slate-100"
              >
                <Users className="w-8 h-8 text-indigo-600 mb-4 mx-auto" />
                <p className="text-slate-700 mb-4 italic text-center">{text}</p>
                <div className="text-center">
                  <div className="font-semibold text-slate-900">{author}</div>
                  <div className="text-slate-500">{role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section for Demo Request */}
      <section className="relative z-10 py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-3xl font-bold text-slate-900 text-center mb-12"
          >
            Request a Demo
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-lg text-slate-600 text-center mb-8 max-w-3xl mx-auto"
          >
            Interested in seeing QRVibe in action? Fill out the form below to request a demo and learn how our QR-based visitor management system can enhance your workplace security and efficiency.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="max-w-lg mx-auto bg-white rounded-lg shadow-md border border-slate-100 p-6 sm:p-8"
          >
            <form className="space-y-4">
              {/* Name Field */}
              <div className="space-y-1">
                <label className="flex items-center text-[12px] font-medium text-slate-700">
                  <User className="w-4 h-4 mr-1.5 text-slate-500" />
                  Full Name <span className="text-indigo-600 ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 text-[12px] rounded-md border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="John Doe"
                  aria-required="true"
                  aria-label="Full Name"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-1">
                <label className="flex items-center text-[12px] font-medium text-slate-700">
                  <Mail className="w-4 h-4 mr-1.5 text-slate-500" />
                  Email Address <span className="text-indigo-600 ml-1">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 text-[12px] rounded-md border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="john.doe@example.com"
                  aria-required="true"
                  aria-label="Email Address"
                />
              </div>

              {/* Company Name Field */}
              <div className="space-y-1">
                <label className="flex items-center text-[12px] font-medium text-slate-700">
                  <Building2 className="w-4 h-4 mr-1.5 text-slate-500" />
                  Company Name
                </label>
                <input
                  type="text"
                  name="company"
                  className="w-full px-3 py-2 text-[12px] rounded-md border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="Acme Corp"
                  aria-label="Company Name"
                />
              </div>

              {/* Message Field */}
              <div className="space-y-1">
                <label className="flex items-center text-[12px] font-medium text-slate-700">
                  <FileText className="w-4 h-4 mr-1.5 text-slate-500" />
                  Message
                </label>
                <textarea
                  name="message"
                  rows={4}
                  className="w-full px-3 py-2 text-[12px] rounded-md border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="Tell us about your needs or how you'd like to use QRVibe..."
                  aria-label="Message"
                ></textarea>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center px-4 py-2 text-[12px] font-medium rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105 transition-all duration-200 shadow-md"
                  aria-label="Submit demo request"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Demo Request
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-16 bg-gradient-to-r from-indigo-700 to-purple-700 text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Visitor Management?
          </h2>
          <p className="text-lg text-slate-200 mb-8 max-w-2xl mx-auto">
            Enhance office security and streamline visitor check-ins with QRVibe's innovative QR-based platform.
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
              Contact Us
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
                Secure and efficient office visitor management with QR-based technology.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2 text-[12px]">
                {[
                  { name: 'Home', path: '/' },
                  { name: 'How It Works', path: '/usage' },
                  { name: 'About QRVibe', path: '/about' },
                  { name: 'Get Started', path: '/get-started' },
                  { name: 'FAQ', path: '/faq' },
                  { name: 'Contact Us', path: '/contact' },
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
              <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>
              <p className="text-slate-400 text-[12px]">
                Email: <a href="mailto:support@qrvibe.com" className="hover:text-indigo-400 transition-colors duration-200">support@qrvibe.com</a>
              </p>
              <p className="text-slate-400 text-[12px] mt-2">
                Phone: +91-123-456-7890
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors duration-200">
                  <span className="sr-only">Twitter</span>
                  <Twitter className="w-6 h-6" />
                </a>
                <a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors duration-200">
                  <span className="sr-only">LinkedIn</span>
                  <Linkedin className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-700 pt-6 text-center">
            <p className="text-slate-400 text-[12px]">
              © {new Date().getFullYear()} QRVibe. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}