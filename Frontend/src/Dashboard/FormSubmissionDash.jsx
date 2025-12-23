import React, { useEffect, useState, useContext, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../Contex/NotificationConterContex";
import toast, { Toaster } from "react-hot-toast";
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
import noSubmissionFound from "../assets/noSubmissionFound.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const LIMIT = 10;

const statusIcons = {
  pending: <ClockIcon className="h-4 w-4 text-yellow-500" />,
  reviewed: <DocumentTextIcon className="h-4 w-4 text-blue-500" />,
  shortlisted: <HandThumbUpIcon className="h-4 w-4 text-purple-500" />,
  rejected: <XCircleIcon className="h-4 w-4 text-red-500" />,
  approved: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
  on_hold: <PauseCircleIcon className="h-4 w-4 text-gray-500" />,
};

const statusColors = {
  pending:
    "bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800/30",
  reviewed:
    "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30",
  shortlisted:
    "bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/30",
  rejected:
    "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30",
  approved:
    "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/30",
  on_hold:
    "bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-700/20 dark:text-gray-300 dark:border-gray-600/30",
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
    "Phone Number",
    "Status",
    "Designation",
    "Department",
    "Application Type",
    "Reviewed",
    "Reason",
    "Comments",
    "Created At",
  ];
  const rows = data.map((item) => [
    item.id,
    item.name || "N/A",
    item.email || "N/A",
    item.number || "N/A",
    item.status
      ? item.status.charAt(0).toUpperCase() +
        item.status.slice(1).replace("_", " ")
      : "N/A",
    item.designation || "N/A",
    item.department_name || "N/A",
    item.application_type_name || item.application_type || "N/A",
    item.reviewed === 1 ? "Yes" : "No",
    item.reason || "N/A",
    item.comments || "N/A",
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
  link.setAttribute(
    "download",
    `submissions_${new Date().toISOString().split("T")[0]}.csv`
  );
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
        statusColors[status] ||
        "bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-700/20 dark:text-gray-300 dark:border-gray-600/30"
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
        className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
        aria-label="Submission menu"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1.5 z-20 border border-slate-200 dark:border-slate-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewResume();
              setIsOpen(false);
            }}
            className="flex items-center px-3 py-2 text-[12px] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 w-full text-left transition-all duration-200"
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

const ReasonDialog = ({ isOpen, onClose, reason }) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/10 bg-opacity-50 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-[12px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
          View Reason
        </h3>
        <p className="text-[12px] text-gray-900 dark:text-gray-100 mb-4">
          {reason || "N/A"}
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-md text-[12px] hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const CommentDialog = ({
  isOpen,
  onClose,
  submissionId,
  initialComment,
  onSubmit,
}) => {
  const [isEditMode, setIsEditMode] = useState(!initialComment);
  const [comment, setComment] = useState(initialComment || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Comment cannot be empty", {
        style: {
          fontSize: "12px",
          padding: "12px",
          borderRadius: "8px",
          background: "#ffffff",
          color: "#1e293b",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        },
        icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
      });
      return;
    }
    try {
      await onSubmit(submissionId, comment);
      setIsEditMode(false);
      onClose(); // Close dialog after submission
    } catch (error) {
      toast.error("Failed to save comment", {
        style: {fontSize: "12px", 
          padding: "12px", 
          borderRadius: "8px",
          background: "#ffffff", 
          color: "#1e293b",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        },
        icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
      });
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/10 bg-opacity-50 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-[12px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {initialComment ? "View Comment" : "Add Comment"}
        </h3>
        {isEditMode ? (
          <form onSubmit={handleSubmit}>
            <textarea
              className="w-full h-24 p-2 border border-gray-300 dark:border-gray-600 rounded-md text-[12px] text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter your comment..."
              maxLength={1000}
              aria-label="Comment input"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  if (initialComment) setIsEditMode(false);
                  else onClose();
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-md text-[12px] hover:bg-gray-300 dark:hover:bg-gray-500"
                aria-label="Cancel comment"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-500 text-white rounded-md text-[12px] hover: bg-indigo-700"
                aria-label={
                  initialComment ? "Update comment" : "Submit comment"
                }
              >
                {initialComment ? "Update" : "Submit"}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p className="text-[12px] text-gray-900 dark:text-gray-100 mb-4">
              {initialComment}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="px-4 py-2 bg-indigo-500 text-white rounded-md text-[12px] hover:bg-indigo-700"
                aria-label="Update comment"
              >
                Update Comment
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-md text-[12px] hover:bg-gray-300 dark:hover:bg-gray-500"
                aria-label="Close comment dialog"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
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
  colors,
  onToggleExpand,
  onStatusChange,
  onReviewChange,
  onViewResume,
  onDesignationChange,
  onDepartmentChange,
  onCommentChange,
  onColorChange,
}) => {
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);

  const handleCommentSubmit = async (submissionId, newComment) => {
    try {
      await onCommentChange(submissionId, newComment);
      toast.success("Comment saved successfully", {
        style: {
          fontSize: "12px",
          padding: "12px",
          borderRadius: "8px",
          background: "#ffffff",
          color: "#1e293b",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        },
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
      });
    } catch (error) {
      console.error("Error saving comment:", error);
      throw error;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-[12px] font-semibold text-slate-900 dark:text-slate-100 truncate">
              {submission.name || "Unknown"}
            </h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              {submission.email || "N/A"}
            </p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              {submission.number || "N/A"}
            </p>
          </div>
          <div className="ml-2 flex-shrink-0">
            <StatusBadge status={submission.status} />
          </div>
        </div>
        <div className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">
          <span>{formatDate(submission.created_at)}</span>
        </div>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            expandedCard === submission.id
              ? "max-h-96 opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px] mb-4">
            <div className="sm:col-span-2">
              {/* ===== HIRING STATUS (COLOR) - Card View mein ===== */}
              <div className="mt-4">
                <p className="text-slate-500 dark:text-slate-400 font-medium text-[12px] mb-2">
                  Hiring Status
                </p>
                <div className="flex items-center gap-3">
                  {/* Dropdown */}
                  <select
                    value={submission.color_id || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      const colorId = value === "" ? null : value;
                      onColorChange(submission.id, colorId); // Ye kar do (?. nahi lagana)
                    }}
                    className="w-full max-w-[130px] pl-3 pr-7 py-2 text-[12px] border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-50 appearance-none cursor-pointer"
                    disabled={actionLoading === submission.id}
                  >
                    <option value="">No Color</option>
                    {colors.map((color) => (
                      <option key={color.id} value={color.id}>
                        {color.color_name.charAt(0).toUpperCase() +
                          color.color_name.slice(1)}
                      </option>
                    ))}
                  </select>

                  {/* Badge */}
                  {submission.color_name && (
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                        submission.color_name === "Hired"
                          ? "bg-green-100 text-green-800 border border-green-300"
                          : submission.color_name === "blacklist"
                          ? "bg-red-100 text-red-800 border border-red-300"
                          : "bg-yellow-100 text-yellow-800 border border-yellow-300"
                      }`}
                    >
                      {submission.color_name.charAt(0).toUpperCase() +
                        submission.color_name.slice(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* another sections  */}
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Type
              </p>
              <p className="text-slate-900 dark:text-slate-100 truncate">
                {submission.application_type_name ||
                  submission.application_type ||
                  "N/A"}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Reviewed
              </p>
              <p className="text-slate-900 dark:text-slate-100">
                {submission.reviewed === 1 ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Reason
              </p>
              <button
                onClick={() => setIsReasonDialogOpen(true)}
                className="text-[12px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                aria-label="View reason"
              >
                View Reason
              </button>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Comments
              </p>
              {submission.comments ? (
                <button
                  onClick={() => setIsCommentDialogOpen(true)}
                  className="text-[12px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                  aria-label="View comment"
                >
                  View Comment
                </button>
              ) : (
                <button
                  onClick={() => setIsCommentDialogOpen(true)}
                  className="text-[12px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                  aria-label="Add comment"
                >
                  Add Comment
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-700/50 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={() => onToggleExpand(submission.id)}
            className="text-[12px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center transition-all duration-200"
            aria-label={
              expandedCard === submission.id
                ? "Show less details"
                : "Show more details"
            }
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
              <SubmissionMenu
                submission={submission}
                onViewResume={() => onViewResume(submission.id)}
              />
            )}
          </div>
        </div>
        <div className="space-y-3">
          <div className="relative">
            <select
              value={submission.status || ""}
              onChange={(e) => onStatusChange(submission.id, e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-[12px] border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-50 transition-all duration-200 appearance-none"
              disabled={actionLoading === submission.id}
              aria-label="Change submission status"
            >
              <option value="">Select Status</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.name}>
                  {status.name.charAt(0).toUpperCase() +
                    status.name.slice(1).replace("_", " ")}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Designation Updating */}
          <div className="relative">
            <select
              value={submission.designation || ""}
              onChange={(e) =>
                onDesignationChange(submission.id, e.target.value)
              }
              className="w-full pl-3 pr-8 py-2 text-[12px] border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-50 transition-all duration-200 appearance-none"
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
            <ChevronDownIcon className="absolute right-2 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* department */}
          <div className="relative">
            <select
              value={submission.department_name || ""}
              onChange={(e) =>
                onDepartmentChange(submission.id, e.target.value)
              }
              className="w-full pl-3 pr-8 py-2 text-[12px] border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-50 transition-all duration-200 appearance-none"
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
            <ChevronDownIcon className="absolute right-2 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
          <label className="flex items-center space-x-2 cursor-pointer pt-1">
            <div className="relative">
              <input
                type="checkbox"
                checked={submission.reviewed === 1}
                onChange={(e) =>
                  onReviewChange(submission.id, e.target.checked)
                }
                className="h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 rounded transition-all duration-200"
                disabled={actionLoading === submission.id}
                aria-label="Mark submission as reviewed"
              />
            </div>
            <span className="text-[12px] text-slate-700 dark:text-slate-300">
              Mark as reviewed
            </span>
          </label>
        </div>
      </div>
      <ReasonDialog
        isOpen={isReasonDialogOpen}
        onClose={() => setIsReasonDialogOpen(false)}
        reason={submission.reason}
      />
      <CommentDialog
        isOpen={isCommentDialogOpen}
        onClose={() => setIsCommentDialogOpen(false)}
        submissionId={submission.id}
        initialComment={submission.comments}
        onSubmit={handleCommentSubmit}
      />
    </div>
  );
};

const SubmissionTable = ({
  submissions,
  actionLoading,
  statuses,
  colors,
  designations,
  departments,
  onStatusChange,
  onReviewChange,
  onViewResume,
  onDesignationChange,
  onDepartmentChange,
  onCommentChange,
  onColorChange,
}) => {
  const [reasonDialogOpen, setReasonDialogOpen] = useState({});
  const [commentDialogOpen, setCommentDialogOpen] = useState({});

  const handleCommentSubmit = async (submissionId, newComment) => {
    try {
      await onCommentChange(submissionId, newComment);
      toast.success("Comment saved successfully", {
        style: {
          fontSize: "12px",
          padding: "12px",
          borderRadius: "8px",
          background: "#ffffff",
          color: "#1e293b",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        },
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
      });
    } catch (error) {
      console.error("Error saving comment:", error);
      throw error;
    }
  };

  return (
    <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-sky-50 dark:bg-sky-700/50 sticky top-0 z-10">
          <tr>
            {[
              "Name",
              "Email",
              "Phone Number",
              "Status",
              "Hiring Status",
              "Designation",
              "Department",
              "Type",
              "Reason",
              "Comments",
              "Reviewed",
              "Created At",
              "Actions",
            ].map((header) => (
              <th
                key={header}
                className="px-2 sm:px-4 py-3 text-left text-[12px] font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {submissions.map((submission, index) => (
            <tr
              key={submission.id}
              className={`${
                index % 2 === 0
                  ? "bg-white dark:bg-slate-800"
                  : "bg-slate-50 dark:bg-slate-700/50"
              } hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200`}
            >
              <td className="px-2 sm:px-4 py-3 text-[12px] text-slate-900 dark:text-slate-100 max-w-xs truncate">
                {submission.name || "N/A"}
              </td>
              <td className="px-2 sm:px-4 py-3 text-[12px] text-slate-900 dark:text-slate-100 max-w-xs truncate">
                {submission.email || "N/A"}
              </td>
              <td className="px-2 sm:px-4 py-3 text-[12px] text-slate-900 dark:text-slate-100 max-w-xs truncate">
                {submission.number || "N/A"}
              </td>
              <td className="px-2 sm:px-4 py-3">
                <div className="relative">
                  <select
                    value={submission.status || ""}
                    onChange={(e) =>
                      onStatusChange(submission.id, e.target.value)
                    }
                    className="w-full pl-2 pr-7 py-1.5 text-[12px] border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-50 transition-all duration-200 appearance-none"
                    disabled={actionLoading === submission.id}
                    aria-label="Change submission status"
                  >
                    <option value="">Select Status</option>
                    {statuses.map((status) => (
                      <option key={status.id} value={status.name}>
                        {status.name.charAt(0).toUpperCase() +
                          status.name.slice(1).replace("_", " ")}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-2 top-2 h-3 w-3 text-slate-400 pointer-events-none" />
                </div>
              </td>
              {/* ← NEW: Hiring Status (Color) Column */}
              <td className="px-2 sm:px-4 py-3">
                <div className="flex items-center gap-3">
                  {/* Clean Dropdown */}
                  <select
                    value={submission.color_id || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      const colorId = value === "" ? null : value;
                      onColorChange(submission.id, colorId);
                    }}
                    className="w-full max-w-[110px] pl-3 pr-7 py-1.5 text-[12px] border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-50 appearance-none cursor-pointer"
                    disabled={actionLoading === submission.id}
                  >
                    <option value="">No Color</option>
                    {colors.map((color) => (
                      <option key={color.id} value={color.id}>
                        {color.color_name.charAt(0).toUpperCase() +
                          color.color_name.slice(1)}
                      </option>
                    ))}
                  </select>

                  {/* Clean Badge - Sirf jab color ho tab dikhe */}
                  {submission.color_name && (
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                        submission.color_name === "Hired"
                          ? "bg-green-100 text-green-800 border border-green-300"
                          : submission.color_name === "blacklist"
                          ? "bg-red-100 text-red-800 border border-red-300"
                          : "bg-yellow-100 text-yellow-800 border border-yellow-300"
                      }`}
                    >
                      {submission.color_name.charAt(0).toUpperCase() +
                        submission.color_name.slice(1)}
                    </span>
                  )}
                </div>
              </td>
              {/* === DESIGNATION COLUMN - YE ADD KARO === */}
              <td className="px-2 sm:px-4 py-3">
                <div className="relative">
                  <select
                    value={submission.designation || ""}
                    onChange={(e) =>
                      onDesignationChange(submission.id, e.target.value)
                    }
                    className="w-full pl-2 pr-7 py-1.5 text-[12px] border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-50 transition-all duration-200 appearance-none"
                    disabled={actionLoading === submission.id}
                  >
                    <option value="">Select Designation</option>
                    {designations.map((des) => (
                      <option key={des.id} value={des.name}>
                        {des.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-2 top-2 h-3 w-3 text-slate-400 pointer-events-none" />
                </div>
              </td>
              {/* === DESIGNATION COLUMN KHATAM === */}
              <td className="px-2 sm:px-4 py-3">
                <div className="relative">
                  <select
                    value={submission.department_name || ""}
                    onChange={(e) =>
                      onDepartmentChange(submission.id, e.target.value)
                    }
                    className="w-full pl-2 pr-7 py-1.5 text-[12px] border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-50 transition-all duration-200 appearance-none"
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
                  <ChevronDownIcon className="absolute right-2 top-2 h-3 w-3 text-slate-400 pointer-events-none" />
                </div>
              </td>
              <td className="px-2 sm:px-4 py-3 text-[12px] text-slate-900 dark:text-slate-100">
                {submission.application_type_name ||
                  submission.application_type ||
                  "N/A"}
              </td>
              <td className="px-2 sm:px-4 py-3 text-[12px] text-slate-900 dark:text-slate-100 max-w-xs truncate">
                <button
                  onClick={() =>
                    setReasonDialogOpen((prev) => ({
                      ...prev,
                      [submission.id]: true,
                    }))
                  }
                  className="text-[12px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                  aria-label="View reason"
                >
                  View Reason
                </button>
              </td>
              <td className="px-2 sm:px-4 py-3 text-[12px] text-slate-900 dark:text-slate-100">
                {submission.comments ? (
                  <button
                    onClick={() =>
                      setCommentDialogOpen((prev) => ({
                        ...prev,
                        [submission.id]: true,
                      }))
                    }
                    className="text-[12px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                    aria-label="View comment"
                  >
                    View Comment
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setCommentDialogOpen((prev) => ({
                        ...prev,
                        [submission.id]: true,
                      }))
                    }
                    className="text-[12px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                    aria-label="Add comment"
                  >
                    Add Comment
                  </button>
                )}
              </td>
              <td className="px-2 sm:px-4 py-3">
                <label className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={submission.reviewed === 1}
                    onChange={(e) =>
                      onReviewChange(submission.id, e.target.checked)
                    }
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 rounded transition-all duration-200"
                    disabled={actionLoading === submission.id}
                    aria-label="Mark submission as reviewed"
                  />
                </label>
              </td>
              <td className="px-2 sm:px-4 py-3 text-[12px] text-slate-500 dark:text-slate-400 whitespace-nowrap hidden sm:table-cell">
                {formatDate(submission.created_at)}
              </td>
              <td className="px-2 sm:px-4 py-3">
                {submission.resume && (
                  <button
                    onClick={() => onViewResume(submission.id)}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center text-[12px] transition-all duration-200"
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
      {submissions.map((submission) => (
        <React.Fragment key={submission.id}>
          <ReasonDialog
            isOpen={reasonDialogOpen[submission.id] || false}
            onClose={() =>
              setReasonDialogOpen((prev) => ({
                ...prev,
                [submission.id]: false,
              }))
            }
            reason={submission.reason}
          />
          <CommentDialog
            isOpen={commentDialogOpen[submission.id] || false}
            onClose={() =>
              setCommentDialogOpen((prev) => ({
                ...prev,
                [submission.id]: false,
              }))
            }
            submissionId={submission.id}
            initialComment={submission.comments}
            onSubmit={handleCommentSubmit}
          />
        </React.Fragment>
      ))}
    </div>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center space-x-4 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 text-[12px] border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        Previous
      </button>
      <span className="text-[12px] text-slate-700 dark:text-slate-300">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-[12px] border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        Next
      </button>
    </div>
  );
};

const SearchAndFilter = ({
  searchInput,
  statusFilter,
  statuses,
  onSearchChange,
  onFilterChange,
  onExportCSV,
  viewMode,
  onViewModeChange,
}) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search by name, email, type..."
            value={searchInput}
            onChange={onSearchChange}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-[12px] text-slate-900 dark:text-slate-100 transition-all duration-200"
            aria-label="Search submissions"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 dark:text-slate-500" />
        </div>
        <div className="flex gap-2">
          <div className="relative hidden sm:block">
            <select
              value={statusFilter}
              onChange={onFilterChange}
              className="appearance-none w-full sm:w-44 pl-3 pr-8 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-[12px] text-slate-900 dark:text-slate-100 transition-all duration-200"
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.name}>
                  {status.name.charAt(0).toUpperCase() +
                    status.name.slice(1).replace("_", " ")}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-2.5 h-5 w-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>
          <button
            onClick={ ()=> setIsFiltersOpen(!isFiltersOpen)}
            className="sm:hidden flex items-center justify-center px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all duration-200"
            aria-label="Toggle filters"
          >
            <FunnelIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onViewModeChange}
            className="flex items-center justify-center px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all duration-200"
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
            className="flex items-center justify-center px-4 py-2.5 text-[12px] font-medium text-white bg-indigo-600  rounded-lg hover:bg-indigo-700 focus:ring-indigo-500 transition-all duration-200 shadow-sm hover:shadow"
            aria-label="Export submissions to CSV"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
            Export
          </button>
        </div>
      </div>
      {isFiltersOpen && (
        <div className="sm:hidden bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={onFilterChange}
              className="w-full pl-3 pr-8 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-[12px] text-slate-900 dark:text-slate-100"
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.name}>
                  {status.name.charAt(0).toUpperCase() +
                    status.name.slice(1).replace("_", " ")}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-2.5 h-5 w-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
};

const ErrorMessage = ({ error }) => (
  <div className="mb-6 p-4 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/30 rounded-lg shadow-md">
    <div className="flex items-center">
      <ExclamationCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
      <p className="text-[12px] text-slate-900 dark:text-slate-100">{error}</p>
    </div>
  </div>
);

const SuccessMessage = ({ message }) => (
  <div className="mb-6 p-4 bg-white dark:bg-slate-800 border border-green-200 dark:border-green-900/30 rounded-lg shadow-md">
    <div className="flex items-center">
      <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
      <p className="text-[12px] text-slate-900 dark:text-slate-100">
        {message}
      </p>
    </div>
  </div>
);

const NoResults = ({ statusFilter }) => (
  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 text-center border border-slate-200 dark:border-slate-700">
    <img
      src={noSubmissionFound}
      alt="No submissions found"
      className="w-52 sm:w-52 mx-auto mb-4 opacity-80"
    />
    <p className="mt-2 text-[12px] text-slate-500 dark:text-slate-400">
      {statusFilter !== "all"
        ? `No submissions with status "${
            statusFilter.charAt(0).toUpperCase() +
            statusFilter.slice(1).replace("_", " ")
          }"`
        : ""}
    </p>
  </div>
);

function FormSubmissionDash() {
  const navigate = useNavigate();
  const { fetchNotificationCounter } = useContext(CartContext) || {};
  const [filteredData, setFilteredData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [statuses, setStatuses] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("table");
  const [colors, setColors] = useState([]);
  const token = localStorage.getItem("token");
  // Validate token and user role on mount
  useEffect(() => {
    if (!token) {
      toast.error("Please log in to view submissions.", {
        icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
        style: {
          background: "#ffffff",
          color: "#1e293b",
          padding: "12px",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          fontSize: "12px",
        },
      });
      navigate("/login");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (!["admin", "member"].includes(payload.role)) {
        toast.error("Invalid user role.", {
          icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
          },
        });
        localStorage.removeItem("token");
        navigate("/login");
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      toast.error("Invalid token. Please log in again.", {
        icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
        style: {
          background: "#ffffff",
          color: "#1e293b",
          padding: "12px",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          fontSize: "12px",
        },
      });
      localStorage.removeItem("token");
      navigate("/login");
    }
  }, [navigate, token]);

  // Fetch statuses, designations, and departments
  useEffect(() => {
    const fetchFilterData = async () => {
      if (!token) return;
      setError(null);
      try {
        const [statusResponse, qrCodeResponse] = await Promise.all([
          axios.get(`${API_URL}/status`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          }),
          axios.get(`${API_URL}/qrcodes/data`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
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
            style: {
              background: "#ffffff",
              color: "#1e293b",
              padding: "12px",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              fontSize: "12px",
            },
          });
        }
        if (
          !qrCodeResponse.data.designations.length ||
          !qrCodeResponse.data.departments.length
        ) {
          setError("No designations or departments available for selection.");
          toast.error("No designations or departments available.", {
            icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
            style: {
              background: "#ffffff",
              color: "#1e293b",
              padding: "12px",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              fontSize: "12px",
            },
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
          icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500"/>,
          style:{
            background: "#ffffff",
            color: "#1e293b",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
          },
        });
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      }
    };
    fetchFilterData();
  }, [navigate, token]);
  // Debounced search update
  const debouncedSetSearchQuery = useCallback(
    debounce((value) => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSetSearchQuery(searchInput);
  }, [searchInput, debouncedSetSearchQuery]);

  // Fetch submissions with pagination, search, and filter
  const fetchSubmissions = useCallback(
    async (page = 1, search = "", status = "all") => {
      if (!token) {
        setError("Please log in to view submissions.");
        toast.error("Please log in to view submissions.", {
          icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
          },
        });
        navigate("/login");
        return;
      }
      setError(null);
      try {
        let url = `${API_URL}/formDetails?page=${page}&limit=${LIMIT}`;
        if (search.trim()) {
          url += `&search=${encodeURIComponent(search.trim())}`;
        }
        if (status !== "all") {
          url += `&status=${status}`;
        }
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        });
        const submissions = response.data.data || [];
        const total = response.data.total || 0;
        const sortedSubmissions = submissions.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setFilteredData(sortedSubmissions);
        setTotalItems(total);
        if (fetchNotificationCounter)
          fetchNotificationCounter().catch(() => {});
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
        setFilteredData([]);
        setTotalItems(0);
        toast.error(errorMsg, {
          icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
          },
        });
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      }
    },
    [navigate, token, fetchNotificationCounter]
  );

  // Fetch all for export
  const fetchAllForExport = useCallback(
    async (search = "", status = "all") => {
      if (!token) throw new Error("No token");
      let url = `${API_URL}/formDetails?limit=9999`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      if (status !== "all") {
        url += `&status=${status}`;
      }
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      });
      return response.data.data || [];
    },
    [token]
  );

  // View resume
  const viewResume = useCallback(
    async (id) => {
      if (!token) {
        toast.error("Please log in to view resumes.", {
          icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
          },
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
          style: {
            background: "#ffffff",
            color: "#1e293b",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
          },
        });
      } catch (error) {
        console.error("View resume error:", error.response || error);
        const errorMsg =
          error.response?.status === 403
            ? "No associated admin found for this member."
            : error.response?.data?.message ||
              (error.code === "ECONNABORTED"
                ? "Request timed out"
                : "Failed to fetch resume");
        toast.error(errorMsg, {
          icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
          },
        });
      } finally {
        setActionLoading(null);
      }
    },
    [navigate, token]
  );

  // Update submission status
  const updateStatus = useCallback(
    async (id, newStatus) => {
      if (!token) {
        setError("Please log in to update submission status.");
        toast.error("Please log in to update submission status.", {
          icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
          },
        });
        navigate("/login");
        return;
      }
      setActionLoading(id);
      setError(null);
      try {
        await axios.patch(
          `${API_URL}/formDetails/${id}/status`,
          { status: newStatus },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );
        setSuccessMessage("Submission status updated successfully");
        toast.success("Submission status updated successfully", {
          icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
          },
        });
        if (fetchNotificationCounter)
          fetchNotificationCounter().catch(() => {});
        fetchSubmissions(currentPage, searchQuery, statusFilter);
      } catch (error) {
        console.error("Update status error:", error.response || error);
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
        toast.error(errorMsg, {
          icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
          },
        });
        fetchSubmissions(currentPage, searchQuery, statusFilter);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setActionLoading(null);
      }
    },
    [
      navigate,
      token,
      fetchNotificationCounter,
      currentPage,
      searchQuery,
      statusFilter,
      fetchSubmissions,
    ]
  );

  // Update review status
  const updateReview = useCallback(
    async (id, reviewed) => {
      if (!token) {
        setError("Please log in to update review status.");
        toast.error("Please log in to update review status.", {
          icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
          },
        });
        navigate("/login");
        return;
      }
      const reviewedValue = reviewed ? 1 : 0;
      setActionLoading(id);
      setError(null);
      try {
        await axios.patch(
          `${API_URL}/formDetails/${id}/review`,
          { reviewed: reviewedValue },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );
        setSuccessMessage("Submission updated successfully");
        toast.success("Submission updated successfully", {
          icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
          },
        });
        if (fetchNotificationCounter)
          fetchNotificationCounter().catch(() => {});
        fetchSubmissions(currentPage, searchQuery, statusFilter);
      } catch (error) {
        console.error("Update review error:", error.response || error);
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
        toast.error(errorMsg, {
          icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
          },
        });
        fetchSubmissions(currentPage, searchQuery, statusFilter);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setActionLoading(null);
      }
    },
    [
      navigate,
      token,
      fetchNotificationCounter,
      currentPage,
      searchQuery,
      statusFilter,
      fetchSubmissions,
    ]
  );

  // Fetch colors from API
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const res = await axios.get(`${API_URL}/colors/options`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setColors(res.data.color || []);
      } catch (err) {
        console.error("Failed to fetch colors", err);
      }
    };
    if (token) fetchColors();
  }, [token]);

  const handleColorChange = useCallback(
    async (id, colorId) => {
      setActionLoading(id);
      try {
        await axios.patch(
          `${API_URL}/formDetails/${id}/color`,
          { color_id: colorId },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Hiring status updated");

        fetchSubmissions(currentPage, searchQuery, statusFilter);
      } catch (err) {
        console.error(err);
        toast.error("Failed to update hiring status");
      } finally {
        setActionLoading(null);
      }
    },
    [token, currentPage, searchQuery, statusFilter, fetchSubmissions]
  );

  // Update designation and department
  const updateDesignationAndDepartment = useCallback(
    async (id, designation, department_name) => {
      if (!token) {
        setError("Please log in to update submission details.");
        toast.error("Please log in to update submission details.", {
          icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
          },
        });
        navigate("/login");
        return;
      }
      setActionLoading(id);
      setError(null);
      try {
        await axios.patch(
          `${API_URL}/formDetails/${id}/update`,
          { designation, department_name },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );
        setSuccessMessage("Submission updated successfully");
        toast.success("Submission updated successfully", {
          icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
          },
        });
        if (fetchNotificationCounter)
          fetchNotificationCounter().catch(() => {});
        fetchSubmissions(currentPage, searchQuery, statusFilter);
      } catch (error) {
        console.error(
          "Update designation/department error:",
          error.response || error
        );
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
        toast.error(errorMsg, {
          icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
          },
        });
        fetchSubmissions(currentPage, searchQuery, statusFilter);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setActionLoading(null);
      }
    },
    [
      navigate,
      token,
      fetchNotificationCounter,
      currentPage,
      searchQuery,
      statusFilter,
      fetchSubmissions,
    ]
  );

  // Update comment
  const updateComment = useCallback(
    async (id, comment) => {
      if (!token) {
        setError("Please log in to add comments.");
        toast.error("Please log in to add comments.", {
          icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
          },
        });
        navigate("/login");
        return;
      }
      if (!comment.trim()) {
        setError("Comment cannot be empty.");
        toast.error("Comment cannot be empty.", {
          icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
          },
        });
        return;
      }
      setActionLoading(id);
      setError(null);
      try {
        await axios.patch(
          `${API_URL}/formDetails/${id}/comment`,
          { comment },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );
        setSuccessMessage("Comment added successfully");
        toast.success("Comment added successfully", {
          icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
          },
        });
        if (fetchNotificationCounter)
          fetchNotificationCounter().catch(() => {});
        fetchSubmissions(currentPage, searchQuery, statusFilter);
      } catch (error) {
        console.error("Update comment error:", error.response || error);
        const errorMsg =
          error.response?.status === 401
            ? "Session expired. Please log in again."
            : error.response?.status === 404
            ? "Submission not found or not authorized."
            : error.response?.status === 403
            ? "Not authorized to add comments to this submission."
            : error.response?.data?.message ||
              (error.code === "ECONNABORTED"
                ? "Request timed out."
                : error.message === "Network Error"
                ? "Unable to connect to the server."
                : "Error adding comment.");
        setError(errorMsg);
        toast.error(errorMsg, {
          icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
          },
        });
        fetchSubmissions(currentPage, searchQuery, statusFilter);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setActionLoading(null);
      }
    },
    [
      navigate,
      token,
      fetchNotificationCounter,
      currentPage,
      searchQuery,
      statusFilter,
      fetchSubmissions,
    ]
  );

  // Handle search change
  const handleSearchChange = useCallback((e) => {
    setSearchInput(e.target.value);
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((e) => {
    const filter = e.target.value;
    setStatusFilter(filter);
    setCurrentPage(1);
  }, []);

  // Handle page change
  const handlePageChange = useCallback(
    (page) => {
      if (page >= 1 && page <= Math.ceil(totalItems / LIMIT)) {
        setCurrentPage(page);
      }
    },
    [totalItems]
  );

  // Handle status change
  const handleStatusChange = useCallback(
    (id, newStatus) => {
      updateStatus(id, newStatus);
    },
    [updateStatus]
  );

  // Handle review change
  const handleReviewChange = useCallback(
    (id, checked) => {
      updateReview(id, checked);
    },
    [updateReview]
  );

  // Handle designation change
  const handleDesignationChange = useCallback(
    (id, newDesignation) => {
      const currentSubmission = filteredData.find((item) => item.id === id);
      updateDesignationAndDepartment(
        id,
        newDesignation,
        currentSubmission?.department_name
      );
    },
    [updateDesignationAndDepartment, filteredData]
  );

  // Handle department change
  const handleDepartmentChange = useCallback(
    (id, newDepartment) => {
      const currentSubmission = filteredData.find((item) => item.id === id);
      updateDesignationAndDepartment(
        id,
        currentSubmission?.designation,
        newDepartment
      );
    },
    [updateDesignationAndDepartment, filteredData]
  );

  // Handle comment change
  const handleCommentChange = useCallback(
    (id, comment) => {
      updateComment(id, comment);
    },
    [updateComment]
  );

  // Toggle card expansion
  const toggleExpandCard = useCallback((id) => {
    setExpandedCard((prev) => (prev === id ? null : id));
  }, []);

  // Handle export to CSV
  const handleExportCSV = useCallback(async () => {
    try {
      const exportData = await fetchAllForExport(searchQuery, statusFilter);
      if (exportData.length === 0) {
        toast.error("No submissions to export.", {
          icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
          },
        });
        return;
      }
      exportToCSV(exportData);
      toast.success("Submissions exported to CSV.", {
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
        style: {
          background: "#ffffff",
          color: "#1e293b",
          padding: "12px",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          fontSize: "12px",
        },
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export submissions.", {
        icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
        style: {
          background: "#ffffff",
          color: "#1e293b",
          padding: "12px",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          fontSize: "12px",
        },
      });
    }
  }, [searchQuery, statusFilter, fetchAllForExport]);

  // Fetch submissions when dependencies change
  useEffect(() => {
    fetchSubmissions(currentPage, searchQuery, statusFilter);
  }, [currentPage, searchQuery, statusFilter, fetchSubmissions]);

  // Clear success message after delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const totalPages = Math.ceil(totalItems / LIMIT);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 py-8 sm:px-6 lg:px-8 font-sans text-[12px] antialiased">
      {/* Toaster Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontSize: "12px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#ffffff",
            color: "#1e293b",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          },
          success: {
            iconTheme: { primary: "#4f46e5", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "#EF4444", secondary: "#fff" },
          },
        }}
      />

      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-[12px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Candidate Submissions Dashboard
              </h1>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-2">
                Efficiently manage and review candidate submissions
              </p>
            </div>

            {/* Search & Filter Component */}
            <SearchAndFilter
              searchInput={searchInput}
              statusFilter={statusFilter}
              statuses={statuses}
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              onExportCSV={handleExportCSV}
              viewMode={viewMode}
              onViewModeChange={() =>
                setViewMode(viewMode === "table" ? "card" : "table")
              }
            />
          </div>
        </div>

        {/* Notifications */}
        {successMessage && <SuccessMessage message={successMessage} />}
        {error && <ErrorMessage error={error} />}

        {/* Conditional Rendering */}
        {filteredData.length === 0 ? (
          <NoResults statusFilter={statusFilter} />
        ) : viewMode === "table" ? (
          <SubmissionTable
            submissions={filteredData}
            actionLoading={actionLoading}
            statuses={statuses}
            colors={colors}
            designations={designations}
            departments={departments}
            onStatusChange={handleStatusChange}
            onReviewChange={handleReviewChange}
            onViewResume={viewResume}
            onDesignationChange={handleDesignationChange}
            onDepartmentChange={handleDepartmentChange}
            onCommentChange={handleCommentChange}
            onColorChange={handleColorChange}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                expandedCard={expandedCard}
                actionLoading={actionLoading}
                statuses={statuses}
                designations={designations}
                departments={departments}
                colors={colors} // ← Ye add karo
                onToggleExpand={toggleExpandCard}
                onStatusChange={handleStatusChange}
                onReviewChange={handleReviewChange}
                onViewResume={viewResume}
                onDesignationChange={handleDesignationChange}
                onDepartmentChange={handleDepartmentChange}
                onCommentChange={handleCommentChange}
                onColorChange={handleColorChange}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
export default FormSubmissionDash;
