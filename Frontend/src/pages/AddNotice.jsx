import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiSave, FiArrowLeft, FiAlertCircle } from "react-icons/fi";
import { Editor } from "@tinymce/tinymce-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AddNotice = () => {
  const [notice, setNotice] = useState({
    title: "",
    content: "",
    category: "announcement",
    importance: "medium",
    expiryDate: null,
    isActive: true,
    attachments: [],
  });
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const navigate = useNavigate();
  const API_URI = import.meta.env.VITE_API_URL;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNotice((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleContentChange = (content) => {
    setNotice((prev) => ({ ...prev, content }));
  };

  const handleExpiryDateChange = (date) => {
    setNotice((prev) => ({ ...prev, expiryDate: date }));
  };

  const handleFileUpload = async (e) => {
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
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!notice.title || !notice.content) {
      toast.error("Title and content are required");
      return;
    }

    setSaving(true);

    try {
      const response = await axios.post(
        `${API_URI}/api/notices`,
        { ...notice, attachments },
        { withCredentials: true }
      );

      toast.success("Notice created successfully");
      navigate("/notices");
    } catch (error) {
      console.error("Error creating notice:", error);
      toast.error(error.response?.data?.message || "Failed to create notice");
    } finally {
      setSaving(false);
    }
  };

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
            Create New Notice
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow overflow-hidden"
        >
          <div className="p-6">
            <div className="mb-4">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={notice.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter notice title"
                required
              />
            </div>

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
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

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
              />
              <p className="text-xs text-gray-500 mt-1">
                If set, the notice will automatically be marked as expired after
                this date.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content <span className="text-red-500">*</span>
              </label>
              <Editor
                apiKey={import.meta.env.VITE_API_TINYMCE_API_KEY}
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
                }}
                value={notice.content}
                onEditorChange={handleContentChange}
              />
              {!notice.content && (
                <p className="text-xs text-red-500 mt-1">
                  <FiAlertCircle className="inline mr-1" />
                  Content is required
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachments (Optional)
              </label>
              <div className="flex items-center">
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded-md">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={saving}
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

              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <span className="text-sm truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={notice.isActive}
                  onChange={handleChange}
                  className="rounded text-orange-500 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm">Publish immediately</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                If unchecked, the notice will be saved as a draft.
              </p>
            </div>
          </div>

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
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  Create Notice
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <ToastContainer />
    </AdminLayout>
  );
};

export default AddNotice;
