import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiSave, FiX, FiArrowLeft, FiAlertCircle, FiEye } from "react-icons/fi";
import { Editor } from "@tinymce/tinymce-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useAuthStore from "../store/authStore";

const EditNotice = () => {
  const { id } = useParams();
  const [notice, setNotice] = useState({
    title: "",
    content: "",
    category: "announcement",
    importance: "medium",
    expiryDate: null,
    isActive: true,
    attachments: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewMode, setViewMode] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [viewCountIncremented, setViewCountIncremented] = useState(false);

  const navigate = useNavigate();
  const API_URI = import.meta.env.VITE_API_URL;
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchNotice = async () => {
      setLoading(true);
      try {
        // Create a permanent key in localStorage to track if this notice has been viewed
        const viewedKey = `viewedNotice_${id}`;
        const alreadyViewed = localStorage.getItem(viewedKey) === "true";
        const isViewMode = window.location.pathname.includes("view-notice");

        // If in edit mode or already viewed, don't increment
        const skipViewIncrement =
          !isViewMode || alreadyViewed ? "true" : "false";

        const url = `${API_URI}/api/notices/${id}?skipViewIncrement=${skipViewIncrement}`;

        const response = await axios.get(url, {
          withCredentials: true,
        });

        // Only mark as viewed if we're in view mode and didn't skip the increment
        if (isViewMode && skipViewIncrement === "false") {
          // Set view flag permanently in localStorage
          localStorage.setItem(viewedKey, "true");
          setViewCountIncremented(true);
        }

        const noticeData = response.data.data;

        // Format expiry date if exists
        if (noticeData.expiryDate) {
          noticeData.expiryDate = new Date(noticeData.expiryDate);
        }

        setNotice(noticeData);
        setAttachments(noticeData.attachments || []);
        setViewMode(isViewMode);

        // Check if current user is the creator of this notice
        setIsCreator(
          noticeData.createdBy && user && noticeData.createdBy._id === user._id
        );

        // If trying to access edit mode but not creator, redirect to view mode
        if (!isViewMode && !isCreator) {
          toast.error("Only the creator can edit this notice");
          navigate(`/view-notice/${id}`);
          return;
        }
      } catch (error) {
        console.error("Error fetching notice:", error);
        toast.error("Failed to load notice");
        navigate("/notices");
      } finally {
        setLoading(false);
      }
    };

    fetchNotice();
  }, [id, navigate, API_URI, user, isCreator]);

  useEffect(() => {
    // Extra security check - force redirect to view mode if not creator
    if (!loading && !viewMode && !isCreator) {
      toast.error("You don't have permission to edit this notice");
      navigate(`/view-notice/${id}`);
      return;
    }
  }, [loading, viewMode, isCreator, navigate, id]);

  const handleChange = (e) => {
    if (viewMode) return;

    const { name, value, type, checked } = e.target;
    setNotice((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleContentChange = (content) => {
    if (viewMode) return;
    setNotice((prev) => ({ ...prev, content }));
  };

  const handleExpiryDateChange = (date) => {
    if (viewMode) return;
    setNotice((prev) => ({ ...prev, expiryDate: date }));
  };

  const handleFileUpload = async (e) => {
    if (viewMode) return;

    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    try {
      // For simplicity, this is a placeholder for file uploads
      // You would typically upload files to a server or cloud storage

      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);

        if (progress >= 100) {
          clearInterval(interval);

          // Add placeholder attachments (in a real app, you'd get these from the server)
          const newAttachments = files.map((file) => ({
            name: file.name,
            url: URL.createObjectURL(file),
            type: file.type,
          }));

          setAttachments((prev) => [...prev, ...newAttachments]);
          setUploadProgress(0);
        }
      }, 300);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
      setUploadProgress(0);
    }
  };

  const removeAttachment = (index) => {
    if (viewMode) return;
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (viewMode) return;

    // Double-check permission before submitting
    try {
      const permissionCheck = await axios.get(
        `${API_URI}/api/notices/${id}/check-permissions`,
        { withCredentials: true }
      );

      if (!permissionCheck.data.hasEditAccess) {
        toast.error("You don't have permission to edit this notice");
        navigate(`/view-notice/${id}`);
        return;
      }
    } catch (error) {
      console.error("Permission check failed:", error);
      toast.error("Permission verification failed");
      return;
    }

    if (!notice.title || !notice.content) {
      toast.error("Title and content are required");
      return;
    }

    setSaving(true);

    try {
      await axios.put(
        `${API_URI}/api/notices/${id}`,
        { ...notice, attachments },
        { withCredentials: true }
      );

      toast.success("Notice updated successfully");
      navigate("/notices");
    } catch (error) {
      console.error("Error updating notice:", error);
      toast.error(error.response?.data?.message || "Failed to update notice");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render notice status information
  const NoticeStatusInfo = () => {
    const isExpired =
      notice.expiryDate && new Date(notice.expiryDate) < new Date();
    const status = !notice.isActive
      ? "inactive"
      : isExpired
        ? "expired"
        : "active";

    const statusColors = {
      active: "bg-green-100 text-green-800 border-green-200",
      expired: "bg-yellow-100 text-yellow-800 border-yellow-200",
      inactive: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return (
      <div className={`p-4 rounded-md border ${statusColors[status]}`}>
        <h3 className="font-medium">Notice Status</h3>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className="text-sm font-medium">Status</p>
            <p className="text-sm">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium 
                ${
                  status === "active"
                    ? "bg-green-100 text-green-800"
                    : status === "expired"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Published</p>
            <p className="text-sm">{formatDate(notice.publishDate)}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Expires</p>
            <p className="text-sm">{formatDate(notice.expiryDate)}</p>
          </div>
          <div>
            <p className="text-sm font-medium">View Count</p>
            <p className="text-sm">{notice.viewCount || 0}</p>
          </div>
        </div>

        {!viewMode && (
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={notice.isActive}
                onChange={handleChange}
                className="rounded text-orange-500 focus:ring-orange-500"
              />
              <span className="ml-2 text-sm">Active</span>
            </label>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <button
              onClick={() => navigate("/notices")}
              className="mr-3 hover:bg-gray-100 p-2 rounded-full"
            >
              <FiArrowLeft size={20} />
            </button>
            {viewMode ? "View Notice" : "Edit Notice"}
          </h1>

          {viewMode ? (
            isCreator ? (
              <button
                onClick={() => navigate(`/edit-notice/${id}`)}
                className="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <FiEye className="mr-2" />
                Edit Notice
              </button>
            ) : (
              <div className="text-sm text-gray-500 italic bg-gray-100 px-3 py-2 rounded">
                You cannot edit this notice as you are not the creator
              </div>
            )
          ) : (
            <button
              onClick={() => navigate(`/view-notice/${id}`)}
              className="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <FiEye className="mr-2" />
              View Mode
            </button>
          )}
        </div>

        {/* Show warning if user is trying to edit but isn't the creator */}
        {!viewMode && !isCreator && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4"
            role="alert"
          >
            <p className="font-bold">Permission Denied</p>
            <p>
              You don't have permission to edit this notice as you are not the
              creator.
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            <div className="md:col-span-2">
              <div className="mb-4">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Title {!viewMode && <span className="text-red-500">*</span>}
                </label>
                {viewMode ? (
                  <h2 className="text-xl font-bold">{notice.title}</h2>
                ) : (
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={notice.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter notice title"
                    required
                    readOnly={viewMode}
                  />
                )}
              </div>

              {!viewMode && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={notice.category}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      disabled={viewMode}
                    >
                      <option value="announcement">Announcement</option>
                      <option value="service_change">Service Change</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="emergency">Emergency</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="importance"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Importance Level
                    </label>
                    <select
                      id="importance"
                      name="importance"
                      value={notice.importance}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      disabled={viewMode}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
              )}

              {viewMode && (
                <div className="flex gap-4 mb-4 mt-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium 
                    ${
                      notice.category === "announcement"
                        ? "bg-indigo-100 text-indigo-800"
                        : notice.category === "service_change"
                          ? "bg-orange-100 text-orange-800"
                          : notice.category === "maintenance"
                            ? "bg-teal-100 text-teal-800"
                            : notice.category === "emergency"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {notice.category === "service_change"
                      ? "Service Change"
                      : notice.category.charAt(0).toUpperCase() +
                        notice.category.slice(1)}
                  </span>

                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium 
                    ${
                      notice.importance === "low"
                        ? "bg-green-100 text-green-800"
                        : notice.importance === "medium"
                          ? "bg-blue-100 text-blue-800"
                          : notice.importance === "high"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                    }`}
                  >
                    {notice.importance.charAt(0).toUpperCase() +
                      notice.importance.slice(1)}{" "}
                    Importance
                  </span>
                </div>
              )}

              {!viewMode && (
                <div className="mb-4">
                  <label
                    htmlFor="expiryDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Expiry Date (Optional)
                  </label>
                  <DatePicker
                    selected={notice.expiryDate}
                    onChange={handleExpiryDateChange}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    timeCaption="time"
                    dateFormat="MMMM d, yyyy h:mm aa"
                    minDate={new Date()}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholderText="Select expiry date and time (optional)"
                    disabled={viewMode}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If set, the notice will automatically be marked as expired
                    after this date.
                  </p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content {!viewMode && <span className="text-red-500">*</span>}
                </label>
                {viewMode ? (
                  <div
                    className="prose max-w-none border rounded-md p-4"
                    dangerouslySetInnerHTML={{ __html: notice.content }}
                  />
                ) : (
                  <>
                    <Editor
                      apiKey={import.meta.env.VITE_API_TINYMCE_API_KEY} // Replace with your TinyMCE API key
                      init={{
                        height: 400,
                        menubar: false,
                        plugins: [
                          "advlist",
                          "autolink",
                          "lists",
                          "link",
                          "image",
                          "charmap",
                          "preview",
                          "anchor",
                          "searchreplace",
                          "visualblocks",
                          "code",
                          "fullscreen",
                          "insertdatetime",
                          "media",
                          "table",
                          "code",
                          "help",
                          "wordcount",
                        ],
                        toolbar:
                          "undo redo | blocks | " +
                          "bold italic forecolor | alignleft aligncenter " +
                          "alignright alignjustify | bullist numlist outdent indent | " +
                          "removeformat | help",
                        readonly: viewMode,
                      }}
                      value={notice.content}
                      onEditorChange={handleContentChange}
                      disabled={viewMode}
                    />
                    {!notice.content && (
                      <p className="text-xs text-red-500 mt-1">
                        <FiAlertCircle className="inline mr-1" />
                        Content is required
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attachments {viewMode ? "" : "(Optional)"}
                </label>

                {!viewMode && (
                  <div className="flex items-center">
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded-md">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={saving || viewMode}
                      />
                      <span>Select Files</span>
                    </label>

                    {uploadProgress > 0 && (
                      <div className="ml-4 flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-orange-500 h-2.5 rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {attachments.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span className="text-sm truncate">{file.name}</span>
                        {!viewMode && (
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiX />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">No attachments</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <NoticeStatusInfo />

              {notice.createdBy && (
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Created By</h3>
                  <p className="text-sm">
                    {notice.createdBy.name || "Unknown"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {notice.createdBy.email || ""}
                  </p>
                </div>
              )}
            </div>
          </div>

          {!viewMode && (
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate("/notices")}
                className="px-4 py-2 border rounded-md shadow-sm text-sm font-medium"
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-md shadow-sm text-sm font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                disabled={saving || viewMode}
              >
                {saving ? (
                  <>
                    <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      <ToastContainer />
    </AdminLayout>
  );
};

export default EditNotice;
