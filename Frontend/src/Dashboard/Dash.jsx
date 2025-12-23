import { useState, useEffect, useCallback, useRef, memo, Component } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Chart from 'chart.js/auto';
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import { saveAs } from 'file-saver';
import { format, parseISO, subDays } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Format date function
const formatDate = (dateString) => {
  try {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Invalid date";
  }
};

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-full sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
            <ExclamationCircleIcon className="h-8 w-8 text-red-500 dark:text-red-400 mx-auto mb-3" />
            <h2 className="text-[12px] font-semibold text-slate-900 dark:text-slate-100">Something Went Wrong</h2>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-2">{this.state.errorMessage}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Tooltip Component
const TooltipComponent = ({ children, text, position = 'bottom' }) => {
  const positionClasses = {
    bottom: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    top: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  return (
    <div className="relative group inline-block">
      {children}
      <span
        className={`absolute ${positionClasses[position]} hidden group-hover:block px-2 py-1 text-[12px] text-white bg-slate-800 dark:bg-slate-700 rounded-md shadow-lg transition-opacity duration-200 opacity-0 group-hover:opacity-100 z-50 whitespace-nowrap`}
      >
        {text}
      </span>
    </div>
  );
};

// Trends Chart Component
const TrendsChart = memo(({ trends }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current && trends.length > 0) {
      const ctx = chartRef.current.getContext('2d');
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const labels = trends.map((t) => format(new Date(t.date), 'MMM d'));
      const datasets = [
        {
          label: 'Pending',
          data: trends.filter((t) => t.status === 'pending').map((t) => t.count),
          backgroundColor: 'rgba(99, 102, 241, 0.6)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1,
        },
        {
          label: 'Approved',
          data: trends.filter((t) => t.status === 'approved').map((t) => t.count),
          backgroundColor: 'rgba(34, 197, 94, 0.6)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        },
      ];

      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true },
          },
          plugins: {
            legend: { display: false },
          },
        },
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [trends]);

  if (trends.length === 0) {
    return (
      <div className="p-4 text-center">
        <ChartBarIcon className="h-8 w-8 text-slate-400 mx-auto mb-2" />
        <p className="text-[12px] text-slate-500 dark:text-slate-400">No trends data available</p>
      </div>
    );
  }

  return (
    <div className="h-48">
      <canvas ref={chartRef} />
    </div>
  );
});

// Status Pie Chart Component
const StatusPieChart = memo(({ submissions }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current && submissions.length > 0) {
      const ctx = chartRef.current.getContext('2d');
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const statusCounts = submissions.reduce((acc, sub) => {
        acc[sub.status || 'unknown'] = (acc[sub.status || 'unknown'] || 0) + 1;
        return acc;
      }, {});

      const labels = Object.keys(statusCounts);
      const data = Object.values(statusCounts);

      chartInstance.current = new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: [
              'rgba(99, 102, 241, 0.6)', 'rgba(34, 197, 94, 0.6)', 'rgba(251, 191, 36, 0.6)',
              'rgba(239, 68, 68, 0.6)', 'rgba(168, 85, 247, 0.6)', 'rgba(107, 114, 128, 0.6)'
            ],
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
          },
        },
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [submissions]);

  if (submissions.length === 0) {
    return (
      <div className="p-4 text-center">
        <ChartPieIcon className="h-8 w-8 text-slate-400 mx-auto mb-2" />
        <p className="text-[12px] text-slate-500 dark:text-slate-400">No status data available</p>
      </div>
    );
  }

  return (
    <div className="h-48">
      <canvas ref={chartRef} />
    </div>
  );
});

