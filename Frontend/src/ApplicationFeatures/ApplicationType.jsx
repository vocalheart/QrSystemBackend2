import React, { useEffect, useState, useCallback, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline';
import ApiLoader from '../Loader/ApiLoader';
import debounce from "lodash/debounce";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const initialState = {
  loading: true,
  error: '',
  data: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'FETCHING':
      return { ...state, loading: false, error: '', data: action.payload };
    case 'ERROR':
      return { ...state, loading: false, error: 'Something went wrong', data: [] };
    case 'ADD':
      return { ...state, data: [...state.data, action.payload] };
    case 'UPDATE':
      return {
        ...state,
        data: state.data.map((item) =>
          item.id === action.payload.id ? action.payload : item
        ),
      };
    case 'DELETE':
      return { ...state, data: state.data.filter((item) => item.id !== action.payload) };
    case 'REFRESH':
      return { ...state, loading: true };
    default:
      return state;
  }
}

function ApplicationType() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [applicationTypeToDelete, setApplicationTypeToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [sortOrder, setSortOrder] = useState('asc');

  const token = localStorage.getItem('token');
  const axiosAuth = axios.create({
    headers: { Authorization: `Bearer ${token}` },
  });

  const getAllApplicationTypes = useCallback(async () => {
    setIsFetching(true);
    try {
      if (!token) throw new Error("No token found");
      const response = await axiosAuth.get(`${API_URL}/applicationtype`);
      dispatch({ type: 'FETCHING', payload: response.data.result });
    } catch (err) {
      console.error('Error fetching application types:', err);
      dispatch({ type: 'ERROR' });
      const message =
        err.response?.status === 401 || err.response?.status === 403
          ? 'Your session has expired. Please log in again.'
          : 'Failed to fetch application types';
      toast.error(message, { duration: 3000 });
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setIsFetching(false);
    }
  }, [navigate, token]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    dispatch({ type: 'REFRESH' });
    await getAllApplicationTypes();
    setIsRefreshing(false);
  };

  const validateApplicationTypeName = (name) => {
    if (!name.trim()) return "Application type name is required";
    if (name.length > 100) return "Application type name must be 100 characters or less";
    return null;
  };

  const AddApplicationType = async () => {
    const error = validateApplicationTypeName(name);
    if (error) {
      toast.error(error, { duration: 3000 });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await axiosAuth.post(`${API_URL}/applicationtype`, { name });
      dispatch({ type: 'ADD', payload: { id: response.data.result, name } });
      setName('');
      setIsModalOpen(false);
      toast.success('Application type added successfully', { duration: 3000 });
      await getAllApplicationTypes();
    } catch (error) {
      console.error('Error adding application type:', error);
      const message =
        error.response?.status === 401 || error.response?.status === 403
          ? 'Your session has expired. Please log in again.'
          : error.response?.data?.message || 'Failed to add application type';
      toast.error(message, { duration: 3000 });
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const UpdateApplicationType = async () => {
    const error = validateApplicationTypeName(name);
    if (error) {
      toast.error(error, { duration: 3000 });
      return;
    }
    setIsSubmitting(true);
    try {
      await axiosAuth.put(`${API_URL}/applicationtype/${editId}`, { name });
      dispatch({ type: 'UPDATE', payload: { id: editId, name } });
      setEditId(null);
      setName('');
      setIsModalOpen(false);
      toast.success('Application type updated successfully', { duration: 3000 });
      await getAllApplicationTypes();
    } catch (error) {
      console.error('Error updating application type:', error);
      const message =
        error.response?.status === 401 || error.response?.status === 403
          ? 'Your session has expired. Please log in again.'
          : error.response?.data?.message || 'Failed to update application type';
      toast.error(message, { duration: 3000 });
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const DeleteApplicationType = async (id) => {
    setIsSubmitting(true);
    try {
      await axiosAuth.delete(`${API_URL}/applicationtype/${id}`);
      dispatch({ type: 'DELETE', payload: id });
      toast.success('Application type deleted successfully', { duration: 3000 });
      setIsDeleteConfirmOpen(false);
      setApplicationTypeToDelete(null);
      await getAllApplicationTypes();
    } catch (err) {
      console.error('Error deleting application type:', err);
      const message =
        err.response?.status === 401 || err.response?.status === 403
          ? 'Your session has expired. Please log in again.'
          : err.response?.data?.message || 'Failed to delete application type';
      toast.error(message, { duration: 3000 });
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const ConfirmDelete = (id) => {
    setApplicationTypeToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const CancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setApplicationTypeToDelete(null);
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    if (type === 'edit' && item) {
      setEditId(item.id);
      setName(item.name);
    } else {
      setName('');
      setEditId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setName('');
    setEditId(null);
  };

  const handleSubmit = () => {
    if (modalType === 'edit') {
      UpdateApplicationType();
    } else {
      AddApplicationType();
    }
  };

  const handleSearchChange = useCallback(
    debounce((value) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  const filteredData = state.data
    .filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });

  const toggleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  useEffect(() => {
    getAllApplicationTypes();
  }, [getAllApplicationTypes]);

  if (state.loading && !isRefreshing) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 font-roboto text-[12px] antialiased">
        <ApiLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 sm:px-6 lg:px-8 font-roboto text-[12px] antialiased">
      <Toaster position="top-right" toastOptions={{ style: { fontSize: "12px" } }} />
      <div className="max-w-full sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-4">
          <div>
            <h1 className="text-[12px] font-bold text-gray-900 dark:text-white text-center sm:text-left">
              Manage Application Types
            </h1>
            <p className="text-[12px] text-gray-600 dark:text-gray-300 mt-1 text-center sm:text-left">
              Add, edit, or remove application types from your organization
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openModal('add')}
              className="flex items-center px-3 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors duration-200 disabled:opacity-50"
              aria-label="Add new application type"
              disabled={isSubmitting || isFetching || isRefreshing}
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add New
            </button>
            <button
              onClick={handleRefresh}
              className="flex items-center px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              aria-label="Refresh application types"
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
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8 border border-gray-200 dark:border-gray-600">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search application types..."
              className="w-full pl-10 pr-10 py-2 text-[12px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300"
              aria-label="Search application types"
              disabled={isFetching}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Clear search"
                disabled={isFetching}
              >
                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Application Type Table */}
        {isFetching ? (
          <div className="flex justify-center items-center py-6">
            <ApiLoader />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-[12px] text-gray-500 dark:text-gray-300">
              {searchTerm
                ? 'No application types match your search.'
                : 'No application types found. Add one to get started!'}
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
                {filteredData.map((item) => (
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
                  {modalType === 'edit' ? 'Edit Application Type' : 'Add Application Type'}
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter application type name"
                  className="w-full px-3 py-2 text-[12px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300"
                  aria-label="Application type name"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200 disabled:opacity-50"
                  aria-label="Cancel"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className={`px-3 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors duration-200 disabled:opacity-50 bg-pink-600 hover:bg-pink-700`}
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
                Are you sure you want to delete this application type? This action cannot be undone.
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
                  onClick={() => DeleteApplicationType(applicationTypeToDelete)}
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
export default ApplicationType;