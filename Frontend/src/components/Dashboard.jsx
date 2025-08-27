import { useEffect, useState, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import AuthContext from './AuthContext';
import {
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  UserPlusIcon,
  EyeIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChevronUpDownIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL 

function Dashboard() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewedFilter, setReviewedFilter] = useState('all');
  const [applicationTypeFilter, setApplicationTypeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [interviewDate, setInterviewDate] = useState('');
  const { user, isLoading } = useContext(AuthContext);
  
  const navigate = useNavigate();

  // Calculate statistics from applicants data
  const stats = useCallback(() => {
    return {
      totalSubmissions: applicants.length,
      interviewApplications: applicants.filter(app => app.application_type === 'interview').length,
      reasonsSubmitted: applicants.filter(app => app.application_type === 'reason').length,
      reviewed: applicants.filter(app => app.reviewed).length,
    };
  }, [applicants]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchApplicants = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }
        const response = await axios.get(`${API_URL}/applicants`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setApplicants(response.data.data || []);
      } catch (err) {
        console.error('Fetch error:', err.response?.status, err.response?.data);
        toast.error('Error fetching applicants', { duration: 3000 });
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchApplicants();
  }, [user, isLoading, navigate]);

  const openModal = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/applicants/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedApplicant(response.data.data);
      setInterviewDate(response.data.data.interview_date || '');
      setIsModalOpen(true);
    } catch (err) {
      console.error('Fetch applicant error:', err);
      toast.error('Error fetching applicant details', { duration: 3000 });
    }
  };

  const updateApplicant = async (id, updates) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/applicants/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApplicants((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, ...updates, updated_at: new Date().toISOString() } : app
        )
      );
      setSelectedApplicant((prev) =>
        prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null
      );
      toast.success('Applicant updated successfully', { duration: 3000 });
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Error updating applicant', { duration: 3000 });
    }
  };

  const scheduleInterview = async (id) => {
    if (!interviewDate) {
      toast.error('Please select a date and time for the interview', { duration: 3000 });
      return;
    }
    try {
      const updates = {
        interview_date: interviewDate,
        status: 'shortlisted',
        reviewed: true,
      };
      await updateApplicant(id, updates);
      toast.success('Interview scheduled successfully', { duration: 3000 });
    } catch (err) {
      console.error('Schedule interview error:', err);
      toast.error('Error scheduling interview', { duration: 3000 });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedApplicant(null);
    setInterviewDate('');
  };

  const filteredApplicants = useCallback(() => {
    return applicants
      .filter((applicant) => {
        const matchesSearch =
          applicant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          applicant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (applicant.phone && applicant.phone.includes(searchTerm));

        const matchesStatus = statusFilter === 'all' || applicant.status === statusFilter;
        const matchesReviewed =
          reviewedFilter === 'all' ||
          (reviewedFilter === 'reviewed' && applicant.reviewed) ||
          (reviewedFilter === 'not-reviewed' && !applicant.reviewed);
        const matchesApplicationType =
          applicationTypeFilter === 'all' ||
          applicant.application_type === applicationTypeFilter;

        return matchesSearch && matchesStatus && matchesReviewed && matchesApplicationType;
      })
      .sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
  }, [applicants, searchTerm, statusFilter, reviewedFilter, applicationTypeFilter, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'hired', label: 'Hired' },
  ];

  const reviewedOptions = [
    { value: 'all', label: 'All' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'not-reviewed', label: 'Not Reviewed' },
  ];

  const applicationTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'interview', label: 'Interview Applications' },
    { value: 'reason', label: 'Reasons' },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 font-roboto roboto-normal text-xs">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-pink-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300 roboto-light-italic text-xs">Loading...</span>
      </div>
    );
  }

  if (!user) return null;

  const { totalSubmissions, interviewApplications, reasonsSubmitted, reviewed } = stats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 md:p-8 font-roboto roboto-normal text-xs">
    <Toaster
  position="bottom-right"
  toastOptions={{
    duration: 1000,
    style: { fontSize: '12px' },
    success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
    error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
  }}
