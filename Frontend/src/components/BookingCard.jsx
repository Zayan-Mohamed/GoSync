import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { toast } from "react-toastify";
import axios from "axios";
import { jsPDF } from "jspdf";
import { QrCode, CheckCircle, XCircle, Loader2, Download } from "lucide-react";

const mockQRCode = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAC9gH5wZ/4vAAAAABJRU5ErkJggg==";

function BookingCard({ booking, onCancel, showCancelButton = false }) {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const qrCode = booking.qrCode || mockQRCode;
  const isMockQR = qrCode === mockQRCode;

  const handleOpenModal = () => {
    setValidationResult(null);
    setIsQRModalOpen(true);
  };

  const handleCloseModal = () => {
    setValidationResult(null);
    setIsQRModalOpen(false);
  };

  const validateQRCode = async () => {
    setIsValidating(true);
    try {
      const qrResponse = await axios.get(
        `http://localhost:5000/api/bookings/getQRCode/${booking.bookingId}`,
        { withCredentials: true }
      );
      const qrPayload = qrResponse.data?.qrPayload;

      if (!qrPayload?.signature) {
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
      toast.success(response.data.message || "Validation successful");
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to validate QR code";
      setValidationResult({ message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsValidating(false);
    }
  };

  const generateTicketPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const lineHeight = 10;
    let y = margin;

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 102, 204); // GoSync blue
    doc.text("GoSync Bus Ticket", pageWidth / 2, y, { align: "center" });
    y += lineHeight * 1.5;

    // Separator
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 102, 204);
    doc.line(margin, y, pageWidth - margin, y);
    y += lineHeight;

    // Booking Details
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    const details = [
      `Booking ID: ${booking.bookingId}`,
      `Route: ${booking.from} to ${booking.to}`,
      `Seats: ${booking.seatNumbers.join(", ")}`,
      `Bus Number: ${booking.busNumber || "N/A"}`,
      `Booked On: ${booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "N/A"}`,
      `Status: ${booking.status}`,
      `Payment Status: ${booking.paymentStatus}`,
      `Total Fare: LKR ${booking.fareTotal || "N/A"}`,
    ];

    details.forEach((line) => {
      doc.text(line, margin, y);
      y += lineHeight;
    });

    // Footer
    y += lineHeight;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Thank you for choosing GoSync!", pageWidth / 2, y, { align: "center" });
    y += lineHeight;
    doc.text("Contact: support@gosync.com | www.gosync.com", pageWidth / 2, y, { align: "center" });

    // Save PDF
    doc.save(`GoSync_Ticket_${booking.bookingId}.pdf`);
  };

  // Determine validation status
  const isValidQR = validationResult?.message?.toLowerCase().includes("valid");
  const canDownloadTicket = booking.status === "confirmed" && booking.paymentStatus === "paid" && isValidQR;

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow flex justify-between items-center">
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
            <span className={`${booking.status === "confirmed" ? "text-green-600" : "text-red-600"} font-medium`}>
              {booking.status}
            </span>
          </p>
          <p className="text-sm">
            Payment:{" "}
            <span
              className={`${
                booking.paymentStatus === "paid"
                  ? "text-green-600"
                  : booking.paymentStatus === "pending"
                  ? "text-yellow-600"
                  : "text-red-600"
              } font-medium`}
            >
              {booking.paymentStatus}
            </span>
          </p>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={handleOpenModal}
          className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition flex items-center"
        >
          <QrCode className="w-4 h-4 mr-2" /> View QR
        </button>
        {showCancelButton && (
          <button
            onClick={() => onCancel(booking.bookingId)}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
          >
            Cancel
          </button>
        )}
      </div>

      {/* QR Code Modal */}
      <Dialog open={isQRModalOpen} onClose={handleCloseModal}>
        <DialogTitle>Booking QR Code</DialogTitle>
        <DialogContent>
          <div className="flex flex-col items-center space-y-4">
            <img
              src={qrCode}
              alt={`QR Code for ${booking.bookingId}`}
              className="w-48 h-48 object-contain border border-gray-200 rounded"
            />
            {isMockQR && (
              <p className="text-sm text-yellow-600 text-center">
                Warning: Using placeholder QR code. Please contact support.
              </p>
            )}
            <p className="text-sm text-gray-600 text-center">
              Scan this QR code to validate your ticket for {booking.from} to {booking.to}.
            </p>

            {booking.status === "confirmed" && booking.paymentStatus === "paid" && !isValidQR && (
              <button
                onClick={validateQRCode}
                disabled={isValidating}
                className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                  isValidating ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                } flex items-center space-x-2`}
              >
                {isValidating ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" />
                    <span>Validating...</span>
                  </>
                ) : (
                  "Validate QR Code"
                )}
              </button>
            )}

            {canDownloadTicket && (
              <button
                onClick={generateTicketPDF}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Ticket</span>
              </button>
            )}

            {validationResult && (
              <div
                className={`flex items-center space-x-2 p-3 rounded-lg w-full ${
                  isValidQR ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {isValidQR ? (
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
            onClick={handleCloseModal}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Close
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default BookingCard;