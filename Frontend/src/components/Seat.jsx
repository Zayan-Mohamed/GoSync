import React from "react";
import styles from "../styles/Seat.module.css";
import { MdEventSeat } from "react-icons/md";
import { BsX } from "react-icons/bs";

const Seat = ({ seat, onSelect }) => {
  return (
    <div
      className={`${styles.seat} ${seat.isSelected ? styles.selected : ""} ${!seat.isAvailable ? styles.unavailable : ""}`}
      onClick={seat.isAvailable ? onSelect : null}
    >
      {seat.isAvailable ? <MdEventSeat /> : <BsX />}
    </div>
  );
};

export default Seat;
