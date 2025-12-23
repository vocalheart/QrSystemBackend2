import React, { useEffect, useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import AuthContext from "../components/AuthContext";
import { CartContext } from '../Contex/NotificationConterContex';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon, MagnifyingGlassIcon, ChevronUpDownIcon } from "@heroicons/react/24/outline";
import ApiLoader from '../Loader/ApiLoader';
import debounce from "lodash/debounce";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function Department() {
  const { user, isLoading } = useContext(AuthContext);
  const { fetchNotificationCounter } = useContext(CartContext);
  const navigate = useNavigate();
  const [department, setDepartment] = useState([]);
  const [deptName, setDeptName] = useState("");
  const [editId, setEditId] = useState(null);
  const [searchDepartment, setSearchDepartment] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [sortOrder, setSortOrder] = useState('asc');

  const GetDepartments = useCallback(async () => {
    setIsFetching(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const response = await axios.get(`${API_URL}/department`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartment(response.data.results || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
      const message =
        error.response?.status === 401 || error.response?.status === 403
          ? "Your session has expired. Please log in again."
          : error.response?.data?.message || "Failed to fetch departments";
      toast.error(message, { 
        duration: 3000,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }
      });
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setIsFetching(false);
    }
  }, [navigate]);

  const validateDepartmentName = (name) => {
    if (!name.trim()) return "Department name is required";
    if (name.length > 100) return "Department name must be 100 characters or less";
    return null;
  };

  const PostDepartment = useCallback(async () => {
    const error = validateDepartmentName(deptName);
    if (error) {
      toast.error(error, { 
        duration: 3000,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      if (editId) {
        await axios.put(
          `${API_URL}/department/${editId}`,
          { name: deptName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Department updated successfully", { 
          duration: 3000,
          style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }
        });
        setEditId(null);
      } else {
        await axios.post(
          `${API_URL}/department`,
          { name: deptName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Department added successfully", { 
          duration: 3000,
          style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }
        });
      }

      setDeptName("");
      setIsModalOpen(false);
      GetDepartments();
      fetchNotificationCounter();
    } catch (error) {
      console.error("Error posting department:", error);
      const message =
        error.response?.status === 401 || error.response?.status === 403
          ? "Your session has expired. Please log in again."
          : error.response?.data?.message || "Failed to save department";
      toast.error(message, { 
        duration: 3000,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }
      });
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [deptName, editId, GetDepartments, navigate, fetchNotificationCounter]);

  const DeleteDepartment = useCallback(
    async (id) => {
      setIsSubmitting(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");
        await axios.delete(`${API_URL}/department/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Department deleted successfully", { 
          duration: 3000,
          style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }
        });
        GetDepartments();
        setIsDeleteConfirmOpen(false);
        setDepartmentToDelete(null);
      } catch (error) {
        console.error("Error deleting department:", error);
        const message =
          error.response?.status === 401 || error.response?.status === 403
            ? "Your session has expired. Please log in again."
            : error.response?.data?.message || "Failed to delete department";
        toast.error(message, { 
          duration: 3000,
          style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }
        });
        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate("/login");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [GetDepartments, navigate]
  );

  const openModal = (type, item = null) => {
    setModalType(type);
    if (type === 'edit' && item) {
      setEditId(item.id);
      setDeptName(item.name);
    } else {
      setDeptName('');
      setEditId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setDeptName('');
    setEditId(null);
  };

  const handleSubmit = () => {
    PostDepartment();
  };

  const ConfirmDelete = (id) => {
    setDepartmentToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const CancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setDepartmentToDelete(null);
  };

  const handleSearchChange = useCallback(
    debounce((value) => {
      setSearchDepartment(value);
    }, 300),
    []
  );

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    GetDepartments();
  }, [user, isLoading, navigate, GetDepartments]);

  const toggleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const filteredDepartments = department
    .filter((item) => item.name.toLowerCase().includes(searchDepartment.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-900 font-[Inter] text-[12px] antialiased">
        <ApiLoader />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 py-6 sm:px-6 lg:px-8 font-[Inter] text-[12px] antialiased">
      <Toaster 
        position="bottom-right" 
        toastOptions={{ 
          style: { 
            fontSize: '12px', 
            padding: '12px', 
            borderRadius: '8px',
            background: '#ffffff',
            color: '#1e293b',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
          success: { iconTheme: { primary: '#4f46e5', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }} 
      />
      <div className="max-w-full sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-4">
          <div>
            <h1 className="text-[12px] font-bold text-slate-900 dark:text-slate-100 text-center sm:text-left">
              Manage Departments
            </h1>
            <p className="text-[12px] text-slate-600 dark:text-slate-400 mt-1 text-center sm:text-left">
              Add, edit, or remove departments from your organization
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openModal('add')}
              className="flex items-center px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white rounded-md hover:bg-gradient-to-r hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 transition-colors duration-200 disabled:opacity-50"
              aria-label="Add new department"
              disabled={isSubmitting || isFetching}
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add New
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 mb-6 sm:mb-8">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchDepartment}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search departments..."
              className="w-full pl-10 pr-10 py-2 text-[12px] text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
              aria-label="Search departments"
              disabled={isFetching}
            />
            {searchDepartment && (
              <button
                onClick={() => setSearchDepartment("")}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                aria-label="Clear search"
                disabled={isFetching}
              >
                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>

        {isFetching ? (
          <div className="flex justify-center items-center py-6">
            <ApiLoader />
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-center">
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              {searchDepartment
                ? "No departments match your search."
                : "No departments found. Add one to get started!"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-[12px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer"
                    onClick={toggleSort}
                  >
                    <div className="flex items-center">
                      Name
                      <ChevronUpDownIcon className="w-4 h-4 ml-1" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-[12px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {filteredDepartments.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-[12px] font-medium text-slate-900 dark:text-slate-100">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-[12px] font-medium">
                      <button
                        onClick={() => openModal('edit', item)}
                        className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 mr-4 disabled:opacity-50"
                        aria-label={`Edit ${item.name}`}
                        disabled={isSubmitting || isFetching}
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => ConfirmDelete(item.id)}
                        className="text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                        aria-label={`Delete ${item.name}`}
                        disabled={isSubmitting || isFetching}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 max-w-md w-full">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[12px] font-semibold text-slate-900 dark:text-slate-100">
                  {modalType === 'edit' ? 'Edit Department' : 'Add Department'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  aria-label="Close"
                  disabled={isSubmitting}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-6">
                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="Enter department name"
                  className="w-full px-3 py-2 text-[12px] text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                  aria-label="Department name"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors duration-200 disabled:opacity-50"
                  aria-label="Cancel"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-50 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 hover:bg-gradient-to-r hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600"
                  aria-label={modalType === 'edit' ? 'Update' : 'Add'}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ApiLoader size="small" />
                  ) : (
                    <span className="flex items-center">
                      {modalType === 'edit' ? (
                        <PencilIcon className="w-4 h-4 mr-1" />
                      ) : (
                        <PlusIcon className="w-4 h-4 mr-1" />
                      )}
                      {modalType === 'edit' ? 'Update' : 'Add'}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 max-w-xs w-full">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-[12px] font-semibold text-slate-900 dark:text-slate-100">
                  Confirm Deletion
                </h3>
                <button
                  onClick={CancelDelete}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  aria-label="Close"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[12px] text-slate-700 dark:text-slate-300 mb-4">
                Are you sure you want to delete this department? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={CancelDelete}
                  className="px-3 py-2 text-[12px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all duration-300"
                  aria-label="Cancel deletion"
                  disabled={isSubmitting || isFetching}
                >
                  Cancel
                </button>
                <button
                  onClick={() => DeleteDepartment(departmentToDelete)}
                  disabled={isSubmitting || isFetching}
                  className="px-3 py-2 text-[12px] bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Confirm deletion"
                >
                  {isSubmitting ? <ApiLoader /> : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Department;