function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    counter: 0,
    todayCount: 0,
    yesterdayCount: 0,
    submissions: [],
    trends: [],
    totalPages: 1,
    currentPage: 1,
    lastUpdate: null,
  });
  const [statuses, setStatuses] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  // Fetch statuses, designations, and departments
  const fetchFilterData = useCallback(async () => {
    try {
      const [statusResponse, qrCodeResponse] = await Promise.all([
        axios.get(`${API_URL}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/qrcodes/data`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setStatuses(statusResponse.data.statuses || statusResponse.data.results || []);
      setDesignations(qrCodeResponse.data.designations || []);
      setDepartments(qrCodeResponse.data.departments || []);
    } catch (err) {
      console.error('Error fetching filter data:', err);
      setError(
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-center">
          <ExclamationCircleIcon className="h-8 w-8 text-red-500 dark:text-red-400 mx-auto mb-3" />
          <h3 className="text-[12px] font-semibold text-slate-900 dark:text-slate-100">Failed to Load Filter Data</h3>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-2">
            {err.response?.data?.message || 'Unable to load statuses, designations, or departments.'}
          </p>
        </div>
      );
    }
  }, [token]);

  // Validate token and user role on mount
  useEffect(() => {
    if (!token) {
      toast.error("Please log in to view dashboard.", {
        icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
        style: { background: "#ffffff", color: "#1e293b", padding: "12px", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", fontSize: "10px" },
      });
      navigate("/login");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (!["admin", "member"].includes(payload.role)) {
        toast.error("Invalid user role.", {
          icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
          style: { background: "#ffffff", color: "#1e293b", padding: "12px", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", fontSize: "10px" },
        });
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        fetchFilterData();
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      toast.error("Invalid token. Please log in again.", {
        icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
        style: { background: "#ffffff", color: "#1e293b", padding: "12px", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", fontSize: "10px" },
      });
      localStorage.removeItem("token");
      navigate("/login");
    }
  }, [navigate, token, fetchFilterData]);

  // Handle logout state clearing
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token' && !e.newValue) {
        setDashboardData({
          counter: 0,
          todayCount: 0,
          yesterdayCount: 0,
          submissions: [],
          trends: [],
          totalPages: 1,
          currentPage: 1,
          lastUpdate: null,
        });
        setStatuses([]);
        setDesignations([]);
        setDepartments([]);
        setError(null);
        navigate('/login');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!token) {
      setError(
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-center">
          <ExclamationCircleIcon className="h-8 w-8 text-red-500 dark:text-red-400 mx-auto mb-3" />
          <h3 className="text-[12px] font-semibold text-slate-900 dark:text-slate-100">Authentication Required</h3>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-2">
            Please sign in to access the dashboard.
          </p>
        </div>
      );
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    try {
      setError(null);

      const headers = { Authorization: `Bearer ${token}` };
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

      const [counterRes, todayRes, submissionsRes, yesterdayRes, trendsRes] = await Promise.all([
        axios.get(`${API_URL}/submission/counter`, { headers }).catch(() => ({ data: { total: 0, lastSubmissionDate: null } })),
        axios.get(`${API_URL}/submission/today`, { headers }).catch(() => ({ data: { todayTotal: 0 } })),
        axios.get(`${API_URL}/submission/list`, { headers, params: { page: 1, limit: 5, sortBy: 'created_at', order: 'DESC' } }).catch(() => ({
          data: { submissions: [], total: 0, limit: 5, page: 1 },
        })),
        axios.get(`${API_URL}/submission/list`, { headers, params: { startDate: yesterday, endDate: yesterday, page: 1, limit: 1, sortBy: 'created_at', order: 'DESC' } }).catch(() => ({ data: { total: 0 } })),
        axios.get(`${API_URL}/submission/trends`, { headers }).catch(() => ({ data: { trends: [] } })),
      ]);

      const newData = {
        counter: counterRes.data?.total || 0,
        todayCount: counterRes.data?.todayTotal || todayRes.data?.todayTotal || 0,
        yesterdayCount: yesterdayRes.data?.total || 0,
        submissions: submissionsRes.data?.submissions || [],
        trends: trendsRes.data?.trends || [],
        totalPages: Math.ceil((submissionsRes.data?.total || 0) / (submissionsRes.data?.limit || 5)) || 1,
        currentPage: submissionsRes.data?.page || 1,
        lastUpdate: new Date().toISOString(),
      };
      setDashboardData(newData);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      let errorMessage = (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-center">
          <ExclamationCircleIcon className="h-8 w-8 text-red-500 dark:text-red-400 mx-auto mb-3" />
          <h3 className="text-[12px] font-semibold text-slate-900 dark:text-slate-100">Failed to Load Dashboard</h3>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-2">
            {err.response?.status === 400
              ? `Invalid request parameters: ${err.response.data.errors?.map((e) => e.msg).join(', ') || 'Check your inputs.'}`
              : err.response?.status === 401 || err.response?.status === 403
              ? 'Your session has expired. Redirecting to login...'
              : err.message || 'Unable to load dashboard data.'}
          </p>
        </div>
      );
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        setTimeout(() => navigate('/login'), 2000);
      }

      setError(errorMessage);
    }
  }, [navigate, token]);

  // Fetch data on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Calculate completion rate
  const completionRate = dashboardData.submissions.length > 0
    ? Math.round(
        (dashboardData.submissions.filter((sub) => ['reviewed', 'approved'].includes(sub.status?.toLowerCase())).length /
          dashboardData.submissions.length) *
          100
      )
    : 0;

  // Calculate average daily submissions
  const avgDailySubmissions = dashboardData.counter > 0 ? Math.round(dashboardData.counter / 30) : 0;

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      email: formData.get('contact-email') || null,
      message: formData.get('contact-message'),
      type: 'support',
    };

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      await axios.post(`${API_URL}/contact`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsContactOpen(false);
      toast.success("Message sent successfully", {
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
        style: { background: "#ffffff", color: "#1e293b", padding: "12px", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", fontSize: "10px" },
      });
    } catch (err) {
      setError(
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-center">
          <ExclamationCircleIcon className="h-8 w-8 text-red-500 dark:text-red-400 mx-auto mb-3" />
          <h3 className="text-[12px] font-semibold text-slate-900 dark:text-slate-100">Failed to Send Message</h3>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-2">
            {err.response?.data?.message || err.message}
          </p>
        </div>
      );
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 py-6 sm:px-6 lg:px-8 font-[Inter] text-[12px] antialiased">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontSize: '14px',
              background: '#ffffff',
              color: '#1e293b',
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <main className="max-w-full sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
          {error ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700 animate-fade-in">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200 dark:border-slate-700">
                  <div className="px-4 py-4 sm:p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-600 dark:bg-indigo-500 rounded-md p-1.5">
                        <DocumentTextIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-3 flex-1">
                        <dt className="text-[8px] sm:text-[12px] font-medium text-slate-500 dark:text-slate-400 text-left">
                          Total Submissions
                        </dt>
                        <dd className="flex items-baseline">
                          <TooltipComponent text="All-time form submissions">
                            <div className="text-[8px] sm:text-[12px] font-bold text-slate-900 dark:text-slate-100">
                              {dashboardData.counter.toLocaleString('en-IN')}
                            </div>
                          </TooltipComponent>
                        </dd>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 sm:px-5">
                    <Link
                      to="/form-submission"
                      className="text-[8px] sm:text-[12px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center"
                      aria-label="View all form submissions"
                    >
                      View all
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200 dark:border-slate-700">
                  <div className="px-4 py-4 sm:p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-600 dark:bg-green-500 rounded-md p-1.5">
                        <DocumentTextIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-3 flex-1">
                        <dt className="text-[8px] sm:text-[12px] font-medium text-slate-500 dark:text-slate-400 text-left">
                          Today's Submissions
                        </dt>
                        <dd className="flex items-baseline">
                          <TooltipComponent text="Submissions received today">
                            <div className="text-[8px] sm:text-[12px] font-bold text-slate-900 dark:text-slate-100">
                              {dashboardData.todayCount.toLocaleString('en-IN')}
                            </div>
                          </TooltipComponent>
                        </dd>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 sm:px-5">
                    <div className="text-[8px] sm:text-[12px] text-slate-500 dark:text-slate-400 text-left">
                      {format(new Date(), 'MMMM d, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200 dark:border-slate-700">
                  <div className="px-4 py-4 sm:p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-orange-600 dark:bg-orange-500 rounded-md p-1.5">
                        <DocumentTextIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-3 flex-1">
                        <dt className="text-[8px] sm:text-[12px] font-medium text-slate-500 dark:text-slate-400 text-left">
                          Yesterday's Submissions
                        </dt>
                        <dd className="flex items-baseline">
                          <TooltipComponent text="Submissions received yesterday">
                            <div className="text-[8px] sm:text-[12px] font-bold text-slate-900 dark:text-slate-100">
                              {dashboardData.yesterdayCount.toLocaleString('en-IN')}
                            </div>
                          </TooltipComponent>
                        </dd>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 sm:px-5">
                    <div className="text-[8px] sm:text-[12px] text-slate-500 dark:text-slate-400 text-left">
                      {format(subDays(new Date(), 1), 'MMMM d, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200 dark:border-slate-700">
                  <div className="px-4 py-4 sm:p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-600 dark:bg-indigo-500 rounded-md p-1.5">
                        <ClockIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-3 flex-1">
                        <dt className="text-[8px] sm:text-[12px] font-medium text-slate-500 dark:text-slate-400 text-left">
                          Avg Daily (30d)
                        </dt>
                        <dd className="flex items-baseline">
                          <TooltipComponent text="Average submissions per day">
                            <div className="text-[8px] sm:text-[12px] font-bold text-slate-900 dark:text-slate-100">
                              {avgDailySubmissions.toLocaleString('en-IN')}
                            </div>
                          </TooltipComponent>
                        </dd>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 sm:px-5">
                    <div className="text-[8px] sm:text-[12px] text-slate-500 dark:text-slate-400 text-left">Last 30 days average</div>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200 dark:border-slate-700">
                  <div className="px-4 py-4 sm:p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-600 dark:bg-indigo-500 rounded-md p-1.5">
                        <CheckCircleIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-3 flex-1">
                        <dt className="text-[8px] sm:text-[12px] font-medium text-slate-500 dark:text-slate-400 text-left">
                          Completion Rate
                        </dt>
                        <dd className="flex items-baseline">
                          <TooltipComponent text="Percentage of reviewed/approved submissions">
                            <div className="text-[8px] sm:text-[12px] font-bold text-slate-900 dark:text-slate-100">
                              {completionRate}%
                            </div>
                          </TooltipComponent>
                        </dd>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 sm:px-5">
                    <div className="text-[8px] sm:text-[12px] text-slate-500 dark:text-slate-400 text-left">
                      {dashboardData.submissions.filter((sub) => ['reviewed', 'approved'].includes(sub.status?.toLowerCase())).length} of{' '}
                      {dashboardData.submissions.length} completed
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[12px] font-semibold text-slate-900 dark:text-slate-100">Submission Trends (7 Days)</h4>
                    <ChartBarIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  </div>
                  <TrendsChart trends={dashboardData.trends} />
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[12px] font-semibold text-slate-900 dark:text-slate-100">Status Distribution</h4>
                    <ChartPieIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  </div>
                  <StatusPieChart submissions={dashboardData.submissions} />
                </div>
              </div>

              {/* Success Message */}
              {successMessage && (
                <div className="mb-6 p-4 bg-white dark:bg-slate-800 border border-green-200 dark:border-green-900/30 rounded-lg shadow-md">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                    <p className="text-[12px] text-slate-900 dark:text-slate-100">{successMessage}</p>
                  </div>
                </div>
              )}

              {/* Contact Dialog */}
              <Dialog open={isContactOpen} onClose={() => setIsContactOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all border border-slate-200 dark:border-slate-700">
                    <Dialog.Title as="h3" className="text-[12px] font-medium leading-6 text-slate-900 dark:text-slate-100">
                      Contact Support
                    </Dialog.Title>
                    <form onSubmit={handleContactSubmit} className="mt-4 space-y-4">
                      <div>
                        <label
                          htmlFor="contact-email"
                          className="block text-[12px] font-medium text-slate-700 dark:text-slate-300"
                        >
                          Email (optional)
                        </label>
                        <input
                          type="email"
                          id="contact-email"
                          name="contact-email"
                          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-[12px]"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="contact-message"
                          className="block text-[12px] font-medium text-slate-700 dark:text-slate-300"
                        >
                          Message
                        </label>
                        <textarea
                          id="contact-message"
                          name="contact-message"
                          rows={4}
                          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-[12px]"
                          required
                        />
                      </div>
                      <div className="mt-4 flex justify-end space-x-3">
                        <button
                          type="button"
                          className="px-4 py-2 text-[12px] font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"
                          onClick={() => setIsContactOpen(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-[12px] font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                        >
                          Send
                        </button>
                      </div>
                    </form>
                  </Dialog.Panel>
                </div>
              </Dialog>
            </div>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default Dashboard;
