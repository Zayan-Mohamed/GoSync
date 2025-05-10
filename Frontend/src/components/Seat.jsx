import React from "react";
import styles from "../styles/Seat.module.css";
import { MdEventSeat } from "react-icons/md";
import { BsX } from "react-icons/bs";

const Seat = ({ seat, onSelect }) => {
  const isBooked = !seat.isAvailable;

  return (
    <div
      className={`${styles.seat} ${seat.isSelected ? styles.selected : ""} 
                 ${isBooked ? styles.unavailable : ""} 
                 ${seat.isDisabled ? styles.disabled : ""}`}
      onClick={isBooked || seat.isDisabled ? null : onSelect}
      title={
        seat.isDisabled ? `${seat.seatNumber} (Unavailable)` : seat.seatNumber
      }
    >
      {isBooked ? <BsX /> : <MdEventSeat />}
    </div>
  );
};

export default Seat;
