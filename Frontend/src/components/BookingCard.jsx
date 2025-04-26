import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { toast } from "react-toastify";
import axios from "axios";
import { QrCode, CheckCircle, XCircle } from "lucide-react";

// Mock Base64 QR code (for display only)
const mockQRCode = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAC9gH5wZ/4vAAAAABJRU5ErkJggg==";

function BookingCard({ booking, onCancel, showCancelButton = false }) {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  // Use booking.qrCode or fallback to mock QR code for display
  const qrCode = booking.qrCode || mockQRCode;

  const validateQRCode = async () => {
    setIsValidating(true);
    try {
      // Fetch QR code and payload from backend
      const qrResponse = await axios.get(
        `http://localhost:5000/api/bookings/getQRCode/${booking.bookingId}`,
        { withCredentials: true }
      );
      const qrPayload = qrResponse.data.qrPayload;

      if (!qrPayload || !qrPayload.signature) {
        throw new Error("Invalid or missing QR code payload");
      }

      const response = await axios.post(
        "http://localhost:5000/api/bookings/verifyQRCode",
        {
          bookingId: qrPayload.bookingId,
          issuedAt: qrPayload.issuedAt,
          signature: qrPayload.signature,
        },
        { withCredentials: true }
      );
      setValidationResult(response.data);
      toast.success(response.data.message);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to validate QR code";
      setValidationResult({ message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div
      className={`p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow flex justify-between items-center`}
    >
      <div>
        <p className="font-semibold text-lg text-gray-800">{booking.bookingId}</p>
        <p className="text-gray-600">
          {booking.from} to {booking.to} | Seats: {booking.seatNumbers.join(", ")}
        </p>
        <p className="text-sm text-gray-500">
          Booked on: {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "N/A"}
        </p>
        <div className="flex space-x-4">
          <p className="text-sm">
            Status:{" "}
            <span
              className={`${
                booking.status === "confirmed" ? "text-green-600" : "text-red-600"
              } font-medium`}
            >
              {booking.status}
            </span>
          </p>
          <p className="text-sm">
            Payment:{" "}
            <span
              className={`${
                booking.paymentStatus === "paid" ? "text-green-600" : "text-yellow-600"
              } font-medium`}
            >
              {booking.paymentStatus}
            </span>
          </p>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => setIsQRModalOpen(true)}
          className={`px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition flex items-center`}
        >
          <QrCode className="w-4 h-4 mr-2" /> View QR
        </button>
        {showCancelButton && (
          <button
            onClick={() => onCancel(booking.bookingId)}
            className={`px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition`}
          >
            Cancel
          </button>
        )}
      </div>

      {/* QR Code Modal */}
      <Dialog open={isQRModalOpen} onClose={() => setIsQRModalOpen(false)}>
        <DialogTitle>Booking QR Code</DialogTitle>
        <DialogContent>
          <div className="flex flex-col items-center space-y-4">
            <img
              src={qrCode}
              alt={`QR Code for ${booking.bookingId}`}
              className={`w-48 h-48 object-contain border border-gray-200 rounded`}
            />
            {!booking.qrCode && (
              <p className="text-sm text-yellow-600 text-center">
                Warning: Using placeholder QR code. Please contact support.
              </p>
            )}
            <p className="text-sm text-gray-600 text-center">
              Scan this QR code to validate your ticket for {booking.from} to {booking.to}.
            </p>
            <button
              onClick={validateQRCode}
              disabled={isValidating}
              className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                isValidating ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isValidating ? "Validating..." : "Validate QR Code"}
            </button>
            {validationResult && (
              <div
                className={`flex items-center space-x-2 p-3 rounded-lg w-full ${
                  validationResult.message.includes("valid")
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {validationResult.message.includes("valid") ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <p className="text-sm font-medium">{validationResult.message}</p>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <button
            onClick={() => setIsQRModalOpen(false)}
            className={`px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition`}
          >
            Close
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default BookingCard;