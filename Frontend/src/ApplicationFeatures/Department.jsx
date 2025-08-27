import React, { useEffect, useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import AuthContext from "../components/AuthContext";
import { CartContext } from '../Contex/NotificationConterContex';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon, MagnifyingGlassIcon, ArrowPathIcon, ChevronUpDownIcon } from "@heroicons/react/24/outline";
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [sortOrder, setSortOrder] = useState('asc');

  // Fetch departments
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
      toast.error(message, { duration: 3000 });
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setIsFetching(false);
    }
  }, [navigate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await GetDepartments();
    setIsRefreshing(false);
  };

  // Validate department name
  const validateDepartmentName = (name) => {
    if (!name.trim()) return "Department name is required";
    if (name.length > 100) return "Department name must be 100 characters or less";
    return null;
  };

  // Add or update department
  const PostDepartment = useCallback(async () => {
    const error = validateDepartmentName(deptName);
    if (error) {
      toast.error(error, { duration: 3000 });
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
        toast.success("Department updated successfully", { duration: 3000 });
        setEditId(null);
      } else {
        await axios.post(
          `${API_URL}/department`,
          { name: deptName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Department added successfully", { duration: 3000 });
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
      toast.error(message, { duration: 3000 });
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [deptName, editId, GetDepartments, navigate, fetchNotificationCounter]);

  // Delete department
  const DeleteDepartment = useCallback(
    async (id) => {
      setIsSubmitting(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");
        await axios.delete(`${API_URL}/department/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Department deleted successfully", { duration: 3000 });
        GetDepartments();
        setIsDeleteConfirmOpen(false);
        setDepartmentToDelete(null);
      } catch (error) {
        console.error("Error deleting department:", error);
        const message =
          error.response?.status === 401 || error.response?.status === 403
            ? "Your session has expired. Please log in again."
            : error.response?.data?.message || "Failed to delete department";
        toast.error(message, { duration: 3000 });
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

  // Confirm delete
  const ConfirmDelete = (id) => {
    setDepartmentToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  // Cancel delete
  const CancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setDepartmentToDelete(null);
  };

  // Debounced search handler
  const handleSearchChange = useCallback(
    debounce((value) => {
      setSearchDepartment(value);
    }, 300),
    []
  );

  // Fetch departments on mount
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

  // Filter and sort departments
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
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 font-roboto text-[12px] antialiased">
        <ApiLoader />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 sm:px-6 lg:px-8 font-roboto text-[12px] antialiased">
      <Toaster position="top-right" toastOptions={{ style: { fontSize: "12px" } }} />
      <div className="max-w-full sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-4">
          <div>
            <h1 className="text-[12px] font-bold text-gray-900 dark:text-white text-center sm:text-left">
              Manage Departments
            </h1>
            <p className="text-[12px] text-gray-600 dark:text-gray-300 mt-1 text-center sm:text-left">
              Add, edit, or remove departments from your organization
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openModal('add')}
              className="flex items-center px-3 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors duration-200 disabled:opacity-50"
              aria-label="Add new department"
              disabled={isSubmitting || isFetching || isRefreshing}
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add New
            </button>
            <button
              onClick={handleRefresh}
              className="flex items-center px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              aria-label="Refresh departments"
              disabled={isSubmitting || isFetching || isRefreshing}
            >
              {isRefreshing ? (
                <ApiLoader size="small" />
              ) : (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-1" />
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 mb-6 sm:mb-8">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchDepartment}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search departments..."
              className="w-full pl-10 pr-10 py-2 text-[12px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300"
              aria-label="Search departments"
              disabled={isFetching}
            />
            {searchDepartment && (
              <button
                onClick={() => setSearchDepartment("")}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Clear search"
                disabled={isFetching}
              >
                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Department Table */}
        {isFetching ? (
          <div className="flex justify-center items-center py-6">
            <ApiLoader />
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-[12px] text-gray-500 dark:text-gray-300">
              {searchDepartment
                ? "No departments match your search."
                : "No departments found. Add one to get started!"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-[12px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={toggleSort}
                  >
                    <div className="flex items-center">
                      Name
                      <ChevronUpDownIcon className="w-4 h-4 ml-1" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-[12px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDepartments.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-[12px] font-medium text-gray-900 dark:text-gray-100">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-[12px] font-medium">
                      <button
                        onClick={() => openModal('edit', item)}
                        className="text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 mr-4 disabled:opacity-50"
                        aria-label={`Edit ${item.name}`}
                        disabled={isSubmitting || isFetching}
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => ConfirmDelete(item.id)}
                        className="text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 disabled:opacity-50"
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

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-w-md w-full">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[12px] font-semibold text-gray-900 dark:text-white">
                  {modalType === 'edit' ? 'Edit Department' : 'Add Department'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
                  className="w-full px-3 py-2 text-[12px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300"
                  aria-label="Department name"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200 disabled:opacity-50"
                  aria-label="Cancel"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors duration-200 disabled:opacity-50 ${
                    modalType === 'edit' ? 'bg-pink-600 hover:bg-pink-700' : 'bg-pink-600 hover:bg-pink-700'
                  }`}
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

        {/* Delete Confirmation Modal */}
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 max-w-xs w-full">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-[12px] font-semibold text-gray-900 dark:text-white">
                  Confirm Deletion
                </h3>
                <button
                  onClick={CancelDelete}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  aria-label="Close"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[12px] text-gray-700 dark:text-gray-300 mb-4">
                Are you sure you want to delete this department? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={CancelDelete}
                  className="px-3 py-2 text-[12px] bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300"
                  aria-label="Cancel deletion"
                  disabled={isSubmitting || isFetching}
                >
                  Cancel
                </button>
                <button
                  onClick={() => DeleteDepartment(departmentToDelete)}
                  disabled={isSubmitting || isFetching}
                  className="px-3 py-2 text-[12px] bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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