import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
  ArrowLeftIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronUpDownIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import debounce from "lodash/debounce";

export default function CreateMember() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Consolidated state management
  const [state, setState] = useState({
    dialogOpen: false,
    updateDialogOpen: false,
    deleteDialogOpen: false,
    deleteMemberId: null,
    formData: { name: "", email: "", password: "" },
    updateFormData: { id: "", name: "", email: "" },
    errors: {},
    updateErrors: {},
    loading: false,
    fetchLoading: true,
    isRefreshing: false,
    showPassword: false,
    searchTerm: "",
    sortConfig: { key: "name", direction: "asc" },
    showFilters: false,
    filterOptions: { active: true, inactive: true, recent: false },
    members: [],
    filteredMembers: [],
  });

  const nameInputRef = useRef(null);
  const updateNameInputRef = useRef(null);
  const dialogRef = useRef(null);

  const updateState = (updates) =>
    setState((prev) => ({ ...prev, ...updates }));

  const loadMembers = useCallback(async () => {
    updateState({ fetchLoading: true });
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      updateState({
        members: response.data.data,
        filteredMembers: response.data.data,
      });
    } catch (err) {
      console.error("Error fetching members:", err);
      const message =
        err.response?.status === 401 || err.response?.status === 403
          ? "Your session has expired. Please log in again."
          : "Failed to fetch members";
      toast.error(message, { duration: 3000 });
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      updateState({ fetchLoading: false });
    }
  }, [navigate]);

  const handleRefresh = async () => {
    updateState({ isRefreshing: true });
    await loadMembers();
    updateState({ isRefreshing: false });
  };

  // Check admin role and fetch members
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to manage members.");
      navigate("/login", { replace: true });
      return;
    }

    let user;
    try {
      user = jwtDecode(token);
    } catch (err) {
      toast.error("Invalid token. Please log in again.");
      navigate("/login", { replace: true });
      return;
    }

    if (user.role !== "admin") {
      toast.error("Only admins can manage members.");
      navigate("/dashboard", { replace: true });
      return;
    }

    loadMembers();
  }, [loadMembers, navigate]);

  // Filter and sort members
  useEffect(() => {
    let result = [...state.members];

    // Apply search filter
    if (state.searchTerm) {
      const term = state.searchTerm.toLowerCase();
      result = result.filter(
        (member) =>
          member.name.toLowerCase().includes(term) ||
          member.email.toLowerCase().includes(term)
      );
    }

    // Apply status filters
    if (!state.filterOptions.active || !state.filterOptions.inactive) {
      result = result.filter((member) => {
        const isActive = member.status === "active";
        return (
          (state.filterOptions.active && isActive) ||
          (state.filterOptions.inactive && !isActive)
        );
      });
    }

    // Apply recent filter
    if (state.filterOptions.recent) {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      result = result.filter(
        (member) => new Date(member.created_at) > oneWeekAgo
      );
    }

    // Apply sorting
    if (state.sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[state.sortConfig.key] || "";
        const bValue = b[state.sortConfig.key] || "";
        if (aValue < bValue)
          return state.sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue)
          return state.sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    updateState({ filteredMembers: result });
  }, [state.members, state.searchTerm, state.sortConfig, state.filterOptions]);

  // Keyboard navigation for dialogs
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        updateState({
          dialogOpen: false,
          updateDialogOpen: false,
          deleteDialogOpen: false,
        });
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Toast notifications
  const showErrorToast = (message) => {
    toast.error(message, {
      icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
      position: "top-center",
      style: {
        background: "#FEE2E2",
        color: "#B91C1C",
        border: "1px solid #FECACA",
        maxWidth: "90vw",
      },
    });
  };

  const showSuccessToast = (message) => {
    toast.success(message, {
      icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
      position: "top-center",
      style: {
        background: "#D1FAE5",
        color: "#065F46",
        border: "1px solid #A7F3D0",
        maxWidth: "90vw",
      },
    });
  };

  // Validation functions
  const validateField = (name, value) => {
    switch (name) {
      case "name":
        const nameLength = value.trim().length;
        if (nameLength < 2) return "Name must be at least 2 characters long.";
        if (nameLength > 100) return "Name must be 100 characters or less.";
        return "";
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? ""
          : "Please enter a valid email address.";
      case "password":
        return value.length >= 6
          ? ""
          : "Password must be at least 6 characters long.";
      default:
        return "";
    }
  };
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateState({
      formData: { ...state.formData, [name]: value },
      errors: { ...state.errors, [name]: validateField(name, value) },
    });
  };
  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    updateState({
      updateFormData: { ...state.updateFormData, [name]: value },
      updateErrors: {
        ...state.updateErrors,
        [name]: validateField(name, value),
      },
    });
  };
  // Handle sorting
  const requestSort = (key) => {
    updateState({
      sortConfig: {
        key,
        direction:
          state.sortConfig.key === key && state.sortConfig.direction === "asc"
            ? "desc"
            : "asc",
      },
    });
  };
  // Handle create member submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {
      name: validateField("name", state.formData.name),
      email: validateField("email", state.formData.email),
      password: validateField("password", state.formData.password),
    };

    if (Object.values(newErrors).some((error) => error)) {
      updateState({ errors: newErrors });
      showErrorToast("Please fix the errors in the form.");
      return;
    }
    updateState({ loading: true });
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/create-member`,
        { ...state.formData, email: state.formData.email.toLowerCase() },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
      );
      showSuccessToast("Member created successfully!");
      updateState({
        formData: { name: "", email: "", password: "" },
        showPassword: false,
        dialogOpen: false,
      });
      await loadMembers();
    } catch (err) {
      console.error("Error creating member:", err);
      const errorMsg =
        err.response?.status === 429
          ? "Too many attempts. Please try again later."
          : err.response?.data?.message || "Failed to create member.";
      updateState({ errors: { general: errorMsg } });
      showErrorToast(errorMsg);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      updateState({ loading: false });
    }
  };
  // Handle update member submission
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {
      name: validateField("name", state.updateFormData.name),
      email: validateField("email", state.updateFormData.email),
    };

    if (Object.values(newErrors).some((error) => error)) {
      updateState({ updateErrors: newErrors });
      showErrorToast("Please fix the errors in the form.");
      return;
    }

    updateState({ loading: true });
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/members/${state.updateFormData.id}`,
        {
          ...state.updateFormData,
          email: state.updateFormData.email.toLowerCase(),
        },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
      );
      showSuccessToast("Member updated successfully!");
      updateState({ updateDialogOpen: false });
      await loadMembers();
    } catch (err) {
      console.error("Error updating member:", err);
      const errorMsg =
        err.response?.status === 429
          ? "Too many attempts. Please try again later."
          : err.response?.data?.message || "Failed to update member.";
      updateState({ updateErrors: { general: errorMsg } });
      showErrorToast(errorMsg);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      updateState({ loading: false });
    }
  };

  // Handle delete member
  const handleDeleteMember = async () => {
    updateState({ loading: true });
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/members/${state.deleteMemberId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      showSuccessToast("Member deleted successfully!");
      updateState({ deleteDialogOpen: false, deleteMemberId: null });
      await loadMembers();
    } catch (err) {
      console.error("Error deleting member:", err);
      const errorMsg =
        err.response?.status === 429
          ? "Too many attempts. Please try again later."
          : err.response?.data?.message || "Failed to delete member.";
      showErrorToast(errorMsg);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      updateState({ loading: false });
    }
  };

  const handleSearchChange = useCallback(
    debounce((value) => {
      updateState({ searchTerm: value });
    }, 300),
    []
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 sm:px-6 lg:px-8 font-roboto text-[12px] antialiased">
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: "12px" } }}
      />
      <div className="max-w-full sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-4">
          <div>
            <h1 className="text-[12px] font-bold text-gray-900 dark:text-white text-center sm:text-left">
              Manage Members
            </h1>
            <p className="text-[12px] text-gray-600 dark:text-gray-300 mt-1 text-center sm:text-left">
              Add, edit, or remove members from your organization
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateState({ dialogOpen: true })}
              className="flex items-center px-3 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors duration-200 disabled:opacity-50"
              aria-label="Add new member"
              disabled={
                state.loading || state.fetchLoading || state.isRefreshing
              }
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add New
            </button>
            <button
              onClick={handleRefresh}
              className="flex items-center px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              aria-label="Refresh members"
              disabled={
                state.loading || state.fetchLoading || state.isRefreshing
              }
            >
              {state.isRefreshing ? (
                <ArrowPathIcon className="animate-spin w-4 h-4 mr-1" />
              ) : (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-1" />
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8 border border-gray-200 dark:border-gray-600">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search members..."
                className="w-full pl-10 pr-10 py-2 text-[12px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300"
                value={state.searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                aria-label="Search members"
                disabled={state.fetchLoading}
              />
              {state.searchTerm && (
                <button
                  onClick={() => updateState({ searchTerm: "" })}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Clear search"
                  disabled={state.fetchLoading}
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => updateState({ showFilters: !state.showFilters })}
                className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-[12px]"
                aria-label="Toggle filters"
              >
                <FunnelIcon className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
                Filters
                {state.showFilters ? (
                  <ChevronUpIcon className="w-4 h-4 ml-1 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 ml-1 text-gray-500 dark:text-gray-400" />
                )}
              </button>
              {state.showFilters && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 p-3">
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={state.filterOptions.active}
                        onChange={() =>
                          updateState({
                            filterOptions: {
                              ...state.filterOptions,
                              active: !state.filterOptions.active,
                            },
                          })
                        }
                        className="rounded text-pink-600 focus:ring-pink-500"
                      />
                      <span className="text-[12px] text-gray-700 dark:text-gray-300">
                        Active Members
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={state.filterOptions.inactive}
                        onChange={() =>
                          updateState({
                            filterOptions: {
                              ...state.filterOptions,
                              inactive: !state.filterOptions.inactive,
                            },
                          })
                        }
                        className="rounded text-pink-600 focus:ring-pink-500"
                      />
                      <span className="text-[12px] text-gray-700 dark:text-gray-300">
                        Inactive Members
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={state.filterOptions.recent}
                        onChange={() =>
                          updateState({
                            filterOptions: {
                              ...state.filterOptions,
                              recent: !state.filterOptions.recent,
                            },
                          })
                        }
                        className="rounded text-pink-600 focus:ring-pink-500"
                      />
                      <span className="text-[12px] text-gray-700 dark:text-gray-300">
                        Added in last 7 days
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Members Table */}
        {state.fetchLoading ? (
          <div className="flex justify-center items-center py-6">
            <ArrowPathIcon className="animate-spin h-6 w-6 text-pink-600" />
          </div>
        ) : state.filteredMembers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-[12px] text-gray-500 dark:text-gray-300">
              {state.searchTerm
                ? "No members match your search."
                : "No members found. Add one to get started!"}
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
                    onClick={() => requestSort("name")}
                  >
                    <div className="flex items-center">
                      Name
                      <ChevronUpDownIcon className="w-4 h-4 ml-1" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-[12px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("status")}
                  >
                    <div className="flex items-center">
                      Status
                      <ChevronUpDownIcon className="w-4 h-4 ml-1" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-[12px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("email")}
                  >
                    <div className="flex items-center">
                      Email
                      <ChevronUpDownIcon className="w-4 h-4 ml-1" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-[12px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("created_at")}
                  >
                    <div className="flex items-center">
                      Joined
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
                {state.filteredMembers?.map((member) => (
                  <tr
                    key={member?.id || Math.random()}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-[12px] font-medium text-gray-900 dark:text-gray-100">
                      {member?.name || "—"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-[12px] text-gray-900 dark:text-gray-100">
                      <span
                        className={`px-2 py-1 rounded-full text-[12px] font-medium ${
                          member?.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                        }`}
                      >
                        {member?.status
                          ? member.status.charAt(0).toUpperCase() +
                            member.status.slice(1)
                          : "Unknown"}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-[12px] text-gray-900 dark:text-gray-100">
                      {member?.email || "—"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-[12px] text-gray-900 dark:text-gray-100">
                      {member?.created_at
                        ? new Date(member.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )
                        : "—"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-[12px] font-medium">
                      <button
                        onClick={() =>
                          updateState({
                            updateFormData: {
                              id: member?.id,
                              name: member?.name,
                              email: member?.email,
                            },
                            updateDialogOpen: true,
                          })
                        }
                        className="text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 mr-4 disabled:opacity-50"
                        aria-label={`Edit ${member?.name || ""}`}
                        disabled={state.loading || state.fetchLoading}
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() =>
                          updateState({
                            deleteMemberId: member?.id,
                            deleteDialogOpen: true,
                          })
                        }
                        className="text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 disabled:opacity-50"
                        aria-label={`Delete ${member?.name || ""}`}
                        disabled={state.loading || state.fetchLoading}
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

        {/* Create Member Dialog */}
        {state.dialogOpen && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            ref={dialogRef}
          >
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-w-md w-full">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[12px] font-semibold text-gray-900 dark:text-white">
                  Add New Member
                </h3>
                <button
                  onClick={() => updateState({ dialogOpen: false })}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  aria-label="Close"
                  disabled={state.loading}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              {state.errors.general && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-start text-[12px]">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                  <span>{state.errors.general}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label
                    htmlFor="name"
                    className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={state.formData.name}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2 text-[12px] border rounded-md focus:ring-2 focus:ring-pink-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        state.errors.name
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="Enter member's full name"
                      required
                      autoComplete="name"
                      disabled={state.loading}
                      ref={nameInputRef}
                      aria-describedby={
                        state.errors.name ? "name-error" : undefined
                      }
                    />
                  </div>
                  {state.errors.name && (
                    <p
                      id="name-error"
                      className="mt-1 text-[12px] text-red-600 dark:text-red-400"
                    >
                      {state.errors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={state.formData.email}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2 text-[12px] border rounded-md focus:ring-2 focus:ring-pink-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        state.errors.email
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="Enter member's email"
                      required
                      autoComplete="email"
                      disabled={state.loading}
                      aria-describedby={
                        state.errors.email ? "email-error" : undefined
                      }
                    />
                  </div>
                  {state.errors.email && (
                    <p
                      id="email-error"
                      className="mt-1 text-[12px] text-red-600 dark:text-red-400"
                    >
                      {state.errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type={state.showPassword ? "text" : "password"}
                      name="password"
                      id="password"
                      value={state.formData.password}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-10 py-2 text-[12px] border rounded-md focus:ring-2 focus:ring-pink-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        state.errors.password
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                      disabled={state.loading}
                      aria-describedby={
                        state.errors.password ? "password-error" : undefined
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateState({ showPassword: !state.showPassword })
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      aria-label={
                        state.showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {state.showPassword ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {state.errors.password && (
                    <p
                      id="password-error"
                      className="mt-1 text-[12px] text-red-600 dark:text-red-400"
                    >
                      {state.errors.password}
                    </p>
                  )}
                  <p className="mt-1 text-[12px] text-gray-500 dark:text-gray-400">
                    Password must be at least 6 characters long.
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => updateState({ dialogOpen: false })}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200 disabled:opacity-50 text-[12px]"
                    aria-label="Cancel"
                    disabled={state.loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={state.loading}
                    className={`px-3 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors duration-200 disabled:opacity-50 bg-pink-600 hover:bg-pink-700 text-[12px]`}
                    aria-label="Create member"
                  >
                    {state.loading ? (
                      <ArrowPathIcon className="animate-spin h-4 w-4 mr-1 inline" />
                    ) : (
                      <span className="flex items-center">
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Add
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Update Member Dialog */}
        {state.updateDialogOpen && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            ref={dialogRef}
          >
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-w-md w-full">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[12px] font-semibold text-gray-900 dark:text-white">
                  Edit Member
                </h3>
                <button
                  onClick={() => updateState({ updateDialogOpen: false })}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  aria-label="Close"
                  disabled={state.loading}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              {state.updateErrors.general && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-start text-[12px]">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                  <span>{state.updateErrors.general}</span>
                </div>
              )}
              <form
                onSubmit={handleUpdateSubmit}
                className="space-y-5"
                noValidate
              >
                <div>
                  <label
                    htmlFor="update-name"
                    className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      name="name"
                      id="update-name"
                      value={state.updateFormData.name}
                      onChange={handleUpdateChange}
                      className={`w-full pl-10 pr-4 py-2 text-[12px] border rounded-md focus:ring-2 focus:ring-pink-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        state.updateErrors.name
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="Enter member's full name"
                      required
                      autoComplete="name"
                      disabled={state.loading}
                      ref={updateNameInputRef}
                      aria-describedby={
                        state.updateErrors.name
                          ? "update-name-error"
                          : undefined
                      }
                    />
                  </div>
                  {state.updateErrors.name && (
                    <p
                      id="update-name-error"
                      className="mt-1 text-[12px] text-red-600 dark:text-red-400"
                    >
                      {state.updateErrors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="update-email"
                    className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="email"
                      name="email"
                      id="update-email"
                      value={state.updateFormData.email}
                      onChange={handleUpdateChange}
                      className={`w-full pl-10 pr-4 py-2 text-[12px] border rounded-md focus:ring-2 focus:ring-pink-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        state.updateErrors.email
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="Enter member's email"
                      required
                      autoComplete="email"
                      disabled={state.loading}
                      aria-describedby={
                        state.updateErrors.email
                          ? "update-email-error"
                          : undefined
                      }
                    />
                  </div>
                  {state.updateErrors.email && (
                    <p
                      id="update-email-error"
                      className="mt-1 text-[12px] text-red-600 dark:text-red-400"
                    >
                      {state.updateErrors.email}
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => updateState({ updateDialogOpen: false })}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200 disabled:opacity-50 text-[12px]"
                    aria-label="Cancel"
                    disabled={state.loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={state.loading}
                    className={`px-3 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors duration-200 disabled:opacity-50 bg-pink-600 hover:bg-pink-700 text-[12px]`}
                    aria-label="Update member"
                  >
                    {state.loading ? (
                      <ArrowPathIcon className="animate-spin h-4 w-4 mr-1 inline" />
                    ) : (
                      <span className="flex items-center">
                        <PencilIcon className="w-4 h-4 mr-1" />
                        Update
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Member Confirmation Dialog */}
        {state.deleteDialogOpen && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            ref={dialogRef}
          >
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 max-w-xs w-full">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-[12px] font-semibold text-gray-900 dark:text-white">
                  Confirm Deletion
                </h3>
                <button
                  onClick={() => updateState({ deleteDialogOpen: false })}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  aria-label="Close"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[12px] text-gray-700 dark:text-gray-300 mb-4">
                Are you sure you want to delete this member? This action cannot
                be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => updateState({ deleteDialogOpen: false })}
                  className="px-3 py-2 text-[12px] bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300"
                  aria-label="Cancel deletion"
                  disabled={state.loading || state.fetchLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteMember}
                  disabled={state.loading || state.fetchLoading}
                  className="px-3 py-2 text-[12px] bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Confirm deletion"
                >
                  {state.loading ? (
                    <ArrowPathIcon className="animate-spin h-4 w-4" />
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
