import React, { useState } from "react";
import { Bus } from "lucide-react";
import useStopStore from "../store/stopStore";
import { useNavigate } from "react-router-dom";

const BookingForm = ({ isVisible }) => {
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [journeyDate, setJourneyDate] = useState("");

  const navigate = useNavigate();
  const { stops, loading, error, fetchStops } = useStopStore();

  React.useEffect(() => {
    fetchStops();
  }, [fetchStops]);

  const findBuses = () => {
    if (!fromLocation || !toLocation) {
      alert("Please select both from and to locations");
      return;
    }

    navigate("/bus-search-results", {
      state: { fromLocation, toLocation, journeyDate },
    });
  };

  const locations = loading || error ? [] : stops
    .filter((stop) => stop.status === "active")
    .map((stop) => stop.stopName)
    .sort();

  return (
    <div className={`booking-container ${isVisible ? "slide-down" : "slide-up"}`}>
      <div className="booking-form">
        <div className="input-with-icon">
          <Bus className="input-icon" />
          <input type="text" list="fromLocations" value={fromLocation}
            onChange={(e) => setFromLocation(e.target.value)} placeholder="From"
            required disabled={loading} />
          <datalist id="fromLocations">
            {locations.map((location) => <option key={location} value={location} />)}
          </datalist>
        </div>

        <div className="input-with-icon">
          <Bus className="input-icon" />
          <input type="text" list="toLocations" value={toLocation}
            onChange={(e) => setToLocation(e.target.value)} placeholder="To"
            required disabled={loading} />
          <datalist id="toLocations">
            {locations.map((location) => <option key={location} value={location} />)}
          </datalist>
        </div>

        <input type="date" value={journeyDate ? new Date(journeyDate).toISOString().split("T")[0] : ""}
          onChange={(e) => setJourneyDate(e.target.value)}
          min={new Date().toISOString().split("T")[0]} required placeholder="Journey Date" />

        <button onClick={findBuses} disabled={loading || !fromLocation || !toLocation}>
          {loading ? "Loading Stops..." : "Find Buses"}
        </button>

        {error && <div className="error-message">Failed to load available stops. Please try again later.</div>}
      </div>
    </div>
  );
};

export default BookingForm;
