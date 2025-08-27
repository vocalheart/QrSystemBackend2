import React, { useEffect, useState, useContext, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../Contex/NotificationConterContex";
import toast, { Toaster } from "react-hot-toast";
import ApiLoader from "../Loader/ApiLoader";
import {
  ExclamationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  HandThumbUpIcon,
  XCircleIcon,
  PauseCircleIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  FunnelIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/solid";
import debounce from "lodash/debounce";
import noSubmissionFound from "../assets/vecteezy_no-results-found-or-missing-search-result-concept-flat_67565900.jpg";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const statusIcons = {
  pending: <ClockIcon className="h-4 w-4 text-yellow-500" />,
  reviewed: <DocumentTextIcon className="h-4 w-4 text-blue-500" />,
  shortlisted: <HandThumbUpIcon className="h-4 w-4 text-purple-500" />,
  rejected: <XCircleIcon className="h-4 w-4 text-red-500" />,
  approved: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
  on_hold: <PauseCircleIcon className="h-4 w-4 text-gray-500" />,
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800/30",
  reviewed: "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30",
  shortlisted: "bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/30",
  rejected: "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30",
  approved: "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30",
  on_hold: "bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-700/20 dark:text-gray-300 dark:border-gray-600/30",
};

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

const exportToCSV = (data) => {
  const headers = [
    "ID",
    "Name",
    "Email",
    "Status",
    "Designation",
    "Department",
    "Application Type",
    "Reviewed",
    "Created At",
  ];
  const rows = data.map((item) => [
    item.id,
    item.name || "N/A",
    item.email || "N/A",
    item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1).replace("_", " ") : "N/A",
    item.designation || "N/A",
    item.department_name || "N/A",
    item.application_type_name || item.application_type || "N/A",
    item.reviewed === 1 ? "Yes" : "No",
    formatDate(item.created_at),
  ]);
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `submissions_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const StatusBadge = ({ status }) => {
  const displayStatus = status
    ? status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")
    : "Unknown";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium transition-all duration-200 ${
        statusColors[status] || "bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-700/20 dark:text-gray-300 dark:border-gray-600/30"
      }`}
    >
      {statusIcons[status] || <ClockIcon className="h-4 w-4 text-gray-500" />}
      <span className="ml-1.5">{displayStatus}</span>
    </span>
  );
};

const SubmissionMenu = ({ submission, onViewResume }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => setIsOpen(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 text-gray-500 hover:text-pink-600 dark:hover:text-pink-400 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all duration-200"
        aria-label="Submission menu"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-850 rounded-md shadow-lg py-1.5 z-20 border border-gray-200 dark:border-gray-800">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewResume();
              setIsOpen(false);
            }}
            className="flex items-center px-3 py-2 text-[12px] text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 w-full text-left transition-all duration-200"
            aria-label="View resume"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            View Resume
          </button>
        </div>
      )}
    </div>
  );
};

