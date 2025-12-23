
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  ShieldCheck,
  Globe,
  Clock,
  Users,
  BarChart2,
  Mail,
  Twitter,
  Linkedin,
} from 'lucide-react';

export default function About() {
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
            About QRVibe
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="text-lg sm:text-xl text-slate-200 mb-8 max-w-3xl mx-auto"
          >
            Transforming office visitor management with secure, location-based QR technology. Our mission is to enhance workplace security and streamline check-in processes.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <button
              onClick={() => navigate('/get-started')}
              className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 hover:shadow-lg transform hover:scale-105 transition-all duration-200 shadow-md"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-indigo-100 hover:text-indigo-600 hover:border-indigo-100 transition-all duration-200 shadow-md"
            >
              Contact Team
            </button>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse"></div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Our Story
              </h2>
              <p className="text-slate-600 mb-4">
                Founded in 2023, QRVibe emerged from a vision to revolutionize office visitor management by integrating secure QR technology with location-based validation.
              </p>
              <p className="text-slate-600 mb-4">
                Our team identified the need for a secure, efficient solution to manage workplace visitors. QRVibe now empowers organizations worldwide with seamless check-in processes and robust security measures.
              </p>
              <button
                onClick={() => navigate('/usage')}
                className="mt-4 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200 shadow-md"
              >
                Learn How It Works
              </button>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-slate-100 p-8 rounded-xl shadow-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <p className="text-3xl font-bold text-indigo-600">15K+</p>
                  <p className="text-slate-600">Daily Visitors</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <p className="text-3xl font-bold text-indigo-600">600+</p>
                  <p className="text-slate-600">Organizations</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <p className="text-3xl font-bold text-indigo-600">98%</p>
                  <p className="text-slate-600">Security Compliance</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <p className="text-3xl font-bold text-indigo-600">24/7</p>
                  <p className="text-slate-600">Support</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-3xl font-bold text-slate-900 text-center mb-12"
          >
            Our Core Values
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Lightbulb,
                title: 'Innovation',
                description: 'We pioneer advanced QR solutions to redefine secure and efficient visitor management.',
              },
              {
                icon: ShieldCheck,
                title: 'Security',
                description: 'Robust encryption and location validation protect your workplace and visitor data.',
              },
              {
                icon: Globe,
                title: 'Accessibility',
                description: 'Our platform is intuitive and accessible across devices for all users.',
              },
              {
                icon: Clock,
                title: 'Efficiency',
                description: 'Streamlined check-in processes save time for visitors and office staff.',
              },
              {
                icon: Users,
                title: 'User-Centric',
                description: 'Designed with visitors and organizations in mind for a seamless experience.',
              },
              {
                icon: BarChart2,
                title: 'Continuous Improvement',
                description: 'We refine our platform based on user feedback to meet evolving workplace needs.',
              },
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white border border-slate-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                <value.icon className="w-10 h-10 text-indigo-600 mb-4 mx-auto" />
                <h3 className="text-lg font-semibold text-slate-900 text-center">
                  {value.title}
                </h3>
                <p className="text-slate-600 text-center mt-2">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-3xl font-bold text-slate-900 text-center mb-12"
          >
            Meet The Team
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: 'Aarav Patel',
                role: 'Founder & CEO',
                bio: 'Expert in secure access solutions, dedicated to enhancing workplace safety.',
                img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200',
              },
              {
                name: 'Neha Gupta',
                role: 'CTO',
                bio: 'Leads development of scalable, secure QR-based visitor management systems.',
                img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200',
              },
              {
                name: 'Rohan Sharma',
                role: 'Product Lead',
                bio: 'Focuses on intuitive designs to simplify visitor check-in experiences.',
                img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
              },
              {
                name: 'Priya Singh',
                role: 'Operations Manager',
                bio: 'Ensures seamless integration of QRVibe for organizations worldwide.',
                img: 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?w=200',
              },
            ].map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white border border-slate-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="w-24 h-24 mx-auto mb-4 overflow-hidden rounded-full border border-slate-200">
                  <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 text-center">
                  {member.name}
                </h3>
                <p className="text-indigo-600 text-center mb-3">
                  {member.role}
                </p>
                <p className="text-slate-600 text-center text-sm">
                  {member.bio}
                </p>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
            className="text-center mt-12"
          >
            <button
              onClick={() => navigate('/contact')}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200 shadow-md"
            >
              Join Our Team
            </button>
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
            Ready to Secure Your Workplace?
          </h2>
          <p className="text-lg text-slate-200 mb-8 max-w-2xl mx-auto">
            QRVibe empowers organizations with secure, efficient visitor management and seamless check-in experiences.
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
              Contact Our Team
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
