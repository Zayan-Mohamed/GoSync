import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";
import { Save, ArrowLeft, Info, Loader } from "lucide-react";

const EditSeat = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const navigate = useNavigate();
  const { seatId } = useParams();
  const [formData, setFormData] = useState({
    seatNumber: "",
    seatType: "standard",
    isDisabled: false,
  });
  const [originalSeatData, setOriginalSeatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch seat data on component mount
  useEffect(() => {
    const fetchSeatData = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/admin/seats/${seatId}`,
          {
            withCredentials: true,
          }
        );

        const seatData = response.data;
        setOriginalSeatData(seatData);
        setFormData({
          seatNumber: seatData.seatNumber || "",
          seatType: seatData.seatType || "standard",
          isDisabled: seatData.isDisabled || false,
        });
      } catch (err) {
        console.error("Error fetching seat data:", err);
        toast.error(err.response?.data?.message || "Failed to fetch seat data");
        navigate("/seat-management");
      } finally {
        setLoading(false);
      }
    };

    fetchSeatData();
  }, [API_URL, seatId, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear validation errors when field changes
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.seatNumber) {
      errors.seatNumber = "Seat number is required";
    }

    // Don't validate if seat is booked or reserved, as these can only have their type changed
    if (
      originalSeatData &&
      (originalSeatData.isBooked ||
        (originalSeatData.reservedUntil &&
          new Date(originalSeatData.reservedUntil) > new Date()))
    ) {
      if (originalSeatData.seatNumber !== formData.seatNumber) {
        errors.seatNumber =
          "Cannot change seat number for booked or reserved seats";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await axios.put(`${API_URL}/api/admin/seats/${seatId}`, formData, {
        withCredentials: true,
      });
      toast.success("Seat updated successfully");
      navigate("/seat-management");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update seat");
    } finally {
      setSubmitting(false);
    }
  };

  const returnToSeatManagement = () => {
    navigate("/seat-management");
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const isBookedOrReserved =
    originalSeatData &&
    (originalSeatData.isBooked ||
      (originalSeatData.reservedUntil &&
        new Date(originalSeatData.reservedUntil) > new Date()));

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={returnToSeatManagement}
              className="mr-4 p-2 rounded-full hover:bg-gray-200"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-2xl font-semibold">Edit Seat</h2>
          </div>
        </div>

        {isBookedOrReserved && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
            <p className="flex items-center">
              <Info className="mr-2" size={18} />
              This seat is {originalSeatData.isBooked ? "booked" : "reserved"}.
              You can only change the seat type.
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Seat Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Bus</p>
                <p className="font-medium">
                  {originalSeatData?.busId?.busNumber || "N/A"}
                  {originalSeatData?.busId?.travelName &&
                    ` - ${originalSeatData.busId.travelName}`}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Current Status</p>
                <p className="font-medium">
                  <span
                    className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full
                    ${
                      originalSeatData?.isBooked
                        ? "bg-red-100 text-red-800"
                        : originalSeatData?.reservedUntil &&
                            new Date(originalSeatData.reservedUntil) >
                              new Date()
                          ? "bg-yellow-100 text-yellow-800"
                          : originalSeatData?.isDisabled
                            ? "bg-gray-100 text-gray-800"
                            : "bg-green-100 text-green-800"
                    }`}
                  >
                    {originalSeatData?.isBooked
                      ? "Booked"
                      : originalSeatData?.reservedUntil &&
                          new Date(originalSeatData.reservedUntil) > new Date()
                        ? "Reserved"
                        : originalSeatData?.isDisabled
                          ? "Disabled"
                          : "Available"}
                  </span>
                </p>
              </div>

              {originalSeatData?.reservedUntil &&
                new Date(originalSeatData.reservedUntil) > new Date() && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Reserved Until</p>
                    <p className="font-medium">
                      {new Date(
                        originalSeatData.reservedUntil
                      ).toLocaleString()}
                    </p>
                  </div>
                )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="seatNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Seat Number *
                </label>
                <input
                  id="seatNumber"
                  name="seatNumber"
                  type="text"
                  value={formData.seatNumber}
                  onChange={handleChange}
                  placeholder="e.g., A1 or S01"
                  className={`p-2 border rounded w-full ${validationErrors.seatNumber ? "border-red-500" : "border-gray-300"}`}
                  disabled={submitting || isBookedOrReserved}
                />
                {validationErrors.seatNumber && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <Info size={14} className="mr-1" />{" "}
                    {validationErrors.seatNumber}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="seatType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Seat Type
                </label>
                <select
                  id="seatType"
                  name="seatType"
                  value={formData.seatType}
                  onChange={handleChange}
                  className="p-2 border border-gray-300 rounded w-full"
                  disabled={submitting}
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="luxury">Luxury</option>
                  <option value="sleeper">Sleeper</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  id="isDisabled"
                  name="isDisabled"
                  type="checkbox"
                  checked={formData.isDisabled}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  disabled={submitting || isBookedOrReserved}
                />
                <label
                  htmlFor="isDisabled"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Disable Seat
                </label>
                {isBookedOrReserved && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Not available for booked or reserved seats)
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-8">
              <button
                type="button"
                onClick={returnToSeatManagement}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {submitting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EditSeat;
