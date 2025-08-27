import { useEffect, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from './AuthContext';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import {
  UserCircleIcon,
  EnvelopeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  GlobeAltIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { PulseLoader } from 'react-spinners';
import EditAccount from './EditAccount';

function AllAccounts() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ip, setIp] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isFormLoading, setIsFormLoading] = useState(false);
  const { user, signup } = useContext(AuthContext);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch IP address for signup
  useEffect(() => {
    if (!isDialogOpen) return;
    const fetchIp = async () => {
      try {
        const res = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
        setIp(res.data.ip);
      } catch (err) {
        console.error('Error fetching IP:', err.message);
        toast.error('Failed to fetch IP address. Using default.');
        setIp('unknown');
      }
    };
    fetchIp();
  }, [isDialogOpen]);

  const getAllAdmin = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/admin`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setAdmins(response.data.data);
    } catch (error) {
      console.error('Error fetching admins:', error);
      setError(error.response?.data?.message || 'Failed to load admin data. Please try again later.');
      toast.error(error.response?.data?.message || 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  const deleteAdmin = async (id) => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this admin?');
      if (!confirmDelete) return;

      await axios.delete(`${API_URL}/admin/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setAdmins(admins.filter((admin) => admin.id !== id));
      toast.success('Admin deleted successfully!');
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error(error.response?.data?.message || 'Failed to delete admin.');
    }
  };
  const handleUpdate = (updatedUser) => {
    setAdmins(admins.map((admin) => (admin.id === updatedUser.id ? updatedUser : admin)));
  };

  const validateInputs = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    else if (name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters long';

    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Please enter a valid email address';

    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters long';

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    if (!validateInputs()) return;

    setIsFormLoading(true);
    try {
      await signup(name.trim(), email.toLowerCase(), password, ip);
      toast.success('Admin created successfully!');
      setIsDialogOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setIp('');
      await getAllAdmin();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create admin. Please try again.';
      setFormErrors({ general: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsFormLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    getAllAdmin();
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8 sm:px-6 lg:px-8 font-roboto roboto-normal text-xs">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="font-extrabold text-gray-900 dark:text-white roboto-bold text-xs">Admin Accounts</h1>
            <p className="mt-3 text-gray-600 dark:text-gray-300 roboto-light-italic text-xs">
              Manage all administrator accounts in the system
            </p>
          </div>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 roboto-normal text-xs"
          >
            Add Admin
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <PulseLoader color="#EC4899" size={15} />
          </div>
        ) : error ? (
          <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-pink-400 dark:text-pink-300" />
              </div>
              <div className="ml-3">
                <h3 className="font-medium text-pink-800 dark:text-pink-200 roboto-bold text-xs">Error loading admins</h3>
                <div className="mt-2 text-pink-700 dark:text-pink-300 roboto-light-italic text-xs">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={getAllAdmin}
                    className="inline-flex items-center px-3 py-2 border border-transparent font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 roboto-normal text-xs"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : admins.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 roboto-normal"
              >
                <div className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <UserCircleIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate roboto-bold text-xs">{admin.name}</p>
                      <p className="text-gray-500 dark:text-gray-400 truncate flex items-center roboto-normal text-xs">
                        <EnvelopeIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        {admin.email}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-gray-500 dark:text-gray-400 roboto-normal text-xs">
                      <ClockIcon className="w-4 h-4 mr-1.5" />
                      <span>Joined: {new Date(admin.created_at).toLocaleDateString('en-GB')}</span>
                    </div>
                    {admin.ip_addresses?.length > 0 && (
                      <div className="flex items-center text-gray-500 dark:text-gray-400 roboto-normal text-xs">
                        <GlobeAltIcon className="w-4 h-4 mr-1.5" />
                        <span className="truncate">IPs: {admin.ip_addresses.join(', ')}</span>
                      </div>
                    )}
                    {(admin.city || admin.region || admin.country) && (
                      <div className="flex items-center text-gray-500 dark:text-gray-400 roboto-normal text-xs">
                        <MapPinIcon className="w-4 h-4 mr-1.5" />
                        <span className="truncate">
                          {[admin.city, admin.region, admin.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 roboto-normal">
                  <button
                    onClick={() => setSelectedUser(admin)}
                    className="font-medium text-pink-600 dark:text-pink-400 hover:text-pink-500 dark:hover:text-pink-300 roboto-bold text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteAdmin(admin.id)}
                    className="font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 roboto-bold text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 roboto-normal">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700">
              <UserCircleIcon className="h-6 w-6 text-gray-400 dark:text-gray-300" />
            </div>
            <h3 className="mt-2 font-medium text-gray-900 dark:text-white roboto-bold text-xs">No admins found</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400 roboto-light-italic text-xs">
              Get started by creating a new admin account.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setIsDialogOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 roboto-normal text-xs"
              >
                Add New Admin
              </button>
            </div>
          </div>
        )}

        {/* Add Admin Dialog */}
        {isDialogOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto font-roboto roboto-normal text-xs">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-gray-900 dark:text-white roboto-bold text-xs">Create Admin Account</h2>
                <button
                  onClick={() => {
                    setIsDialogOpen(false);
                    setName('');
                    setEmail('');
                    setPassword('');
                    setIp('');
                    setFormErrors({});
                  }}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              {formErrors.general && (
                <p className="text-red-500 mb-4 text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg roboto-light-italic text-xs">
                  {formErrors.general}
                </p>
              )}
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-5">
                  <label htmlFor="name" className="block text-gray-700 dark:text-gray-300 font-medium mb-1 roboto-bold text-xs">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full p-3 border ${formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition duration-200 roboto-normal text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                    placeholder="Enter name"
                    disabled={isFormLoading}
                  />
                  {formErrors.name && <p className="text-red-500 roboto-light-italic text-xs mt-1">{formErrors.name}</p>}
                </div>
                <div className="mb-5">
                  <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 font-medium mb-1 roboto-bold text-xs">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full p-3 border ${formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition duration-200 roboto-normal text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                    placeholder="Enter email"
                    disabled={isFormLoading}
                  />
                  {formErrors.email && <p className="text-red-500 roboto-light-italic text-xs mt-1">{formErrors.email}</p>}
                </div>
                <div className="mb-6">
                  <label htmlFor="password" className="block text-gray-700 dark:text-gray-300 font-medium mb-1 roboto-bold text-xs">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full p-3 border ${formErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition duration-200 roboto-normal text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                    placeholder="Enter password"
                    disabled={isFormLoading}
                  />
                  {formErrors.password && <p className="text-red-500 roboto-light-italic text-xs mt-1">{formErrors.password}</p>}
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setName('');
                      setEmail('');
                      setPassword('');
                      setIp('');
                      setFormErrors({});
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 roboto-normal text-xs"
                    disabled={isFormLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 border border-transparent font-medium rounded-md text-white ${isFormLoading ? 'bg-pink-300 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700 focus:ring-2 focus:ring-offset-2 focus:ring-pink-500'} roboto-normal text-xs`}
                    disabled={isFormLoading}
                  >
                    {isFormLoading ? 'Creating...' : 'Create Admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      {selectedUser && (
        <EditAccount
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}

export default AllAccounts;