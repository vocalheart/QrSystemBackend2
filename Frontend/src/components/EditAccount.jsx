import { useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

function EditAccount({ user, onClose, onUpdate }) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  const validateInputs = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    else if (name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters long';

    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Please enter a valid email address';

    if (password && password.length < 6) newErrors.password = 'Password must be at least 6 characters long';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!validateInputs()) return;
    setIsLoading(true);
    try {
      const payload = { name: name.trim(), email: email.toLowerCase() };
      if (password) payload.password = password;
      const response = await axios.put(`${API_URL}/admin/${user.id}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('Account updated successfully!');
      onUpdate({ ...user, name: name.trim(), email: email.toLowerCase() });
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update account.';
      setErrors({ general: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 roboto-normal">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl roboto-bold text-pink-600 text-sm">Edit Admin Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {errors.general && (
          <p className="text-red-500 mb-4 text-center bg-red-50 p-3 rounded-lg text-sm roboto-light-italic">
            {errors.general}
          </p>
        )}
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-5">
            <label htmlFor="name" className="block text-gray-700 font-medium mb-1 text-sm roboto-bold">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full p-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 text-sm roboto-normal`}
              placeholder="Enter name"
              disabled={isLoading}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1 roboto-light-italic">{errors.name}</p>}
          </div>
          <div className="mb-5">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-1 text-sm roboto-bold">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full p-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 text-sm roboto-normal`}
              placeholder="Enter email"
              disabled={isLoading}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1 roboto-light-italic">{errors.email}</p>}
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-1 text-sm roboto-bold">
              New Password (Optional)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 text-sm roboto-normal`}
              placeholder="Enter new password"
              disabled={isLoading}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1 roboto-light-italic">{errors.password}</p>}
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              className={`flex-1 p-3 rounded-lg font-semibold text-sm transition duration-200 ${isLoading ? 'bg-pink-300 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600 focus:ring-4 focus:ring-pink-300'} text-white roboto-bold`}
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Account'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 p-3 rounded-lg font-semibold text-sm transition duration-200 bg-gray-300 hover:bg-gray-400 text-gray-800 roboto-normal"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default EditAccount;
