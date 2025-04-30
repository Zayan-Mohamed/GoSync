import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import Navbar1 from "../components/Navbar1";
import Footer1 from "../components/Footer1";
import GoSyncLoader from "../components/Loader";
import { Download, XCircle } from "lucide-react";

const TicketDownload = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [ticketDetails, setTicketDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const bookingId = params.get("bookingId");
        const signature = params.get("signature");

        if (!bookingId || !signature) {
          throw new Error("Missing bookingId or signature");
        }

        const response = await axios.get(
          `http://localhost:5000/api/bookings/verifyQRAndGetTicket`,
          {
            params: { bookingId, signature },
            withCredentials: true,
          }
        );

        console.log("Ticket details:", response.data);
        setTicketDetails(response.data.ticketDetails);
      } catch (err) {
        console.error("Error fetching ticket details:", err);
        setError(
          err.response?.data?.message || err.message || "Failed to load ticket"
        );
        toast.error(err.response?.data?.message || "Failed to load ticket");
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [location]);

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
      `Booking ID: ${ticketDetails.bookingId}`,
      `Route: ${ticketDetails.from} to ${ticketDetails.to}`,
      `Seats: ${ticketDetails.seatNumbers.join(", ")}`,
      `Bus Number: ${ticketDetails.busNumber}`,
      `Booked On: ${ticketDetails.createdAt ? new Date(ticketDetails.createdAt).toLocaleString() : "N/A"}`,
      `Status: ${ticketDetails.status}`,
      `Payment Status: ${ticketDetails.paymentStatus}`,
      `Total Fare: LKR ${ticketDetails.fareTotal}`,
    ];

    details.forEach((line) => {
      doc.text(line, margin, y);
      y += lineHeight;
    });

    // Footer
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

    // Save PDF
    doc.save(`GoSync_Ticket_${ticketDetails.bookingId}.pdf`);
  };

  if (loading) {
    return <GoSyncLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Navbar1 />
        <div className="container mx-auto py-8 px-4 flex-grow">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
        <Footer1 />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar1 />
      <div className="container mx-auto py-8 px-4 flex-grow">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Your Ticket</h2>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Booking Details
          </h3>
          <div className="space-y-3">
            <p>
              <strong>Booking ID:</strong> {ticketDetails.bookingId}
            </p>
            <p>
              <strong>Route:</strong> {ticketDetails.from} to {ticketDetails.to}
            </p>
            <p>
              <strong>Seats:</strong> {ticketDetails.seatNumbers.join(", ")}
            </p>
            <p>
              <strong>Bus Number:</strong> {ticketDetails.busNumber}
            </p>
            <p>
              <strong>Booked On:</strong>{" "}
              {ticketDetails.createdAt
                ? new Date(ticketDetails.createdAt).toLocaleString()
                : "N/A"}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className="text-green-600">{ticketDetails.status}</span>
            </p>
            <p>
              <strong>Payment Status:</strong>{" "}
              <span className="text-green-600">
                {ticketDetails.paymentStatus}
              </span>
            </p>
            <p>
              <strong>Total Fare:</strong> LKR {ticketDetails.fareTotal}
            </p>
          </div>
          <button
            onClick={generateTicketPDF}
            className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2 mx-auto"
          >
            <Download className="w-5 h-5" />
            <span>Download Ticket</span>
          </button>
        </div>
      </div>
      <Footer1 />
    </div>
  );
};

export default TicketDownload;
