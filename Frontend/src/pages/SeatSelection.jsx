import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Seat from "../components/Seat";
import styles from "../styles/SeatSelection.module.css";

const SeatSelection = () => {
  const navigate = useNavigate();

  // Create a 4x12 seat grid
  const initialSeats = Array.from({ length: 4 }, (_, row) =>
    Array.from({ length: 12 }, (_, col) => ({
      id: `${row}-${col}`,
      row,
      col,
      isAvailable: Math.random() > 0.2, // Randomly disable some seats
      isSelected: false,
    }))
  );

  const [seats, setSeats] = useState(initialSeats);
  const [selectedSeats, setSelectedSeats] = useState([]);

  const handleSelectSeat = (row, col) => {
    const updatedSeats = seats.map((seatRow, rIdx) =>
      seatRow.map((seat, cIdx) => {
        if (rIdx === row && cIdx === col && seat.isAvailable) {
          return { ...seat, isSelected: !seat.isSelected };
        }
        return seat;
      })
    );

    setSeats(updatedSeats);
    const selected = updatedSeats
      .flat()
      .filter((seat) => seat.isSelected)
      .map((seat) => seat.id);
    setSelectedSeats(selected);
  };

  const handleProceed = () => {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }
    navigate("/booking/confirm", { state: { selectedSeats } });
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Select Your Seat</h2>

      <div className={styles.busContainer}>
        {/* 🚍 Bus Front (Left Side) */}
        <div className={styles.busFront}>
          <div className={styles.window}>Front</div>
          <div className={styles.wheel}></div>
        </div>

        {/* 🎟️ Seat Layout */}
        <div className={styles.bus}>
          {seats.map((row, rowIndex) => (
            <div key={rowIndex} className={styles.row}>
              {row.map((seat, colIndex) => (
                <Seat
                  key={seat.id}
                  seat={seat}
                  onSelect={() => handleSelectSeat(rowIndex, colIndex)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* 🚍 Bus Rear (Right Side) */}
        <div className={styles.busRear}>
          <div className={styles.wheel}></div>
          <div className={styles.window}>Rear</div>
        </div>
      </div>

      <p className={styles.summary}>
        Selected Seats: {selectedSeats.join(", ") || "None"}
      </p>
      <button onClick={handleProceed} className={styles.proceedButton}>
        Proceed to Booking
      </button>
    </div>
  );
};

export default SeatSelection;
