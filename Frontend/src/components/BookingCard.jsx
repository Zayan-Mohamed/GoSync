import React, { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { toast } from "react-toastify";
import axios from "axios";
import { jsPDF } from "jspdf";
import {
  QrCode,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  CreditCard,
  Check,
  Calendar,
  Clock,
  Bus,
  ArrowRight,
  AlertTriangle,
  DollarSign,
  Info,
} from "lucide-react";

const mockQRCode =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAC9gH5wZ/4vAAAAABJRU5ErkJggg==";

function BookingCard({
  booking,
  onCancel,
  showCancelButton = false,
  showPayButton = false,
  onPay,
  extraComponent = null,
}) {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCancellingSeat, setIsCancellingSeat] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isSeatCancelModalOpen, setIsSeatCancelModalOpen] = useState(false);
  const [processedSeats, setProcessedSeats] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaymentExpired, setIsPaymentExpired] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (!booking) {
      setProcessedSeats([]);
      return;
    }

    if (booking.seats && booking.seats.length > 0) {
      if (
        typeof booking.seats[0] === "string" ||
        isLikelyObjectId(booking.seats[0])
      ) {
        if (
          !booking.seatNumbers ||
          booking.seatNumbers.length !== booking.seats.length
        ) {
          console.warn(
            "Mismatch between seats and seatNumbers or missing seatNumbers:",
            booking
          );
          setProcessedSeats([]);
          return;
        }
        const syntheticSeats = booking.seats.map((seatId, index) => ({
          _id: seatId.toString(),
          seatNumber: booking.seatNumbers[index] || `Seat ${index + 1}`,
          synthetic: true,
        }));
        setProcessedSeats(syntheticSeats);
      } else {
        setProcessedSeats(booking.seats);
      }
    } else if (booking.seatNumbers && booking.seatNumbers.length > 0) {
      const syntheticSeats = booking.seatNumbers.map((seatNumber, index) => ({
        _id: `synthetic-${booking.bookingId}-${seatNumber || "empty"}-${index}`,
        seatNumber: seatNumber || `Seat ${index + 1}`,
        synthetic: true,
      }));
      setProcessedSeats(syntheticSeats);
    } else {
      setProcessedSeats([]);
    }
  }, [booking]);

  useEffect(() => {
    if (
      booking.status === "confirmed" &&
      booking.paymentStatus === "pending" &&
      booking.createdAt
    ) {
      const bookedTime = new Date(booking.createdAt).getTime();
      const deadlineTime = bookedTime + 6 * 60 * 60 * 1000; // 6 hours in milliseconds

      const updateRemainingTime = () => {
        const currentTime = new Date().getTime();
        const remainingTime = Math.max(
          0,
          Math.floor((deadlineTime - currentTime) / 1000)
        );
        setTimeRemaining(remainingTime);
      };

      updateRemainingTime();

      const timerId = setInterval(updateRemainingTime, 60000);

      return () => clearInterval(timerId);
    }
  }, [booking]);

  useEffect(() => {
    if (
      booking.status === "confirmed" &&
      booking.paymentStatus === "pending" &&
      booking.createdAt
    ) {
      const bookingTime = new Date(booking.createdAt).getTime();
      const deadline = bookingTime + 6 * 60 * 60 * 1000; // 6 hours in milliseconds
      const now = new Date().getTime();

      // Check if the booking payment window has expired
      if (now > deadline) {
        setIsPaymentExpired(true);
      } else {
        // Set a timeout to check again when the deadline is reached
        const timeRemaining = deadline - now;
        const timeoutId = setTimeout(() => {
          setIsPaymentExpired(true);
        }, timeRemaining);

        // Cleanup timeout on unmount
        return () => clearTimeout(timeoutId);
      }
    }
  }, [booking]);

  function isLikelyObjectId(id) {
    return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  }

  const formatTimeRemaining = (seconds) => {
    if (seconds <= 0) return "0h 0m (expired)";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

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

  const toggleSeatSelection = (seatId, seatNumber) => {
    if (!seatId && seatNumber) {
      const seat = processedSeats.find((s) => s.seatNumber === seatNumber);
      if (seat && seat._id) {
        seatId = seat._id;
      } else {
        console.warn(
          `Attempted to toggle selection on a seat with no ID. SeatNumber: ${seatNumber}, ProcessedSeats:`,
          processedSeats
        );
        return;
      }
    }

    if (!seatId) {
      console.warn(
        "Attempted to toggle selection on a seat with no ID. SeatNumber:",
        seatNumber,
        "ProcessedSeats:",
        processedSeats
      );
      return;
    }

    console.log("Toggling seat selection:", seatId, "with number:", seatNumber);

    setSelectedSeats((prevSeats) => {
      if (prevSeats.includes(seatId)) {
        return prevSeats.filter((id) => id !== seatId);
      } else {
        return [...prevSeats, seatId];
      }
    });
  };

  const openSeatCancelModal = () => {
    setSelectedSeats([]);
    setIsSeatCancelModalOpen(true);
  };

  const closeSeatCancelModal = () => {
    setSelectedSeats([]);
    setIsSeatCancelModalOpen(false);
  };

  const handleCancelSelectedSeats = async () => {
    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat to cancel");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to cancel ${selectedSeats.length} selected seat(s)?`
      )
    ) {
      return;
    }

    setIsCancellingSeat(true);
    try {
      const seatsToCancel = processedSeats.filter((seat) =>
        selectedSeats.includes(seat._id)
      );

      console.log("Seats to cancel:", seatsToCancel);

      if (seatsToCancel.length === 0) {
        throw new Error("Failed to identify the selected seats");
      }

      const selectedSeatNumbers = seatsToCancel.map((seat) => seat.seatNumber);

      console.log("Seat numbers to cancel:", selectedSeatNumbers);

      const requestData = {
        bookingId: booking.bookingId,
        seatNumbers: selectedSeatNumbers,
      };

      const response = await axios.post(
        `${API_URL}/api/bookings/cancel-seats`,
        requestData,
        { withCredentials: true }
      );

      toast.success(response.data.message || "Seats cancelled successfully");
      closeSeatCancelModal();

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error("Error cancelling seats:", err);
      toast.error(err.response?.data?.message || "Failed to cancel seats");
    } finally {
      setIsCancellingSeat(false);
    }
  };

  const validateQRCode = async () => {
    setIsValidating(true);
    try {
      const qrResponse = await axios.get(
        `${API_URL}/api/bookings/getQRCode/${booking.bookingId}`,
        { withCredentials: true }
      );
      const qrPayload = qrResponse.data?.qrPayload;

      if (!qrPayload?.signature) {
        throw new Error("Invalid or missing QR code payload");
      }

      const response = await axios.post(
        `${API_URL}/api/bookings/verifyQRCode`,
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
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to validate QR code";
      setValidationResult({ message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsValidating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDaysSinceBooking = () => {
    if (!booking.createdAt) return null;
    const bookingDate = new Date(booking.createdAt);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - bookingDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSinceBooking = calculateDaysSinceBooking();
  const isRecentBooking = daysSinceBooking !== null && daysSinceBooking <= 1;

  const isApproachingDeparture = () => {
    if (!booking.departureDate || !booking.departureTime) return false;
    const departureDateTime = new Date(
      `${booking.departureDate} ${booking.departureTime}`
    );
    const currentDate = new Date();
    const timeDiff = departureDateTime - currentDate;
    return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000;
  };

  const approachingDeparture = isApproachingDeparture();

  const generateTicketPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const lineHeight = 10;
    let y = margin;

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 102, 204);
    doc.text("GoSync Bus Ticket", pageWidth / 2, y, { align: "center" });
    y += lineHeight * 1.5;

    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 102, 204);
    doc.line(margin, y, pageWidth - margin, y);
    y += lineHeight;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    const details = [
      `Booking ID: ${booking.bookingId}`,
      `Route: ${booking.from} to ${booking.to}`,
      `Seats: ${booking.seatNumbers.join(", ")}`,
      `Bus Number: ${booking.busNumber || "N/A"}`,
      `Booked On: ${
        booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "N/A"
      }`,
      `Status: ${booking.status}`,
      `Payment Status: ${booking.paymentStatus}`,
      `Total Fare: LKR ${booking.fareTotal || "N/A"}`,
    ];

    details.forEach((line) => {
      doc.text(line, margin, y);
      y += lineHeight;
    });

    y += lineHeight;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Thank you for choosing GoSync!", pageWidth / 2, y, {
      align: "center",
    });
    y += lineHeight;
    doc.text("Contact: support@gosync.com | www.gosync.com", pageWidth / 2, y, {
      align: "center",
    });

    doc.save(`GoSync_Ticket_${booking.bookingId}.pdf`);
  };

  const isValidQR = validationResult?.message?.toLowerCase().includes("valid");
  const canDownloadTicket =
    booking.status === "confirmed" &&
    booking.paymentStatus === "paid" &&
    isValidQR;

  return (
    <div
      className={`p-4 bg-white border rounded-lg shadow-md transition-shadow hover:shadow-lg ${
        isRecentBooking
          ? "border-green-300"
          : approachingDeparture
            ? "border-yellow-300"
            : "border-gray-200"
      }`}
    >
      <div
        className={`-mt-4 -mx-4 px-4 py-2 mb-3 text-sm font-medium ${
          booking.status === "confirmed" && booking.paymentStatus === "paid"
            ? "bg-green-100 text-green-800"
            : booking.status === "confirmed" &&
                booking.paymentStatus === "pending" &&
                !isPaymentExpired
              ? "bg-yellow-100 text-yellow-800"
              : booking.status === "cancelled" || isPaymentExpired
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
        } flex items-center justify-between`}
      >
        <div className="flex items-center">
          {booking.status === "confirmed" &&
          booking.paymentStatus === "paid" ? (
            <CheckCircle className="w-4 h-4 mr-2" />
          ) : booking.status === "confirmed" &&
            booking.paymentStatus === "pending" &&
            !isPaymentExpired ? (
            <AlertTriangle className="w-4 h-4 mr-2" />
          ) : booking.status === "cancelled" || isPaymentExpired ? (
            <XCircle className="w-4 h-4 mr-2" />
          ) : (
            <Info className="w-4 h-4 mr-2" />
          )}
          <span>
            {booking.status === "confirmed" && booking.paymentStatus === "paid"
              ? "Confirmed & Paid"
              : booking.status === "confirmed" &&
                  booking.paymentStatus === "pending" &&
                  !isPaymentExpired
                ? "Pending Payment"
                : booking.status === "cancelled"
                  ? "Cancelled"
                  : isPaymentExpired
                    ? "Payment Expired"
                    : booking.status}
          </span>
        </div>
        <div className="flex items-center">
          {extraComponent && <div className="mr-2">{extraComponent}</div>}
          {isRecentBooking && (
            <span className="px-2 py-0.5 bg-green-200 text-green-800 rounded-full text-xs">
              New
            </span>
          )}
          {approachingDeparture && (
            <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded-full text-xs">
              Departing Soon
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between">
        <div className="flex-grow">
          <div className="flex items-center mb-2">
            <p className="font-bold text-lg text-gray-800 mr-2">
              {booking.bookingId}
            </p>
            {booking.status === "confirmed" &&
              booking.paymentStatus === "paid" && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Active
                </span>
              )}
          </div>

          <div className="mb-3 flex items-center">
            <Bus className="w-4 h-4 text-gray-500 mr-1" />
            <span className="text-gray-600 font-medium mr-2">
              {booking.busNumber || "Bus"}:
            </span>
            <div className="flex items-center flex-wrap">
              <span className="font-medium text-gray-800">{booking.from}</span>
              <ArrowRight className="mx-1 w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-800">{booking.to}</span>
            </div>
          </div>

          <div className="mb-2 flex items-center text-sm">
            <Calendar className="w-4 h-4 text-gray-500 mr-1" />
            <span className="text-gray-600 mr-2">Date:</span>
            <span className="text-gray-800">
              {booking.departureDate || formatDate(booking.createdAt)}
            </span>

            {booking.departureTime && (
              <>
                <Clock className="w-4 h-4 text-gray-500 ml-3 mr-1" />
                <span className="text-gray-600 mr-2">Time:</span>
                <span className="text-gray-800">{booking.departureTime}</span>
              </>
            )}
          </div>

          <div className="mb-2">
            <p className="text-gray-600 text-sm mb-1">Seats:</p>
            <div className="flex flex-wrap gap-1">
              {booking.seatNumbers &&
                booking.seatNumbers.map((seat, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-sm font-medium"
                  >
                    {seat}
                  </span>
                ))}
            </div>
          </div>

          {booking.status === "confirmed" &&
            booking.paymentStatus === "pending" &&
            timeRemaining > 0 && (
              <div className="my-3 p-2 bg-yellow-50 border border-yellow-200 rounded flex items-center text-yellow-700 text-sm">
                <Clock size={16} className="mr-2 flex-shrink-0" />
                <span>
                  Payment due:{" "}
                  <strong>{formatTimeRemaining(timeRemaining)}</strong>{" "}
                  remaining
                  <br />
                  <span className="text-xs">
                    Seats will be released after 6 hours
                  </span>
                </span>
              </div>
            )}

          <p className="text-xs text-gray-500 mt-2">
            Booked on: {formatDate(booking.createdAt)}
            {daysSinceBooking !== null &&
              ` (${daysSinceBooking} ${
                daysSinceBooking === 1 ? "day" : "days"
              } ago)`}
          </p>
        </div>

        <div className="mt-4 sm:mt-0 sm:ml-4 flex flex-col items-end">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-right mb-3">
            <p className="text-gray-500 text-sm">Total Fare</p>
            <p className="text-2xl font-bold text-gray-800">
              <DollarSign className="inline w-5 h-5 mb-1 text-green-600" />
              LKR {booking.fareTotal || "0.00"}
            </p>

            {booking.discountAmount && (
              <div className="text-xs text-green-600 font-medium mt-1">
                Includes {booking.discountAmount} discount
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-2 sm:items-end">
            {booking.paymentStatus === "pending" && (
              <p className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100">
                <AlertTriangle className="inline w-3 h-3 mr-1" />
                Payment required
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
        {showPayButton &&
          booking.status === "confirmed" &&
          booking.paymentStatus === "pending" &&
          !isPaymentExpired && (
            <button
              onClick={() => onPay(booking)}
              className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              <CreditCard className="w-4 h-4 mr-1" />
              Pay Now
            </button>
          )}

        {isPaymentExpired &&
          booking.status === "confirmed" &&
          booking.paymentStatus === "pending" && (
            <div className="w-full p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
              <AlertTriangle className="inline-block w-3 h-3 mr-1" />
              Payment window expired. This booking is no longer valid.
            </div>
          )}

        <button
          onClick={handleOpenModal}
          className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition flex items-center justify-center"
        >
          <QrCode className="w-4 h-4 mr-2" /> View QR
        </button>
        {showCancelButton && booking.status === "confirmed" && (
          <>
            <button
              onClick={openSeatCancelModal}
              className="px-4 py-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition flex items-center justify-center"
            >
              <span className="mr-1">&#x2715;</span> Cancel Seats
            </button>
            <button
              onClick={() => onCancel(booking.bookingId)}
              className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition flex items-center justify-center"
            >
              Cancel All
            </button>
          </>
        )}
      </div>

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
              Scan this QR code to validate your ticket for {booking.from} to{" "}
              {booking.to}.
            </p>

            {booking.paymentStatus === "pending" && (
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 w-full">
                <p className="text-sm text-yellow-700 text-center">
                  Payment pending. Complete payment to activate your QR code.
                </p>
                <div className="flex justify-center mt-2">
                  <button
                    onClick={() => {
                      handleCloseModal();
                      onPay && onPay();
                    }}
                    className="px-4 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition flex items-center"
                  >
                    <CreditCard className="w-3 h-3 mr-1" /> Pay Now
                  </button>
                </div>
              </div>
            )}

            {booking.status === "confirmed" &&
              booking.paymentStatus === "paid" &&
              !isValidQR && (
                <button
                  onClick={validateQRCode}
                  disabled={isValidating}
                  className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                    isValidating
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  } flex items-center space-x-2`}
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
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
                <Download className="w-4 h-4 mr-2" />
                <span>Download Ticket</span>
              </button>
            )}

            {validationResult && (
              <div
                className={`flex items-center space-x-2 p-3 rounded-lg w-full ${
                  isValidQR
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {isValidQR ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <p className="text-sm font-medium">
                  {validationResult.message}
                </p>
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

      <Dialog
        open={isSeatCancelModalOpen}
        onClose={closeSeatCancelModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Cancel Individual Seats</DialogTitle>
        <DialogContent>
          <div className="py-2">
            <p className="text-gray-700 mb-4">
              Select the seats you want to cancel from booking{" "}
              {booking.bookingId}:
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 my-4">
              {processedSeats.map((seat) => {
                const seatId = seat._id;
                return (
                  <button
                    key={seatId}
                    onClick={() => toggleSeatSelection(seatId, seat.seatNumber)}
                    className={`p-4 rounded-lg flex flex-col items-center justify-center transition-all duration-200
                    ${
                      selectedSeats.includes(seatId)
                        ? "bg-red-100 border-2 border-red-400 text-red-700 shadow-md"
                        : "bg-gray-100 hover:bg-gray-200 border border-gray-300"
                    }`}
                  >
                    {selectedSeats.includes(seatId) && (
                      <Check className="h-5 w-5 mb-1 text-red-600" />
                    )}
                    <span className="font-bold text-lg">{seat.seatNumber}</span>
                  </button>
                );
              })}
            </div>
            {processedSeats.length === 0 && (
              <p className="text-gray-500 text-center">
                No seats available in this booking
              </p>
            )}
            <div className="mt-6 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Cancelling individual seats may affect
                your fare refund. If you want to cancel all seats, please use
                the "Cancel All" button instead.
              </p>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <button
            onClick={closeSeatCancelModal}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCancelSelectedSeats}
            disabled={selectedSeats.length === 0 || isCancellingSeat}
            className={`px-4 py-2 rounded-lg text-white transition ${
              selectedSeats.length === 0 || isCancellingSeat
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {isCancellingSeat ? (
              <div className="flex items-center">
                <Loader2 className="animate-spin h-4 w-4 mr-1" />
                <span>Cancelling...</span>
              </div>
            ) : (
              `Cancel ${selectedSeats.length} Seat(s)`
            )}
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default BookingCard;
