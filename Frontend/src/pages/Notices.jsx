import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminLayout from "../layouts/AdminLayout";
import {
  FiAlertCircle,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiFilter,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiRefreshCw,
  FiSearch,
  FiArchive,
  FiLock,
} from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

const NoticeBadge = ({ importance }) => {
  const colors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-amber-100 text-amber-800",
    critical: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${colors[importance] || colors.medium}`}
    >
      {importance.charAt(0).toUpperCase() + importance.slice(1)}
    </span>
  );
};

const CategoryChip = ({ category }) => {
  const colors = {
    announcement: "bg-indigo-100 text-indigo-800",
    service_change: "bg-orange-100 text-orange-800",
    maintenance: "bg-teal-100 text-teal-800",
    emergency: "bg-red-100 text-red-800",
    other: "bg-gray-100 text-gray-800",
  };

  const labels = {
    announcement: "Announcement",
    service_change: "Service Change",
    maintenance: "Maintenance",
    emergency: "Emergency",
    other: "Other",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${colors[category] || colors.other}`}
    >
      {labels[category] || category}
    </span>
  );
};

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    importance: "",
    status: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [selectedNotices, setSelectedNotices] = useState([]);

  const navigate = useNavigate();
  const API_URI = import.meta.env.VITE_API_URL;
  const { user } = useAuthStore();

  useEffect(() => {
    fetchNotices();
  }, [pagination.page, pagination.limit, filters]);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const { page, limit } = pagination;
      const { category, importance, status, search } = filters;

      let query = `page=${page}&limit=${limit}`;
      if (category) query += `&category=${category}`;
      if (importance) query += `&importance=${importance}`;
      if (status) query += `&status=${status}`;
      if (search) query += `&search=${search}`;

      const response = await axios.get(`${API_URI}/api/notices?${query}`, {
        withCredentials: true,
      });

      setNotices(response.data.data);
      setPagination((prev) => ({
        ...prev,
        total: response.data.total,
        totalPages: response.data.pagination.totalPages,
      }));
    } catch (error) {
      console.error("Error fetching notices:", error);
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      importance: "",
      status: "",
      search: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notice?")) return;

    try {
      await axios.delete(`${API_URI}/api/notices/${id}`, {
        withCredentials: true,
      });

      toast.success("Notice deleted successfully");
      fetchNotices();
    } catch (error) {
      console.error("Error deleting notice:", error);
      toast.error("Failed to delete notice");
    }
  };

  const handleArchive = async () => {
    if (selectedNotices.length === 0) {
      toast.warn("Please select notices to archive");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to archive ${selectedNotices.length} notices?`
      )
    )
      return;

    try {
      await axios.post(
        `${API_URI}/api/notices/archive`,
        {
          ids: selectedNotices,
        },
        {
          withCredentials: true,
        }
      );

      toast.success(`${selectedNotices.length} notices archived successfully`);
      setSelectedNotices([]);
      fetchNotices();
    } catch (error) {
      console.error("Error archiving notices:", error);
      toast.error("Failed to archive notices");
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Only select notices that were created by the current user
      const userNotices = notices
        .filter(
          (notice) => notice.createdBy && notice.createdBy._id === user?._id
        )
        .map((notice) => notice._id);
      setSelectedNotices(userNotices);
    } else {
      setSelectedNotices([]);
    }
  };

  const handleSelectNotice = (id, creatorId) => {
    // Only allow selection if the user is the creator of the notice
    if (creatorId !== user?._id) {
      toast.warn("You can only select notices that you created");
      return;
    }

    setSelectedNotices((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const changePage = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text("GoSync Notices", 14, 20);

    // Add filters info
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    let filterText = "Filters: ";
    if (filters.category) filterText += `Category: ${filters.category}, `;
    if (filters.importance) filterText += `Importance: ${filters.importance}, `;
    if (filters.status) filterText += `Status: ${filters.status}, `;
    if (filters.search) filterText += `Search: "${filters.search}", `;

    if (filterText !== "Filters: ") {
      doc.text(filterText.slice(0, -2), 14, 35);
    }

    // Create the table
    const tableColumn = ["Title", "Category", "Importance", "Date", "Status"];
    const tableRows = notices.map((notice) => [
      notice.title,
      notice.category,
      notice.importance,
      formatDate(notice.publishDate),
      // Use status property directly from API response
      notice.status
        ? notice.status.charAt(0).toUpperCase() + notice.status.slice(1)
        : notice.isActive
          ? notice.expiryDate && new Date(notice.expiryDate) < new Date()
            ? "Expired"
            : "Active"
          : "Inactive",
    ]);

    // Generate the PDF
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [255, 140, 0], textColor: [255, 255, 255] },
    });

    // Save the PDF
    doc.save(`GoSync_Notices_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Notices Management</h1>

          <div className="flex space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              <FiFilter className="mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>

            <button
              onClick={generatePDF}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <FiDownload className="mr-2" />
              Export PDF
            </button>

            <button
              onClick={() => navigate("/add-notice")}
              className="flex items-center px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              <FiPlus className="mr-2" />
              Add New Notice
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6 shadow-sm border border-gray-200 animate-fadeIn">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <FiFilter className="mr-1 text-orange-500" /> Filter Notices
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchNotices()}
                  className="flex items-center px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  <FiRefreshCw className="mr-1" size={12} />
                  Apply
                </button>
                <button
                  onClick={clearFilters}
                  className="flex items-center px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="transition-all duration-200 hover:shadow-sm hover:bg-white p-2 rounded-lg">
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <span className="w-2 h-2 inline-block bg-indigo-500 rounded-full mr-1"></span>
                  Category
                </label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                >
                  <option value="">All Categories</option>
                  <option value="announcement">Announcement</option>
                  <option value="service_change">Service Change</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="emergency">Emergency</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="transition-all duration-200 hover:shadow-sm hover:bg-white p-2 rounded-lg">
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <span className="w-2 h-2 inline-block bg-red-500 rounded-full mr-1"></span>
                  Importance
                </label>
                <select
                  name="importance"
                  value={filters.importance}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                >
                  <option value="">All Importance Levels</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="transition-all duration-200 hover:shadow-sm hover:bg-white p-2 rounded-lg">
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <span className="w-2 h-2 inline-block bg-green-500 rounded-full mr-1"></span>
                  Status
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="transition-all duration-200 hover:shadow-sm hover:bg-white p-2 rounded-lg">
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <span className="w-2 h-2 inline-block bg-blue-500 rounded-full mr-1"></span>
                  Search
                </label>
                <div className="flex">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <FiSearch size={14} />
                    </span>
                    <input
                      type="text"
                      name="search"
                      value={filters.search}
                      onChange={handleFilterChange}
                      placeholder="Search notices..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-l shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, search: "" }));
                    }}
                    className="bg-gray-200 px-3 py-2 border border-l-0 rounded-r hover:bg-gray-300 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {(filters.category ||
              filters.importance ||
              filters.status ||
              filters.search) && (
              <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2">
                <span className="text-xs text-gray-500">Active filters:</span>
                {filters.category && (
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full flex items-center">
                    Category: {filters.category.replace("_", " ")}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, category: "" }))
                      }
                      className="ml-1 text-indigo-800 hover:text-indigo-900"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.importance && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center">
                    Importance: {filters.importance}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, importance: "" }))
                      }
                      className="ml-1 text-red-800 hover:text-red-900"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.status && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                    Status: {filters.status}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, status: "" }))
                      }
                      className="ml-1 text-green-800 hover:text-green-900"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.search && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center">
                    Search: "{filters.search}"
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, search: "" }))
                      }
                      className="ml-1 text-blue-800 hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : notices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <FiAlertCircle size={32} className="text-gray-400 mb-2" />
              <p className="text-gray-500">No notices found</p>
              <button
                onClick={fetchNotices}
                className="mt-4 flex items-center px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                <FiRefreshCw className="mr-2" />
                Refresh
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-orange-100 to-orange-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-[60px]"
                      >
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            onChange={handleSelectAll}
                            checked={
                              notices.length > 0 &&
                              selectedNotices.length === notices.length
                            }
                            className="rounded text-orange-500 focus:ring-orange-500 h-4 w-4 cursor-pointer shadow-sm"
                          />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                          Title
                          <button
                            onClick={() => fetchNotices()}
                            className="ml-1 text-gray-400 hover:text-orange-500"
                            title="Refresh notices"
                          >
                            <FiRefreshCw size={14} />
                          </button>
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-[140px]"
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                          Category
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-[100px]"
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          Importance
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-[150px]"
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          Published
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-[100px]"
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Status
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-[70px]"
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                          Views
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-right text-xs font-medium text-gray-700 uppercase tracking-wider w-[120px]"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {notices.map((notice) => {
                      // Use status directly from the API response
                      const status =
                        notice.status ||
                        (!notice.isActive
                          ? "inactive"
                          : notice.expiryDate &&
                              new Date(notice.expiryDate) < new Date()
                            ? "expired"
                            : "active");

                      return (
                        <tr
                          key={notice._id}
                          className={`${
                            notice.importance === "critical"
                              ? "bg-red-50 hover:bg-red-100"
                              : "hover:bg-orange-50"
                          } transition-colors duration-150 transform group`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                checked={selectedNotices.includes(notice._id)}
                                onChange={() =>
                                  handleSelectNotice(
                                    notice._id,
                                    notice.createdBy?._id
                                  )
                                }
                                className="rounded text-orange-500 focus:ring-orange-500 h-4 w-4 cursor-pointer shadow-sm"
                              />
                            </div>
                          </td>
                          <td
                            className="px-6 py-4 cursor-pointer"
                            onClick={() =>
                              navigate(`/view-notice/${notice._id}`)
                            }
                          >
                            <div className="text-sm font-medium text-gray-900 group-hover:text-orange-600 transition-colors duration-150">
                              {notice.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                              <div
                                dangerouslySetInnerHTML={{
                                  __html:
                                    notice.content
                                      .replace(/<[^>]*>/g, " ")
                                      .slice(0, 120) +
                                    (notice.content.length > 120 ? "..." : ""),
                                }}
                              />
                            </div>
                            {notice.attachments &&
                              notice.attachments.length > 0 && (
                                <div className="flex items-center mt-1 text-xs text-gray-500">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3 w-3 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                    />
                                  </svg>
                                  {notice.attachments.length}{" "}
                                  {notice.attachments.length === 1
                                    ? "attachment"
                                    : "attachments"}
                                </div>
                              )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <CategoryChip category={notice.category} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <NoticeBadge importance={notice.importance} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-500">
                              <div className="font-medium text-gray-700">
                                {formatDate(notice.publishDate).split(",")[0]}
                              </div>
                              <div>
                                {formatDate(notice.publishDate).split(",")[1]}
                              </div>
                              {notice.expiryDate && (
                                <div className="mt-1 flex items-center text-xs">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3 w-3 mr-1 text-amber-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  Expires:{" "}
                                  {new Date(
                                    notice.expiryDate
                                  ).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1.5 rounded-full text-xs font-medium inline-flex items-center border
                              ${
                                status === "active"
                                  ? "bg-green-50 text-green-800 border-green-200"
                                  : status === "expired"
                                    ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                                    : "bg-gray-50 text-gray-800 border-gray-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full mr-1.5 
                                ${
                                  status === "active"
                                    ? "bg-green-500"
                                    : status === "expired"
                                      ? "bg-yellow-500"
                                      : "bg-gray-500"
                                }`}
                              ></span>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                            {status === "active" && notice.createdBy && (
                              <div className="mt-1 text-xs text-gray-500 flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                                {notice.createdBy.name}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col items-center">
                              <span className="inline-flex items-center px-2.5 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 text-sm font-medium rounded-full">
                                {notice.viewCount || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() =>
                                  navigate(`/view-notice/${notice._id}`)
                                }
                                className="p-2 bg-blue-50 rounded-full text-blue-600 hover:text-white hover:bg-blue-600 transition-all duration-200 shadow-sm"
                                title="View notice"
                              >
                                <FiEye size={16} />
                              </button>

                              {notice.createdBy &&
                              notice.createdBy._id === user?._id ? (
                                <button
                                  onClick={() =>
                                    navigate(`/edit-notice/${notice._id}`)
                                  }
                                  className="p-2 bg-indigo-50 rounded-full text-indigo-600 hover:text-white hover:bg-indigo-600 transition-all duration-200 shadow-sm"
                                  title="Edit notice"
                                >
                                  <FiEdit size={16} />
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="p-2 bg-gray-50 rounded-full text-gray-400 cursor-not-allowed shadow-sm"
                                  title="Only creators can edit notices"
                                >
                                  <FiLock size={16} />
                                </button>
                              )}

                              {notice.createdBy &&
                              notice.createdBy._id === user?._id ? (
                                <button
                                  onClick={() => handleDelete(notice._id)}
                                  className="p-2 bg-red-50 rounded-full text-red-600 hover:text-white hover:bg-red-600 transition-all duration-200 shadow-sm"
                                  title="Delete notice"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="p-2 bg-gray-50 rounded-full text-gray-400 cursor-not-allowed shadow-sm"
                                  title="Only creators can delete notices"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="flex items-center mb-4 md:mb-0">
                    {selectedNotices.length > 0 && (
                      <div className="mr-4">
                        <button
                          onClick={handleArchive}
                          className="flex items-center px-3 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-all duration-200 shadow-sm"
                        >
                          <FiArchive className="mr-2" size={14} />
                          Archive Selected ({selectedNotices.length})
                        </button>
                      </div>
                    )}
                    <div className="text-sm text-gray-700">
                      <span className="hidden md:inline">Showing </span>
                      <span className="bg-white px-2 py-1 rounded border border-gray-300 font-medium text-gray-700">
                        {(pagination.page - 1) * pagination.limit + 1}
                      </span>
                      <span className="mx-1">to</span>
                      <span className="bg-white px-2 py-1 rounded border border-gray-300 font-medium text-gray-700">
                        {Math.min(
                          pagination.page * pagination.limit,
                          pagination.total
                        )}
                      </span>
                      <span className="mx-1">of</span>
                      <span className="bg-white px-2 py-1 rounded border border-gray-300 font-medium text-gray-700">
                        {pagination.total}
                      </span>
                      <span className="hidden md:inline"> results</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => changePage(1)}
                      disabled={pagination.page === 1}
                      className={`px-2 py-1 rounded-md border ${
                        pagination.page === 1
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                      }`}
                      title="First page"
                    >
                      <span className="sr-only">First page</span>
                      <span className="text-xs font-medium">««</span>
                    </button>
                    <button
                      onClick={() => changePage(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`px-3 py-1 rounded-md border ${
                        pagination.page === 1
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                      }`}
                      title="Previous page"
                    >
                      <FiChevronLeft size={16} />
                    </button>

                    {/* Page number buttons */}
                    <div className="hidden md:flex space-x-2">
                      {Array.from({
                        length: Math.min(5, pagination.totalPages),
                      }).map((_, i) => {
                        // Calculate which page numbers to show
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (
                          pagination.page >=
                          pagination.totalPages - 2
                        ) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        if (pageNum > 0 && pageNum <= pagination.totalPages) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => changePage(pageNum)}
                              className={`w-9 h-9 rounded-md flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                                pagination.page === pageNum
                                  ? "bg-orange-500 text-white border border-orange-500 shadow-sm"
                                  : "bg-white border border-gray-300 text-gray-700 hover:bg-orange-50 hover:border-orange-300"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <span className="md:hidden px-3 py-1 bg-white border border-gray-300 rounded-md text-sm">
                      {pagination.page} / {pagination.totalPages}
                    </span>

                    <button
                      onClick={() => changePage(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className={`px-3 py-1 rounded-md border ${
                        pagination.page === pagination.totalPages
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                      }`}
                      title="Next page"
                    >
                      <FiChevronRight size={16} />
                    </button>
                    <button
                      onClick={() => changePage(pagination.totalPages)}
                      disabled={pagination.page === pagination.totalPages}
                      className={`px-2 py-1 rounded-md border ${
                        pagination.page === pagination.totalPages
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                      }`}
                      title="Last page"
                    >
                      <span className="sr-only">Last page</span>
                      <span className="text-xs font-medium">»»</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <ToastContainer />
    </AdminLayout>
  );
};

export default Notices;