/>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="font-extrabold text-gray-900 dark:text-white roboto-bold text-xs">
              Applicants Dashboard
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300 roboto-light-italic text-xs">
              Manage and review all applicant submissions
            </p>
          </div>
          <div className="relative flex-grow md:flex-grow-0 md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search applicants..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 roboto-normal text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="type-filter"
                className="block text-gray-700 dark:text-gray-300 roboto-bold text-xs mb-1 flex items-center gap-1"
              >
                <FunnelIcon className="h-4 w-4" />
                Application Type
              </label>
              <div className="relative">
                <select
                  id="type-filter"
                  className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-pink-500 focus:border-pink-500 appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 roboto-normal text-xs"
                  value={applicationTypeFilter}
                  onChange={(e) => setApplicationTypeFilter(e.target.value)}
                >
                  {applicationTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronUpDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
            </div>
            <div>
              <label
                htmlFor="status-filter"
                className="block text-gray-700 dark:text-gray-300 roboto-bold text-xs mb-1 flex items-center gap-1"
              >
                <FunnelIcon className="h-4 w-4" />
                Status
              </label>
              <div className="relative">
                <select
                  id="status-filter"
                  className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-pink-500 focus:border-pink-500 appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 roboto-normal text-xs"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronUpDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
            </div>
            <div>
              <label
                htmlFor="reviewed-filter"
                className="block text-gray-700 dark:text-gray-300 roboto-bold text-xs mb-1 flex items-center gap-1"
              >
                <FunnelIcon className="h-4 w-4" />
                Review Status
              </label>
              <div className="relative">
                <select
                  id="reviewed-filter"
                  className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-pink-500 focus:border-pink-500 appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 roboto-normal text-xs"
                  value={reviewedFilter}
                  onChange={(e) => setReviewedFilter(e.target.value)}
                >
                  {reviewedOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronUpDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
            </div>
            <div>
              <label
                className="block text-gray-700 dark:text-gray-300 roboto-bold text-xs mb-1 flex items-center gap-1"
              >
                <ArrowsUpDownIcon className="h-4 w-4" />
                Sort By
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => requestSort('created_at')}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg roboto-normal text-xs ${
                    sortConfig.key === 'created_at'
                      ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <ClockIcon className="h-4 w-4" />
                  Date {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => requestSort('name')}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg roboto-normal text-xs ${
                    sortConfig.key === 'name'
                      ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span>Name</span> {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 roboto-normal text-xs">Total Submissions</h3>
                <p className="font-bold text-gray-900 dark:text-white roboto-bold text-xs mt-1">{totalSubmissions}</p>
              </div>
              <div className="p-3 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400">
                <UserPlusIcon className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 roboto-normal text-xs">Interview Applications</h3>
                <p className="font-bold text-pink-600 dark:text-pink-400 roboto-bold text-xs mt-1">{interviewApplications}</p>
              </div>
              <div className="p-3 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400">
                <DocumentTextIcon className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 roboto-normal text-xs">Reasons Submitted</h3>
                <p className="font-bold text-pink-600 dark:text-pink-400 roboto-bold text-xs mt-1">{reasonsSubmitted}</p>
              </div>
              <div className="p-3 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400">
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 roboto-normal text-xs">Reviewed</h3>
                <p className="font-bold text-pink-600 dark:text-pink-400 roboto-bold text-xs mt-1">{reviewed}</p>
              </div>
              <div className="p-3 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400">
                <CheckCircleIcon className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Applicants List */}
        {loading ? (
          <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-pink-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300 roboto-light-italic text-xs">
              Loading applicants...
            </span>
          </div>
        ) : filteredApplicants().length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 font-medium text-gray-900 dark:text-white roboto-bold text-xs">No submissions found</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400 roboto-light-italic text-xs">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApplicants().map((app) => (
              <div
                key={app.id}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition duration-300 cursor-pointer group"
                onClick={() => openModal(app.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-gray-500 dark:text-gray-400 roboto-normal text-xs">ID: {app.id}</p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      app.reviewed ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    } roboto-normal`}
                  >
                    {app.reviewed ? 'Reviewed' : 'Pending Review'}
                  </span>
                </div>
                <p
                  className="font-medium text-gray-900 dark:text-white roboto-bold text-xs mb-1 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition"
                >
                  {app.name}
                </p>
                <div className="space-y-1.5 mt-3">
                  <div className="flex items-center text-gray-700 dark:text-gray-300 roboto-normal text-xs">
                    <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                    <span className="truncate">{app.email}</span>
                  </div>
                  {app.phone && (
                    <div className="flex items-center text-gray-700 dark:text-gray-300 roboto-normal text-xs">
                      <PhoneIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                      {app.phone}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs roboto-normal ${
                        app.status === 'hired'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : app.status === 'shortlisted'
                          ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400'
                          : app.status === 'rejected'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}
                    >
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 roboto-light-italic text-xs">
                      {new Date(app.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-gray-300 roboto-normal text-xs mt-1">
                    <span className="font-medium">Type:</span>
                    <span
                      className={`ml-1 px-2 py-1 rounded-full text-xs roboto-normal ${
                        app.application_type === 'interview'
                          ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                      }`}
                    >
                      {app.application_type === 'interview' ? 'Interview' : 'Reason'}
                    </span>
                  </div>
                  {app.interview_date && app.application_type === 'interview' && (
                    <div className="flex items-center text-gray-700 dark:text-gray-300 roboto-normal text-xs mt-1">
                      <CalendarIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                      <span>
                        Interview: {new Date(app.interview_date).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-between items-center">
                  {app.application_type === 'interview' && (
                    <a
                      href={`${API_URL}/resume/${app.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 roboto-normal text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DocumentTextIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
                      Resume
                    </a>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateApplicant(app.id, { reviewed: !app.reviewed });
                    }}
                    className={`inline-flex items-center px-3 py-1.5 border shadow-sm rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 roboto-normal text-xs ${
                      app.reviewed
                        ? 'border-green-300 text-green-700 bg-green-100 hover:bg-green-200 dark:border-green-400 dark:text-green-400 dark:bg-green-900/20 dark:hover:bg-green-900/30'
                        : 'border-yellow-300 text-yellow-700 bg-yellow-100 hover:bg-yellow-200 dark:border-yellow-400 dark:text-yellow-400 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30'
                    }`}
                  >
                    {app.reviewed ? 'Mark Unreviewed' : 'Mark Reviewed'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Applicant Detail Modal */}
        {isModalOpen && selectedApplicant && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 font-roboto roboto-normal text-xs">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white roboto-bold text-xs">
                    {selectedApplicant.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs roboto-normal ${
                        selectedApplicant.status === 'hired'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : selectedApplicant.status === 'shortlisted'
                          ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400'
                          : selectedApplicant.status === 'rejected'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}
                    >
                      {selectedApplicant.status.charAt(0).toUpperCase() + selectedApplicant.status.slice(1)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs roboto-normal ${
                        selectedApplicant.reviewed
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}
                    >
                      {selectedApplicant.reviewed ? 'Reviewed' : 'Pending Review'}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs roboto-normal ${
                        selectedApplicant.application_type === 'interview'
                          ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                      }`}
                    >
                      {selectedApplicant.application_type === 'interview' ? 'Interview' : 'Reason'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white roboto-bold text-xs mb-3">
                    Basic Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-gray-500 dark:text-gray-400 roboto-normal text-xs">ID</p>
                      <p className="text-gray-900 dark:text-gray-100 roboto-normal text-xs">{selectedApplicant.id}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500 dark:text-gray-400 roboto-normal text-xs">Email</p>
                      <p className="text-gray-900 dark:text-gray-100 roboto-normal text-xs">{selectedApplicant.email}</p>
                    </div>
                    {selectedApplicant.phone && (
                      <div>
                        <p className="font-medium text-gray-500 dark:text-gray-400 roboto-normal text-xs">Phone</p>
                        <p className="text-gray-900 dark:text-gray-100 roboto-normal text-xs">{selectedApplicant.phone}</p>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-500 dark:text-gray-400 roboto-normal text-xs">Submitted On</p>
                      <p className="text-gray-900 dark:text-gray-100 roboto-normal text-xs">
                        {new Date(selectedApplicant.created_at).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                        })}
                      </p>
                    </div>
                    {selectedApplicant.updated_at && (
                      <div>
                        <p className="font-medium text-gray-500 dark:text-gray-400 roboto-normal text-xs">Last Updated</p>
                        <p className="text-gray-900 dark:text-gray-100 roboto-normal text-xs">
                          {new Date(selectedApplicant.updated_at).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                          })}
                        </p>
                      </div>
                    )}
                    {selectedApplicant.interview_date && selectedApplicant.application_type === 'interview' && (
                      <div>
                        <p className="font-medium text-gray-500 dark:text-gray-400 roboto-normal text-xs">Interview Scheduled</p>
                        <p className="text-gray-900 dark:text-gray-100 roboto-normal text-xs">
                          {new Date(selectedApplicant.interview_date).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white roboto-bold text-xs mb-3">
                    Application Details
                  </h4>
                  <div className="space-y-4">
                    {selectedApplicant.application_type === 'interview' && (
                      <>
                        <div>
                          <label
                            htmlFor="status"
                            className="block font-medium text-gray-700 dark:text-gray-300 roboto-bold text-xs mb-1"
                          >
                            Status
                          </label>
                          <select
                            id="status"
                            value={selectedApplicant.status}
                            onChange={(e) => updateApplicant(selectedApplicant.id, { status: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 roboto-normal text-xs"
                          >
                            <option value="pending">Pending</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="rejected">Rejected</option>
                            <option value="hired">Hired</option>
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor="interview-date"
                            className="block font-medium text-gray-700 dark:text-gray-300 roboto-bold text-xs mb-1"
                          >
                            Interview Date
                          </label>
                          <input
                            id="interview-date"
                            type="datetime-local"
                            value={interviewDate}
                            onChange={(e) => setInterviewDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 roboto-normal text-xs"
                          />
                        </div>
                      </>
                    )}
                    <div className="flex items-center">
                      <input
                        id="reviewed"
                        type="checkbox"
                        checked={selectedApplicant.reviewed}
                        onChange={(e) => updateApplicant(selectedApplicant.id, { reviewed: e.target.checked })}
                        className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                      <label
                        htmlFor="reviewed"
                        className="ml-2 block text-gray-900 dark:text-gray-300 roboto-normal text-xs"
                      >
                        Mark as reviewed
                      </label>
                    </div>
                    {selectedApplicant.application_type === 'interview' && (
                      <div>
                        <p className="font-medium text-gray-500 dark:text-gray-400 roboto-normal text-xs">Resume</p>
                        <a
                          href={`${API_URL}/resume/${selectedApplicant.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 roboto-normal text-xs"
                        >
                          <EyeIcon className="-ml-1 mr-2 h-4 w-4" />
                          View Resume
                        </a>
                      </div>
                    )}
                    {selectedApplicant.application_type === 'reason' && (
                      <div>
                        <p className="font-medium text-gray-500 dark:text-gray-400 roboto-normal text-xs">Reason</p>
                        <p
                          className="text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 p-2 rounded-md roboto-normal text-xs"
                        >
                          {selectedApplicant.reason || 'No reason provided'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 roboto-normal text-xs"
                >
                  Close
                </button>
                {selectedApplicant.application_type === 'interview' && (
                  <>
                    <button
                      onClick={() => scheduleInterview(selectedApplicant.id)}
                      className="px-4 py-2 border border-transparent rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 roboto-normal text-xs"
                    >
                      Schedule Interview
                    </button>
                    <button
                      onClick={() => {
                        updateApplicant(selectedApplicant.id, {
                          status: 'shortlisted',
                          reviewed: true,
                        });
                      }}
                      className="px-4 py-2 border border-transparent rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 roboto-normal text-xs"
                    >
                      Shortlist Candidate
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;