const SubmissionCard = ({
  submission,
  expandedCard,
  actionLoading,
  statuses,
  designations,
  departments,
  onToggleExpand,
  onStatusChange,
  onReviewChange,
  onViewResume,
  onDesignationChange,
  onDepartmentChange,
}) => {
  return (
    <div className="bg-white dark:bg-gray-850 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">
              {submission.name || "Unknown"}
            </h3>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1 truncate">
              {submission.email || "N/A"}
            </p>
          </div>
          <div className="ml-2 flex-shrink-0">
            <StatusBadge status={submission.status} />
          </div>
        </div>
        <div className="text-[12px] text-gray-500 dark:text-gray-400 mb-4">
          <span>{formatDate(submission.created_at)}</span>
        </div>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            expandedCard === submission.id ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px] mb-4">
            <div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Type</p>
              <p className="text-gray-900 dark:text-white truncate">
                {submission.application_type_name || submission.application_type || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Reviewed</p>
              <p className="text-gray-900 dark:text-white">
                {submission.reviewed === 1 ? "Yes" : "No"}
              </p>
            </div>
          </div>
          {submission.reason && (
            <div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Reason</p>
              <p className="text-gray-900 dark:text-white text-[12px]">{submission.reason}</p>
            </div>
          )}
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={() => onToggleExpand(submission.id)}
            className="text-[12px] font-medium text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 flex items-center transition-all duration-200"
            aria-label={expandedCard === submission.id ? "Show less details" : "Show more details"}
          >
            {expandedCard === submission.id ? (
              <>
                <ChevronUpIcon className="h-4 w-4 mr-1" />
                Less Details
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-4 w-4 mr-1" />
                More Details
              </>
            )}
          </button>
          <div className="flex space-x-2">
            {submission.resume && (
              <SubmissionMenu submission={submission} onViewResume={() => onViewResume(submission.id)} />
            )}
          </div>
        </div>
        <div className="space-y-3">
          <div className="relative">
            <select
              value={submission.status || ""}
              onChange={(e) => onStatusChange(submission.id, e)}
              className="w-full pl-3 pr-8 py-2 text-[12px] border border-gray-300 dark:border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-850 text-gray-900 dark:text-gray-100 disabled:opacity-50 transition-all duration-200 appearance-none"
              disabled={actionLoading === submission.id}
              aria-label="Change submission status"
            >
              <option value="">Select Status</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.name}>
                  {status.name.charAt(0).toUpperCase() + status.name.slice(1).replace("_", " ")}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            {actionLoading === submission.id && (
              <div className="absolute right-7 top-2">
                <ApiLoader size="small" />
              </div>
            )}
          </div>
          <div className="relative">
            <select
              value={submission.designation || ""}
              onChange={(e) => onDesignationChange(submission.id, e)}
              className="w-full pl-3 pr-8 py-2 text-[12px] border border-gray-300 dark:border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-850 text-gray-900 dark:text-gray-100 disabled:opacity-50 transition-all duration-200 appearance-none"
              disabled={actionLoading === submission.id}
              aria-label="Change submission designation"
            >
              <option value="">Select Designation</option>
              {designations.map((designation) => (
                <option key={designation.id} value={designation.name}>
                  {designation.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            {actionLoading === submission.id && (
              <div className="absolute right-7 top-2">
                <ApiLoader size="small" />
              </div>
            )}
          </div>
          <div className="relative">
            <select
              value={submission.department_name || ""}
              onChange={(e) => onDepartmentChange(submission.id, e)}
              className="w-full pl-3 pr-8 py-2 text-[12px] border border-gray-300 dark:border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-850 text-gray-900 dark:text-gray-100 disabled:opacity-50 transition-all duration-200 appearance-none"
              disabled={actionLoading === submission.id}
              aria-label="Change submission department"
            >
              <option value="">Select Department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.name}>
                  {department.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            {actionLoading === submission.id && (
              <div className="absolute right-7 top-2">
                <ApiLoader size="small" />
              </div>
            )}
          </div>
          <label className="flex items-center space-x-2 cursor-pointer pt-1">
            <div className="relative">
              <input
                type="checkbox"
                checked={submission.reviewed === 1}
                onChange={(e) => onReviewChange(submission.id, e)}
                className="h-3.5 w-3.5 text-pink-600 focus:ring-pink-500 border-gray-300 dark:border-gray-800 rounded transition-all duration-200"
                disabled={actionLoading === submission.id}
                aria-label="Mark submission as reviewed"
              />
              {actionLoading === submission.id && (
                <div className="absolute -right-6 top-0">
                  <ApiLoader size="small" />
                </div>
              )}
            </div>
            <span className="text-[12px] text-gray-700 dark:text-gray-300">
              Mark as reviewed
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

const SubmissionTable = ({
  submissions,
  actionLoading,
  statuses,
  designations,
  departments,
  onStatusChange,
  onReviewChange,
  onViewResume,
  onDesignationChange,
  onDepartmentChange,
}) => {
  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-850 rounded-lg border border-gray-200 dark:border-gray-800 shadow-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
          <tr>
            {[
              "Name",
              "Email",
              "Status",
              "Designation",
              "Department",
              "Type",
              "Reviewed",
              "Created At",
              "Actions",
            ].map((header) => (
              <th
                key={header}
                className="px-2 sm:px-4 py-3 text-left text-[12px] sm:text-[13px] font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {submissions.map((submission, index) => (
            <tr
              key={submission.id}
              className={`${
                index % 2 === 0 ? "bg-white dark:bg-gray-850" : "bg-gray-50 dark:bg-gray-800/50"
              } hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all duration-200`}
            >
              <td className="px-2 sm:px-4 py-3 text-[12px] sm:text-[13px] text-gray-900 dark:text-gray-100 max-w-xs truncate">
                {submission.name || "N/A"}
              </td>
              <td className="px-2 sm:px-4 py-3 text-[12px] sm:text-[13px] text-gray-900 dark:text-gray-100 max-w-xs truncate">
                {submission.email || "N/A"}
              </td>
              <td className="px-2 sm:px-4 py-3">
                <div className="relative">
                  <select
                    value={submission.status || ""}
                    onChange={(e) => onStatusChange(submission.id, e)}
                    className="w-full pl-2 pr-7 py-1.5 text-[12px] sm:text-[13px] border border-gray-300 dark:border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-850 text-gray-900 dark:text-gray-100 disabled:opacity-50 transition-all duration-200 appearance-none"
                    disabled={actionLoading === submission.id}
                    aria-label="Change submission status"
                  >
                    <option value="">Select Status</option>
                    {statuses.map((status) => (
                      <option key={status.id} value={status.name}>
                        {status.name.charAt(0).toUpperCase() + status.name.slice(1).replace("_", " ")}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-2 top-2 h-3 w-3 text-gray-400 pointer-events-none" />
                  {actionLoading === submission.id && (
                    <div className="absolute right-6 top-1.5">
                      <ApiLoader size="small" />
                    </div>
                  )}
                </div>
              </td>
              <td className="px-2 sm:px-4 py-3">
                <div className="relative">
                  <select
                    value={submission.designation || ""}
                    onChange={(e) => onDesignationChange(submission.id, e)}
                    className="w-full pl-2 pr-7 py-1.5 text-[12px] sm:text-[13px] border border-gray-300 dark:border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-850 text-gray-900 dark:text-gray-100 disabled:opacity-50 transition-all duration-200 appearance-none"
                    disabled={actionLoading === submission.id}
                    aria-label="Change submission designation"
                  >
                    <option value="">Select Designation</option>
                    {designations.map((designation) => (
                      <option key={designation.id} value={designation.name}>
                        {designation.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-2 top-2 h-3 w-3 text-gray-400 pointer-events-none" />
                  {actionLoading === submission.id && (
                    <div className="absolute right-6 top-1.5">
                      <ApiLoader size="small" />
                    </div>
                  )}
                </div>
              </td>
              <td className="px-2 sm:px-4 py-3">
                <div className="relative">
                  <select
                    value={submission.department_name || ""}
                    onChange={(e) => onDepartmentChange(submission.id, e)}
                    className="w-full pl-2 pr-7 py-1.5 text-[12px] sm:text-[13px] border border-gray-300 dark:border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-850 text-gray-900 dark:text-gray-100 disabled:opacity-50 transition-all duration-200 appearance-none"
                    disabled={actionLoading === submission.id}
                    aria-label="Change submission department"
                  >
                    <option value="">Select Department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.name}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-2 top-2 h-3 w-3 text-gray-400 pointer-events-none" />
                  {actionLoading === submission.id && (
                    <div className="absolute right-6 top-1.5">
                      <ApiLoader size="small" />
                    </div>
                  )}
                </div>
              </td>
              <td className="px-2 sm:px-4 py-3 text-[12px] sm:text-[13px] text-gray-900 dark:text-gray-100">
                {submission.application_type_name || submission.application_type || "N/A"}
              </td>
              <td className="px-2 sm:px-4 py-3">
                <label className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={submission.reviewed === 1}
                    onChange={(e) => onReviewChange(submission.id, e)}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 dark:border-gray-800 rounded transition-all duration-200"
                    disabled={actionLoading === submission.id}
                    aria-label="Mark submission as reviewed"
                  />
                </label>
              </td>
              <td className="px-2 sm:px-4 py-3 text-[12px] sm:text-[13px] text-gray-500 dark:text-gray-400 whitespace-nowrap hidden sm:table-cell">
                {formatDate(submission.created_at)}
              </td>
              <td className="px-2 sm:px-4 py-3">
                {submission.resume && (
                  <button
                    onClick={() => onViewResume(submission.id)}
                    className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 flex items-center text-[12px] sm:text-[13px] transition-all duration-200"
                    aria-label="View resume"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SearchAndFilter = ({ searchQuery, statusFilter, statuses, onSearchChange, onFilterChange, onExportCSV, viewMode, onViewModeChange }) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search by name, email, type..."
            value={searchQuery}
            onChange={onSearchChange}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-850 text-[12px] sm:text-[13px] text-gray-900 dark:text-gray-100 transition-all duration-200"
            aria-label="Search submissions"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="flex gap-2">
          <div className="relative hidden sm:block">
            <select
              value={statusFilter}
              onChange={onFilterChange}
              className="appearance-none w-full sm:w-44 pl-3 pr-8 py-2.5 border border-gray-300 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-850 text-[12px] sm:text-[13px] text-gray-900 dark:text-gray-100 transition-all duration-200"
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.name}>
                  {status.name.charAt(0).toUpperCase() + status.name.slice(1).replace("_", " ")}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
          </div>
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="sm:hidden flex items-center justify-center px-3 py-2.5 border border-gray-300 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-850 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
            aria-label="Toggle filters"
          >
            <FunnelIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onViewModeChange}
            className="flex items-center justify-center px-3 py-2.5 border border-gray-300 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-850 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
            aria-label="Toggle view mode"
          >
            {viewMode === "table" ? (
              <ArrowsPointingInIcon className="h-5 w-5" />
            ) : (
              <ArrowsPointingOutIcon className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={onExportCSV}
            className="flex items-center justify-center px-4 py-2.5 text-[12px] sm:text-[13px] font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 shadow-sm hover:shadow"
            aria-label="Export submissions to CSV"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
            Export
          </button>
        </div>
      </div>
      {isFiltersOpen && (
        <div className="sm:hidden bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={onFilterChange}
              className="w-full pl-3 pr-8 py-2.5 border border-gray-300 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-850 text-[12px] text-gray-900 dark:text-gray-100"
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.name}>
                  {status.name.charAt(0).toUpperCase() + status.name.slice(1).replace("_", " ")}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
};

const ErrorMessage = ({ error }) => (
  <div className="mb-6 p-4 bg-white dark:bg-gray-850 border border-red-200 dark:border-red-900/30 rounded-lg shadow-md">
    <div className="flex items-center">
      <ExclamationCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
      <p className="text-[12px] sm:text-[13px] text-gray-900 dark:text-white">{error}</p>
    </div>
  </div>
);

const SuccessMessage = ({ message }) => (
  <div className="mb-6 p-4 bg-white dark:bg-gray-850 border border-green-200 dark:border-green-900/30 rounded-lg shadow-md">
    <div className="flex items-center">
      <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
      <p className="text-[12px] sm:text-[13px] text-gray-900 dark:text-white">{message}</p>
    </div>
  </div>
);

const NoResults = ({ statusFilter }) => (
  <div className="bg-white dark:bg-gray-850 rounded-lg shadow-md p-8 text-center border border-gray-200 dark:border-gray-800">
    <img
      src={noSubmissionFound}
      alt="No submissions found"
      className="w-24 sm:w-32 mx-auto mb-4 opacity-80"
    />
    <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">
      No Submissions Found
    </h3>
    <p className="mt-2 text-[12px] sm:text-[13px] text-gray-500 dark:text-gray-400">
      {statusFilter !== "all"
        ? `No submissions with status "${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).replace("_", " ")}"`
        : "No submissions available at the moment."}
    </p>
  </div>
);

function FormSubmissionDash() {
  const navigate = useNavigate();
  const { fetchNotificationCounter } = useContext(CartContext) || {};
  const [apiData, setApiData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [statuses, setStatuses] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("table");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        console.log("Token payload:", payload);
      } catch (error) {
        console.error("Token decoding error:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!token) {
      toast.error("Please log in to view submissions.", {
        icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
      });
      navigate("/login");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (!["admin", "member"].includes(payload.role)) {
        toast.error("Invalid user role.", {
          icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
        });
        localStorage.removeItem("token");
        navigate("/login");
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      toast.error("Invalid token. Please log in again.", {
        icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
      });
      localStorage.removeItem("token");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchFilterData = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const [statusResponse, qrCodeResponse] = await Promise.all([
          axios.get(`${API_URL}/status`, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            timeout: 15000,
          }),
          axios.get(`${API_URL}/qrcodes/data`, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            timeout: 15000,
          }),
        ]);
        setStatuses(statusResponse.data.results || []);
        setDesignations(qrCodeResponse.data.designations || []);
        setDepartments(qrCodeResponse.data.departments || []);
        if (!statusResponse.data.results.length) {
          setError("No statuses available for selection.");
          toast.error("No statuses available.", {
            icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
          });
        }
        if (!qrCodeResponse.data.designations.length || !qrCodeResponse.data.departments.length) {
          setError("No designations or departments available for selection.");
          toast.error("No designations or departments available.", {
            icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
          });
        }
      } catch (error) {
        console.error("Fetch filter data error:", error.response || error);
        const errorMsg =
          error.response?.status === 401
            ? "Session expired. Please log in again."
            : error.response?.data?.message ||
              "Failed to load statuses, designations, or departments.";
        setError(errorMsg);
        toast.error(errorMsg, {
          icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
        });
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchFilterData();
  }, [navigate, token]);

  const getAllSubmissions = useCallback(async () => {
    if (!token) {
      setError("Please log in to view submissions.");
      toast.error("Please log in to view submissions.", {
        icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
      });
      navigate("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/formDetails`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        timeout: 15000,
      });
      const submissions = response.data.data || [];
      const sortedSubmissions = submissions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setApiData(sortedSubmissions);
      setFilteredData(sortedSubmissions);
      if (fetchNotificationCounter) fetchNotificationCounter().catch(() => {});
    } catch (error) {
      console.error("Fetch submissions error:", error.response || error);
      const errorMsg =
        error.response?.status === 401
          ? "Session expired. Please log in again."
          : error.response?.status === 403
          ? "No associated admin found for this member."
          : error.response?.data?.message ||
            (error.code === "ECONNABORTED"
              ? "Request timed out. Please check your network."
              : error.message === "Network Error"
              ? "Unable to connect to the server."
              : "Error fetching submissions.");
      setError(errorMsg);
      toast.error(errorMsg, {
        icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
      });
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, token, fetchNotificationCounter]);

  const viewResume = async (id) => {
    if (!token) {
      toast.error("Please log in to view resumes.", {
        icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
      });
      navigate("/login");
      return;
    }
    setActionLoading(id);
    try {
      const response = await axios.get(`${API_URL}/form/resume/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      const { signedUrl, fileName } = response.data;
      if (!signedUrl) throw new Error("No resume URL provided");
      const link = document.createElement("a");
      link.href = signedUrl;
      link.target = fileName.toLowerCase().endsWith(".pdf") ? "_blank" : "";
      link.rel = "noopener noreferrer";
      if (!fileName.toLowerCase().endsWith(".pdf")) link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Resume opened successfully", {
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
      });
    } catch (error) {
      console.error("View resume error:", error.response || error);
      const errorMsg =
        error.response?.status === 403
          ? "No associated admin found for this member."
          : error.response?.data?.message ||
            (error.code === "ECONNABORTED" ? "Request timed out" : "Failed to fetch resume");
      toast.error(errorMsg, {
        icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const updateStatus = async (id, newStatus) => {
    if (!token) {
      setError("Please log in to update submission status.");
      toast.error("Please log in to update submission status.", {
        icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
      });
      navigate("/login");
      return;
    }
    const previousData = [...apiData];
    setApiData((prevData) =>
      prevData.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    setFilteredData((prevData) =>
      prevData.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    setActionLoading(id);
    setError(null);
    try {
      await axios.patch(
        `${API_URL}/formDetails/${id}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          timeout: 10000,
        }
      );
      setSuccessMessage("Submission updated successfully");
      if (fetchNotificationCounter) fetchNotificationCounter().catch(() => {});
    } catch (error) {
      console.error("Update status error:", error.response || error);
      setApiData(previousData);
      setFilteredData(previousData);
      const errorMsg =
        error.response?.status === 401
          ? "Session expired. Please log in again."
          : error.response?.status === 404
          ? "Submission not found or not authorized."
          : error.response?.status === 403
          ? "Not authorized to update this submission."
          : error.response?.data?.message ||
            (error.code === "ECONNABORTED"
              ? "Request timed out."
              : error.message === "Network Error"
              ? "Unable to connect to the server."
              : "Error updating status.");
      setError(errorMsg);
      toast.error(errorMsg, { icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" /> });
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const updateReview = async (id, reviewed) => {
    if (!token) {
      setError("Please log in to update review status.");
      toast.error("Please log in to update review status.", {
        icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
      });
      navigate("/login");
      return;
    }
    const reviewedValue = reviewed ? 1 : 0;
    const previousData = [...apiData];
    setApiData((prevData) =>
      prevData.map((item) => (item.id === id ? { ...item, reviewed: reviewedValue } : item))
    );
    setFilteredData((prevData) =>
      prevData.map((item) => (item.id === id ? { ...item, reviewed: reviewedValue } : item))
    );
    setActionLoading(id);
    setError(null);
    try {
      await axios.patch(
        `${API_URL}/formDetails/${id}/review`,
        { reviewed: reviewedValue },
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          timeout: 10000,
        }
      );
      setSuccessMessage("Submission updated successfully");
      toast.success("Submission updated successfully", {
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
      });
      if (fetchNotificationCounter) fetchNotificationCounter().catch(() => {});
    } catch (error) {
      console.error("Update review error:", error.response || error);
      setApiData(previousData);
      setFilteredData(previousData);
      const errorMsg =
        error.response?.status === 401
          ? "Session expired. Please log in again."
          : error.response?.status === 404
          ? "Submission not found or not authorized."
          : error.response?.status === 403
          ? "Not authorized to update this submission."
          : error.response?.data?.message ||
            (error.code === "ECONNABORTED"
              ? "Request timed out."
              : error.message === "Network Error"
              ? "Unable to connect to the server."
              : "Error updating review status.");
      setError(errorMsg);
      toast.error(errorMsg, { icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" /> });
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const updateDesignationAndDepartment = async (id, designation, department_name) => {
    if (!token) {
      setError("Please log in to update submission details.");
      toast.error("Please log in to update submission details.", {
        icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
      });
      navigate("/login");
      return;
    }
    const previousData = [...apiData];
    setApiData((prevData) =>
      prevData.map((item) => (item.id === id ? { ...item, designation, department_name } : item))
    );
    setFilteredData((prevData) =>
      prevData.map((item) => (item.id === id ? { ...item, designation, department_name } : item))
    );
    setActionLoading(id);
    setError(null);
    try {
      await axios.patch(
        `${API_URL}/formDetails/${id}/update`,
        { designation, department_name },
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          timeout: 10000,
        }
      );
      setSuccessMessage("Submission updated successfully");
      toast.success("Submission updated successfully", {
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
      });
      if (fetchNotificationCounter) fetchNotificationCounter().catch(() => {});
    } catch (error) {
      console.error("Update designation/department error:", error.response || error);
      setApiData(previousData);
      setFilteredData(previousData);
      const errorMsg =
        error.response?.status === 401
          ? "Session expired. Please log in again."
          : error.response?.status === 404
          ? "Submission not found or not authorized."
          : error.response?.status === 403
          ? "Not authorized to update this submission."
          : error.response?.data?.message ||
            (error.code === "ECONNABORTED"
              ? "Request timed out."
              : error.message === "Network Error"
              ? "Unable to connect to the server."
              : "Error updating designation/department.");
      setError(errorMsg);
      toast.error(errorMsg, { icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" /> });
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleFilterChange = (e) => {
    const filter = e.target.value;
    setStatusFilter(filter);
    applyFilters(filter, searchQuery);
  };

  const debouncedSearch = useCallback(
    debounce((query, status) => applyFilters(status, query), 300),
    [apiData]
  );

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query, statusFilter);
  };

  const applyFilters = useCallback(
    (statusFilter, searchQuery) => {
      let filtered = [...apiData];
      if (statusFilter !== "all") {
        filtered = filtered.filter((item) => item.status === statusFilter);
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (item) =>
            (item.name || "").toLowerCase().includes(query) ||
            (item.email || "").toLowerCase().includes(query) ||
            (item.application_type_name || "").toLowerCase().includes(query)
        );
      }
      setFilteredData(filtered);
    },
    [apiData]
  );

  const handleStatusChange = (id, e) => {
    const newStatus = e.target.value;
    if (newStatus && statuses.some((status) => status.name === newStatus)) {
      updateStatus(id, newStatus);
    } else {
      setError("Invalid status selected.");
      toast.error("Invalid status selected.", {
        icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
      });
    }
  };

  const handleReviewChange = (id, e) => {
    updateReview(id, e.target.checked);
  };

  const handleDesignationChange = (id, e) => {
    const newDesignation = e.target.value || null;
    updateDesignationAndDepartment(id, newDesignation, apiData.find((item) => item.id === id).department_name);
  };

  const handleDepartmentChange = (id, e) => {
    const newDepartment = e.target.value || null;
    updateDesignationAndDepartment(id, apiData.find((item) => item.id === id).designation, newDepartment);
  };

  const toggleExpandCard = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      toast.error("No submissions to export.", {
        icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
      });
      return;
    }
    exportToCSV(filteredData);
    toast.success("Submissions exported to CSV.", {
      icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
    });
  };

  useEffect(() => {
    getAllSubmissions();
  }, [getAllSubmissions]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        getAllSubmissions();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, getAllSubmissions]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8 sm:px-6 lg:px-8 font-sans text-[12px] sm:text-[13px] antialiased">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontSize: "13px",
            borderRadius: "8px",
            padding: "12px 16px",
            background: "#fff",
            color: "#374151",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          },
          success: {
            iconTheme: { primary: "#10B981", secondary: "#fff" },
            style: { background: "#ECFDF5", color: "#065F46" },
          },
          error: {
            iconTheme: { primary: "#EF4444", secondary: "#fff" },
            style: { background: "#FEF2F2", color: "#991B1B" },
          },
        }}
      />
      <div className="max-w-full mx-auto">
        <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10 pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-[20px] font-bold text-gray-900 dark:text-white tracking-tight">
                Candidate Submissions Dashboard
              </h1>
              <p className="text-[12px] sm:text-[13px] text-gray-500 dark:text-gray-400 mt-2">
                Efficiently manage and review candidate submissions
              </p>
            </div>
            <SearchAndFilter
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              statuses={statuses}
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              onExportCSV={handleExportCSV}
              viewMode={viewMode}
              onViewModeChange={() => setViewMode(viewMode === "table" ? "card" : "table")}
            />
          </div>
        </div>
        {successMessage && <SuccessMessage message={successMessage} />}
        {error && <ErrorMessage error={error} />}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ApiLoader />
            <p className="mt-4 text-[12px] sm:text-[13px] text-gray-500 dark:text-gray-400">
              Loading submissions...
            </p>
          </div>
        ) : filteredData.length === 0 ? (
          <NoResults statusFilter={statusFilter} />
        ) : viewMode === "table" ? (
          <SubmissionTable
            submissions={filteredData}
            actionLoading={actionLoading}
            statuses={statuses}
            designations={designations}
            departments={departments}
            onStatusChange={handleStatusChange}
            onReviewChange={handleReviewChange}
            onViewResume={viewResume}
            onDesignationChange={handleDesignationChange}
            onDepartmentChange={handleDepartmentChange}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredData.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                expandedCard={expandedCard}
                actionLoading={actionLoading}
                statuses={statuses}
                designations={designations}
                departments={departments}
                onToggleExpand={toggleExpandCard}
                onStatusChange={handleStatusChange}
                onReviewChange={handleReviewChange}
                onViewResume={viewResume}
                onDesignationChange={handleDesignationChange}
                onDepartmentChange={handleDepartmentChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FormSubmissionDash;