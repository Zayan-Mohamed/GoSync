import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";
import {
  Save,
  ArrowLeft,
  Info,
  Check,
  AlertCircle,
  Loader,
  Eye,
} from "lucide-react";

const BulkEditSeats = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const navigate = useNavigate();
  const location = useLocation();
  const seatIds = location.state?.seatIds || [];

  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    seatType: "",
    isDisabled: null,
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [affectedSeatCounts, setAffectedSeatCounts] = useState({
    total: 0,
    available: 0,
    booked: 0,
    reserved: 0,
    disabled: 0,
  });

  // Fetch the data for the selected seats
  useEffect(() => {
    const fetchSeatsData = async () => {
      if (seatIds.length === 0) {
        toast.error("No seats selected for bulk edit");
        navigate("/seat-management");
        return;
      }

      try {
        const promises = seatIds.map((id) =>
          axios.get(`${API_URL}/api/admin/seats/${id}`, {
            withCredentials: true,
          })
        );
        const responses = await Promise.all(promises);
        const seatsData = responses.map((res) => res.data);

        setSeats(seatsData);

        // Calculate affected seat counts
        setAffectedSeatCounts({
          total: seatsData.length,
          available: seatsData.filter(
            (seat) =>
              !seat.isBooked &&
              !seat.isDisabled &&
              (!seat.reservedUntil ||
                new Date(seat.reservedUntil) <= new Date())
          ).length,
          booked: seatsData.filter((seat) => seat.isBooked).length,
          reserved: seatsData.filter(
            (seat) =>
              !seat.isBooked &&
              seat.reservedUntil &&
              new Date(seat.reservedUntil) > new Date()
          ).length,
          disabled: seatsData.filter((seat) => seat.isDisabled).length,
        });
      } catch (err) {
        console.error("Error fetching seats data:", err);
        toast.error(
          "Failed to fetch seat data. Redirecting to seat management."
        );
        navigate("/seat-management");
      } finally {
        setLoading(false);
      }
    };

    fetchSeatsData();
  }, [API_URL, seatIds, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // For radio buttons that control isDisabled
    if (name === "disabledOption") {
      setFormData((prev) => ({
        ...prev,
        isDisabled:
          value === "enable" ? false : value === "disable" ? true : null,
      }));
      return;
    }

    // For other inputs
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
    let valid = false;

    // Check if at least one field is being changed
    if (formData.seatType || formData.isDisabled !== null) {
      valid = true;
    } else {
      errors.form = "You must select at least one field to update";
    }

    setValidationErrors(errors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);

    // Create an updates object that only includes the fields to update
    const updates = {};
    if (formData.seatType) updates.seatType = formData.seatType;
    if (formData.isDisabled !== null) updates.isDisabled = formData.isDisabled;

    try {
      const response = await axios.post(
        `${API_URL}/api/admin/seats/bulk-update`,
        {
          seatIds,
          updates,
        },
        { withCredentials: true }
      );

      toast.success(`Successfully updated ${response.data.count} seats`);
      navigate("/seat-management");
    } catch (err) {
      console.error("Error updating seats:", err);
      toast.error(err.response?.data?.message || "Failed to update seats");
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

  const anyBookedOrReservedSeats = seats.some(
    (seat) =>
      seat.isBooked ||
      (seat.reservedUntil && new Date(seat.reservedUntil) > new Date())
  );

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
            <h2 className="text-2xl font-semibold">Bulk Edit Seats</h2>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="flex items-center text-blue-800 font-medium mb-2">
            <Info className="mr-2" size={18} />
            You are editing {seats.length} seats
          </h3>
          <div className="flex flex-wrap gap-3 mt-2">
            <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Available: {affectedSeatCounts.available}
            </div>
            <div className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              Booked: {affectedSeatCounts.booked}
            </div>
            <div className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm flex items-center">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
              Reserved: {affectedSeatCounts.reserved}
            </div>
            <div className="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-sm flex items-center">
              <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
              Disabled: {affectedSeatCounts.disabled}
            </div>
          </div>
        </div>

        {anyBookedOrReservedSeats && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-6">
            <p className="flex items-center">
              <AlertCircle className="mr-2" size={18} />
              Some selected seats are booked or reserved. For these seats, only
              the seat type can be changed.
            </p>
          </div>
        )}

        {validationErrors.form && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
            <p className="flex items-center">
              <AlertCircle className="mr-2" size={18} />
              {validationErrors.form}
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Update Seat Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <option value="">No Change</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="luxury">Luxury</option>
                    <option value="sleeper">Sleeper</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Update Seat Status</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center">
                  <input
                    id="noStatusChange"
                    type="radio"
                    name="disabledOption"
                    value="nochange"
                    checked={formData.isDisabled === null}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    disabled={submitting}
                  />
                  <label
                    htmlFor="noStatusChange"
                    className="ml-2 block text-sm font-medium text-gray-700"
                  >
                    No Change
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="enableSeats"
                    type="radio"
                    name="disabledOption"
                    value="enable"
                    checked={formData.isDisabled === false}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    disabled={submitting}
                  />
                  <label
                    htmlFor="enableSeats"
                    className="ml-2 block text-sm font-medium text-gray-700"
                  >
                    Enable Seats (Available seats only)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="disableSeats"
                    type="radio"
                    name="disabledOption"
                    value="disable"
                    checked={formData.isDisabled === true}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    disabled={submitting}
                  />
                  <label
                    htmlFor="disableSeats"
                    className="ml-2 block text-sm font-medium text-gray-700"
                  >
                    Disable Seats (Available seats only)
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
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
                    Updating Seats...
                  </>
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    Apply to All Selected Seats
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="flex items-center text-lg font-medium mb-4">
            <Eye size={18} className="mr-2" />
            Selected Seats Preview
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Seat Number
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Bus
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Seat Type
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Will Change
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {seats.map((seat) => {
                  const isBooked = seat.isBooked;
                  const isReserved =
                    seat.reservedUntil &&
                    new Date(seat.reservedUntil) > new Date();
                  const canChangeStatus = !isBooked && !isReserved;
                  const willChangeType = !!formData.seatType;
                  const willChangeStatus =
                    formData.isDisabled !== null && canChangeStatus;

                  return (
                    <tr
                      key={seat._id}
                      className={`hover:bg-gray-50 ${!canChangeStatus ? "bg-gray-50" : ""}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {seat.seatNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {seat.busId?.busNumber || "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap capitalize">
                        {formData.seatType ? (
                          <span className="inline-flex items-center">
                            <span className="line-through text-gray-400 mr-2">
                              {seat.seatType || "standard"}
                            </span>
                            <span className="text-green-600">
                              {formData.seatType}
                            </span>
                          </span>
                        ) : (
                          seat.seatType || "standard"
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${
                            isBooked
                              ? "bg-red-100 text-red-800"
                              : isReserved
                                ? "bg-yellow-100 text-yellow-800"
                                : seat.isDisabled
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-green-100 text-green-800"
                          }`}
                        >
                          {isBooked
                            ? "Booked"
                            : isReserved
                              ? "Reserved"
                              : seat.isDisabled
                                ? "Disabled"
                                : "Available"}
                        </span>

                        {canChangeStatus && formData.isDisabled !== null && (
                          <span className="ml-2 text-gray-400">→</span>
                        )}

                        {canChangeStatus &&
                          formData.isDisabled === true &&
                          !seat.isDisabled && (
                            <span className="ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              Disabled
                            </span>
                          )}

                        {canChangeStatus &&
                          formData.isDisabled === false &&
                          seat.isDisabled && (
                            <span className="ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Available
                            </span>
                          )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {willChangeType || willChangeStatus ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <span className="text-gray-400 text-sm">
                            No change
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {seats.length > 10 && (
            <div className="mt-4 text-center text-gray-500 text-sm">
              Showing all {seats.length} selected seats
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default BulkEditSeats;
