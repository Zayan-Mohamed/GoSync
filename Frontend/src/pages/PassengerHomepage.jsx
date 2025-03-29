import React, { useState, useEffect } from "react";
import { Bus } from "lucide-react";
import "../styles/PassengerHomepage.css";
import Navbar1 from "../components/Navbar1";
import { useNavigate } from "react-router-dom";
import Footer1 from "../components/Footer1";
import useStopStore from "../store/stopStore.js";

const PassengerHomepage = () => {
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [journeyDate, setJourneyDate] = useState("");
  const navigate = useNavigate();

  const { stops, loading, error, fetchStops } = useStopStore();

  useEffect(() => {
    fetchStops();
  }, [fetchStops]);

  const findBuses = () => {
    if (!fromLocation || !toLocation) {
      alert("Please select both from and to locations");
      return;
    }

    navigate("/bus-search-results", {
      state: {
        fromLocation,
        toLocation,
        journeyDate,
      },
    });
  };

  const locations =
    loading || error
      ? []
      : stops
          ?.filter((stop) => stop.status === "active")
          .map((stop) => stop.stopName)
          .sort();

  return (
    <div className="passenger-homepage">
      <Navbar1 />
     {/* <div className="map-container"> 
        <LoadScript googleMapsApiKey={import.meta.env.VITE_API_GOOGLE_MAPS_KEY}>
          <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={7} />
        </LoadScript>
      </div> 
      */}

      <div className="main-content">
        <div className="booking-container">
          <div className="booking-form">
            <div className="input-with-icon">
              <Bus className="input-icon" />
              <input
                type="text"
                list="fromLocations"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                placeholder="From"
                required
                disabled={loading}
              />
              <datalist id="fromLocations">
                {locations?.map((location) => (
                  <option key={location} value={location} />
                ))}
              </datalist>
            </div>

            <div className="input-with-icon">
              <Bus className="input-icon" />
              <input
                type="text"
                list="toLocations"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                placeholder="To"
                required
                disabled={loading}
              />
              <datalist id="toLocations">
                {locations?.map((location) => (
                  <option key={location} value={location} />
                ))}
              </datalist>
            </div>

            <input
              type="date"
              value={journeyDate}
              onChange={(e) => setJourneyDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              required
              placeholder="Journey Date"
            />

            <button
              onClick={findBuses}
              disabled={loading || !fromLocation || !toLocation}
            >
              {loading ? "Loading Stops..." : "Find Buses"}
            </button>

            {error && (
              <div className="error-message">
                Failed to load available stops. Please try again later.
              </div>
            )}
          </div>
        </div>

        <div className="popular-routes-section">
          <h2>Popular Bus Routes in Sri Lanka</h2>
          <div className="routes-grid">
            <div className="route-card">
              <h3>Colombo - Kandy</h3>
              <p>Daily Express & Luxury Services</p>
              <button>View Schedule</button>
            </div>
            <div className="route-card">
              <h3>Colombo - Galle</h3>
              <p>Southern Expressway Routes</p>
              <button>View Schedule</button>
            </div>
            <div className="route-card">
              <h3>Colombo - Jaffna</h3>
              <p>A/C & Non-A/C Services</p>
              <button>View Schedule</button>
            </div>
            <div className="route-card">
              <h3>Kandy - Nuwara Eliya</h3>
              <p>Hill Country Express</p>
              <button>View Schedule</button>
            </div>
          </div>
        </div>

        <div className="top-routes">
          <h2>Most Searched Routes</h2>
          <ul>
            <li>Colombo - Kandy</li>
            <li>Colombo - Jaffna</li>
            <li>Galle - Colombo</li>
            <li>Negombo - Colombo</li>
            <li>Kandy - Nuwara Eliya</li>
            <li>Colombo - Galle</li>
          </ul>
        </div>
      </div>
      <Footer1 />
    </div>
  );
};

export default PassengerHomepage;
