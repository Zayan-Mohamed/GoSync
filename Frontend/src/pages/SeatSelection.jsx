import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import useAuthStore from "../store/authStore";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import Navbar1 from "../components/Navbar1";
import Footer1 from "../components/Footer1";
import Loader from "../components/Loader";
import { FiUser } from "react-icons/fi";
import { Bus, Info } from "lucide-react";
import styles from "../styles/SeatSelection.module.css";

const SeatSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { busId, scheduleId, fromLocation, toLocation, journeyDate } =
    location.state || {};
  const { user, isAuthenticated } = useAuthStore();
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  const API_URI = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.log("SeatSelection redirect to login:", {
        isAuthenticated,
        user,
      });
      navigate("/login");
      return;
    }

    const fetchSeats = async () => {
      try {
        const response = await axios.get(
          `${API_URI}/api/seats/${busId}/schedule/${scheduleId}/seats`,
          { withCredentials: true }
        );
        console.log("Fetched seats:", response.data);
        const sortedSeats = response.data.sort((a, b) =>
          a.seatNumber.localeCompare(b.seatNumber)
        );
        setSeats(sortedSeats);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching seats");
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();

    const newSocket = io(`${API_URI}`, { withCredentials: true });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      newSocket.emit("joinTrip", { busId, scheduleId });
    });

    newSocket.on("seatUpdate", (data) => {
      console.log("Received seatUpdate:", data);
      if (data.seats && Array.isArray(data.seats)) {
        const sortedSeats = data.seats.sort((a, b) =>
          a.seatNumber.localeCompare(b.seatNumber)
        );
        setSeats(sortedSeats);

        setSelectedSeats((prev) =>
          prev.filter((seatNum) =>
            sortedSeats.some(
              (s) =>
                s.seatNumber === seatNum &&
                !s.isBooked &&
                !s.isDisabled &&
                (!s.reservedUntil || new Date(s.reservedUntil) <= new Date())
            )
          )
        );
      } else if (data.availableSeats !== undefined) {
        fetchSeats();
      }
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    return () => {
      newSocket.disconnect();
      console.log("Socket disconnected");
    };
  }, [busId, scheduleId, navigate, isAuthenticated, user, API_URI]);

  const handleSeatClick = (seat) => {
    if (
      seat.isBooked ||
      seat.isDisabled ||
      (seat.reservedUntil && new Date(seat.reservedUntil) > new Date())
    ) {
      toast.error(`Seat ${seat.seatNumber} is unavailable`);
      return;
    }

    setSelectedSeats((prev) =>
      prev.includes(seat.seatNumber)
        ? prev.filter((num) => num !== seat.seatNumber)
        : [...prev, seat.seatNumber]
    );
  };

  const handleReserveSeats = async () => {
    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URI}/api/seats/${busId}/schedule/${scheduleId}/reserve`,
        { seatNumbers: selectedSeats },
        { withCredentials: true }
      );
      console.log("Seats reserved:", response.data);
      toast.success("Seats reserved for 15 minutes!");
    } catch (err) {
      console.error("Reserve error:", err.response?.data);
      toast.error(err.response?.data?.message || "Error reserving seats");
    }
  };

  const handleConfirmBooking = async () => {
    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat");
      return;
    }

    try {
      const selectedSeatsToReserve = selectedSeats.filter((seatNumber) => {
        const seatObj = seats.find((s) => s.seatNumber === seatNumber);
        return !(
          seatObj &&
          seatObj.reservedUntil &&
          new Date(seatObj.reservedUntil) > new Date()
        );
      });

      if (selectedSeatsToReserve.length > 0) {
        await axios.post(
          `${API_URI}/api/seats/${busId}/schedule/${scheduleId}/reserve`,
          { seatNumbers: selectedSeatsToReserve },
          { withCredentials: true }
        );
        console.log("Additional seats reserved:", selectedSeatsToReserve);
      }

      const response = await axios.post(
        `${API_URI}/api/bookings/confirm`,
        { busId, scheduleId, seatNumbers: selectedSeats },
        { withCredentials: true }
      );
      console.log("Booking response:", response.data);
      toast.success("Seats reserved! Proceeding to payment.");

      navigate("/payment", {
        state: {
          busId,
          scheduleId,
          selectedSeats,
          bookingSummary: response.data.summary,
        },
      });
    } catch (err) {
      console.error("Booking error:", err.response?.data);
      toast.error(err.response?.data?.message || "Failed to reserve seats");
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const isLargeBus = seats.length > 48;

  const renderBusLayout = () => {
    const totalSeats = seats.length;
    const isLargeBus = totalSeats > 48;
    const leftSideSeats = 2;
    const rightSideSeats = isLargeBus ? 3 : 2;
    const seatsPerRow = leftSideSeats + rightSideSeats;
    const totalRows = Math.ceil(totalSeats / seatsPerRow);
    const rows = [];

    const sortedSeats = [...seats].sort((a, b) => {
      const numA = parseInt(a.seatNumber.replace(/\D/g, ""));
      const numB = parseInt(b.seatNumber.replace(/\D/g, ""));
      return numA - numB;
    });

    rows.push(
      <div
        key="front-section"
        className="relative mb-8 border-b border-gray-300 pb-4"
      >
        <div className="relative mb-3">
          <div
            className="h-6 mx-auto rounded-t-3xl"
            style={{
              background: "linear-gradient(to bottom, #bae6fd, #7dd3fc)",
              width: isLargeBus ? "85%" : "75%",
              border: "1px solid #93c5fd",
            }}
          ></div>
        </div>
        <div className="flex justify-between items-center px-4">
          <div className="h-14 w-8 border-2 border-indigo-500 bg-indigo-100 rounded-lg flex items-center justify-center">
            <span className="text-xs font-semibold text-indigo-600 rotate-90">
              EXIT
            </span>
          </div>
          <div className="flex flex-col items-center">
            <div className="mb-2 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-gray-300 border-2 border-gray-400 flex items-center justify-center p-1">
                <div className="w-12 h-12 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">WHEEL</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-200 rounded-lg p-2 w-24 text-center text-xs font-medium">
              DRIVER
            </div>
          </div>
          <div className="w-8"></div>
        </div>
      </div>
    );

    const renderRow = (
      row,
      rowSeats,
      isLastRow,
      isSecondToLastRow,
      lastRowHasOneSeat
    ) => {
      const shouldHaveAisle =
        !isLastRow && !(isSecondToLastRow && lastRowHasOneSeat && isLargeBus);

      let leftSide;
      let rightSide;

      if (shouldHaveAisle) {
        leftSide = rowSeats.slice(0, leftSideSeats);
        rightSide = rowSeats.slice(leftSideSeats);
      }

      return (
        <div
          key={`row-${row}`}
          className={`flex justify-center items-center mb-4 ${
            isLastRow ? "justify-start pl-4" : ""
          }`}
        >
          {row === 0 && (
            <div className="absolute -left-6 h-full flex items-center">
              <div className="bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center">
                <span className="text-xs font-bold">F</span>
              </div>
            </div>
          )}
          {row === Math.floor(totalRows / 2) && (
            <div className="absolute -left-6 h-full flex items-center">
              <div className="bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center">
                <span className="text-xs font-bold">M</span>
              </div>
            </div>
          )}
          {row === totalRows - 1 && (
            <div className="absolute -left-6 h-full flex items-center">
              <div className="bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center">
                <span className="text-xs font-bold">B</span>
              </div>
            </div>
          )}

          {shouldHaveAisle ? (
            <>
              <div className="flex space-x-2">
                {leftSide.map(
                  (seat, index) =>
                    seat && (
                      <motion.div
                        key={`seat-left-${row}-${index}-${seat.seatNumber || seat._id || index}`}
                        className={`w-12 h-12 flex items-center justify-center rounded-lg border-2 relative ${
                          seat.isBooked
                            ? "bg-red-500 text-white border-red-600 cursor-not-allowed"
                            : seat.isDisabled
                              ? "bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed"
                              : seat.reservedUntil &&
                                  new Date(seat.reservedUntil) > new Date()
                                ? "bg-gray-400 text-white border-gray-500 cursor-not-allowed"
                                : selectedSeats.includes(seat.seatNumber)
                                  ? "bg-brightYellow text-darkCharcoal border-amber-500 cursor-pointer"
                                  : "bg-green-100 text-gray-700 border-green-300 hover:bg-green-200 cursor-pointer"
                        }`}
                        onClick={() => handleSeatClick(seat)}
                        whileHover={
                          !seat.isBooked &&
                          !seat.isDisabled &&
                          (!seat.reservedUntil ||
                            new Date(seat.reservedUntil) <= new Date())
                            ? { scale: 1.05 }
                            : {}
                        }
                        whileTap={
                          !seat.isBooked &&
                          !seat.isDisabled &&
                          (!seat.reservedUntil ||
                            new Date(seat.reservedUntil) <= new Date())
                            ? { scale: 0.95 }
                            : {}
                        }
                        title={`${seat.seatNumber}${
                          seat.isDisabled ? " (Unavailable)" : ""
                        }`}
                      >
                        <FiUser size={16} />
                        <span className="absolute text-[9px] bottom-1 font-medium">
                          {seat.seatNumber.replace(/^S0?/, "")}
                        </span>
                      </motion.div>
                    )
                )}
                {leftSide.length < leftSideSeats &&
                  Array(leftSideSeats - leftSide.length)
                    .fill(null)
                    .map((_, idx) => (
                      <div
                        key={`empty-left-${row}-${idx}`}
                        className="w-12 h-12"
                      />
                    ))}
              </div>

              <div className="w-8 mx-2 h-12 flex items-center justify-center">
                <div className="h-full w-full bg-gray-100 rounded flex items-center justify-center">
                  {row === Math.floor(totalRows / 2) && (
                    <div className="text-xs text-gray-400 -rotate-90 whitespace-nowrap">
                      AISLE
                    </div>
                  )}
                  {row !== Math.floor(totalRows / 2) && (
                    <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                      <div className="w-full h-1/3 border-t border-b border-dashed border-gray-300"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                {rightSide.map(
                  (seat, index) =>
                    seat && (
                      <motion.div
                        key={`seat-right-${row}-${index}-${seat.seatNumber || seat._id || index}`}
                        className={`w-12 h-12 flex items-center justify-center rounded-lg border-2 relative ${
                          seat.isBooked
                            ? "bg-red-500 text-white border-red-600 cursor-not-allowed"
                            : seat.isDisabled
                              ? "bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed"
                              : seat.reservedUntil &&
                                  new Date(seat.reservedUntil) > new Date()
                                ? "bg-gray-400 text-white border-gray-500 cursor-not-allowed"
                                : selectedSeats.includes(seat.seatNumber)
                                  ? "bg-brightYellow text-darkCharcoal border-amber-500 cursor-pointer"
                                  : "bg-green-100 text-gray-700 border-green-300 hover:bg-green-200 cursor-pointer"
                        }`}
                        onClick={() => handleSeatClick(seat)}
                        whileHover={
                          !seat.isBooked &&
                          !seat.isDisabled &&
                          (!seat.reservedUntil ||
                            new Date(seat.reservedUntil) <= new Date())
                            ? { scale: 1.05 }
                            : {}
                        }
                        whileTap={
                          !seat.isBooked &&
                          !seat.isDisabled &&
                          (!seat.reservedUntil ||
                            new Date(seat.reservedUntil) <= new Date())
                            ? { scale: 0.95 }
                            : {}
                        }
                        title={`${seat.seatNumber}${
                          seat.isDisabled ? " (Unavailable)" : ""
                        }`}
                      >
                        <FiUser size={16} />
                        <span className="absolute text-[9px] bottom-1 font-medium">
                          {seat.seatNumber.replace(/^S0?/, "")}
                        </span>
                      </motion.div>
                    )
                )}
                {rightSide.length < rightSideSeats &&
                  Array(rightSideSeats - rightSide.length)
                    .fill(null)
                    .map((_, idx) => (
                      <div
                        key={`empty-right-${row}-${idx}`}
                        className="w-12 h-12"
                      />
                    ))}
              </div>
            </>
          ) : (
            <div className="flex space-x-2">
              {rowSeats.map(
                (seat) =>
                  seat && (
                    <motion.div
                      key={`seat-${seat._id || seat.seatNumber}`}
                      className={`w-12 h-12 flex items-center justify-center rounded-lg border-2 relative ${
                        seat.isBooked
                          ? "bg-red-500 text-white border-red-600 cursor-not-allowed"
                          : seat.isDisabled
                            ? "bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed"
                            : seat.reservedUntil &&
                                new Date(seat.reservedUntil) > new Date()
                              ? "bg-gray-400 text-white border-gray-500 cursor-not-allowed"
                              : selectedSeats.includes(seat.seatNumber)
                                ? "bg-brightYellow text-darkCharcoal border-amber-500 cursor-pointer"
                                : "bg-green-100 text-gray-700 border-green-300 hover:bg-green-200 cursor-pointer"
                      }`}
                      onClick={() => handleSeatClick(seat)}
                      whileHover={
                        !seat.isBooked &&
                        !seat.isDisabled &&
                        (!seat.reservedUntil ||
                          new Date(seat.reservedUntil) <= new Date())
                          ? { scale: 1.05 }
                          : {}
                      }
                      whileTap={
                        !seat.isBooked &&
                        !seat.isDisabled &&
                        (!seat.reservedUntil ||
                          new Date(seat.reservedUntil) <= new Date())
                          ? { scale: 0.95 }
                          : {}
                      }
                      title={`${seat.seatNumber}${
                        seat.isDisabled ? " (Unavailable)" : ""
                      }`}
                    >
                      <FiUser size={16} />
                      <span className="absolute text-[9px] bottom-1 font-medium">
                        {seat.seatNumber.replace(/^S0?/, "")}
                      </span>
                    </motion.div>
                  )
              )}
            </div>
          )}
        </div>
      );
    };

    for (let row = 0; row < totalRows; row++) {
      const startIdx = row * seatsPerRow;
      let rowSeats;

      const totalRemainingSeats =
        sortedSeats.length - (totalRows - 1) * seatsPerRow;
      const lastRowHasOneSeat = totalRemainingSeats === 1;
      const isSecondToLastRow = row === totalRows - 2;
      const isLastRow = row === totalRows - 1;

      if (isSecondToLastRow && lastRowHasOneSeat && isLargeBus) {
        rowSeats = sortedSeats.slice(startIdx, startIdx + seatsPerRow + 1);
      } else if (isLastRow && lastRowHasOneSeat && isLargeBus) {
        continue;
      } else if (isSecondToLastRow && lastRowHasOneSeat) {
        rowSeats = sortedSeats.slice(startIdx, startIdx + 5);
      } else if (isLastRow) {
        rowSeats = sortedSeats.slice(startIdx);
      } else {
        rowSeats = sortedSeats.slice(startIdx, startIdx + seatsPerRow);
      }

      if (rowSeats.length === 0) break;

      rows.push(
        renderRow(
          row,
          rowSeats,
          isLastRow,
          isSecondToLastRow,
          lastRowHasOneSeat
        )
      );
    }

    rows.push(
      <div key="back-section" className="border-t border-gray-300 pt-4 mt-2">
        <div className="flex justify-between items-center px-4">
          <div className="h-20 w-8 border-2 border-green-500 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-xs font-semibold text-green-600 rotate-90">
              ENTRANCE
            </span>
          </div>
          <div className="text-center text-xs text-gray-500 font-medium pb-2">
            BACK OF BUS
          </div>
          <div className="w-8"></div>
        </div>
      </div>
    );

    return (
      <div className="relative">
        <div
          className={
            styles["bus-frame"] +
            " rounded-t-3xl rounded-b-xl p-6 bg-white border-2 border-gray-300 shadow-lg relative"
          }
        >
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="h-full w-full rounded-t-3xl rounded-b-xl"
              style={{
                borderTop: "6px solid #e5e7eb",
                borderRight: "6px solid #e5e7eb",
                borderBottom: "6px solid #e5e7eb",
                borderLeft: "6px solid #e5e7eb",
              }}
            ></div>
          </div>
          {rows}
        </div>
        <div className="flex justify-center mt-4 text-xs text-gray-500">
          <div className="mr-4 flex items-center">
            <span className="font-bold">F</span>
            <span className="ml-1">Front</span>
          </div>
          <div className="mr-4 flex items-center">
            <span className="font-bold">M</span>
            <span className="ml-1">Middle</span>
          </div>
          <div className="flex items-center">
            <span className="font-bold">B</span>
            <span className="ml-1">Back</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-700">{error}</h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 bg-deepOrange text-white px-6 py-2 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar1 />
      <div className="bg-deepOrange text-white py-3">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center px-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold">{fromLocation}</h1>
            <span className="text-xl">⟫</span>
            <h1 className="text-xl font-bold">{toLocation}</h1>
          </div>
          <div className="flex items-center space-x-3 mt-2 sm:mt-0">
            <span>{formatDate(journeyDate)}</span>
            <button
              onClick={() => navigate(-1)}
              className="bg-brightYellow text-darkCharcoal px-3 py-1 rounded text-sm hover:bg-lightYellow"
            >
              Back
            </button>
          </div>
        </div>
      </div>
      <div className="container mx-auto py-6 px-4">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Bus className="mr-2" /> Select Your Seats
        </h2>
        <div className="mb-4">
          <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center text-sm">
            <Info size={16} className="text-blue-500 mr-2" />
            <span>
              {isLargeBus
                ? "2x3 seating arrangement (large bus)"
                : "2x2 seating arrangement (standard bus)"}{" "}
              - Total seats: {seats.length}
            </span>
          </div>
        </div>
        <div className="max-w-3xl mx-auto">
          {renderBusLayout()}
          <div className="flex justify-center flex-wrap space-x-2 space-y-2 mt-6">
            <div className="flex items-center m-1">
              <div className="w-4 h-4 bg-green-100 mr-2"></div>
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center m-1">
              <div className="w-4 h-4 bg-brightYellow mr-2"></div>
              <span className="text-sm">Selected</span>
            </div>
            <div className="flex items-center m-1">
              <div className="w-4 h-4 bg-gray-400 mr-2"></div>
              <span className="text-sm">Reserved</span>
            </div>
            <div className="flex items-center m-1">
              <div className="w-4 h-4 bg-red-500 mr-2"></div>
              <span className="text-sm">Booked</span>
            </div>
            <div className="flex items-center m-1">
              <div className="w-4 h-4 bg-gray-300 mr-2"></div>
              <span className="text-sm">Unavailable</span>
            </div>
          </div>
          <div className="flex justify-center space-x-4 mt-6">
            <button
              onClick={handleReserveSeats}
              className="bg-deepOrange text-white px-6 py-2 rounded hover:bg-red-700"
            >
              Reserve Seats
            </button>
            <button
              onClick={handleConfirmBooking}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              Confirm Booking
            </button>
          </div>
          {selectedSeats.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p className="text-blue-800">
                Selected Seats: {selectedSeats.join(", ")} (
                {selectedSeats.length})
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer1 />
    </div>
  );
};

export default SeatSelection;
