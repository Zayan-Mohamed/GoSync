import React, { useState } from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";
import "../styles/PassengerHomepage.css";
import Navbar1 from "../components/Navbar1";

const mapContainerStyle = {
  width: "100vw",
  height: "100vh",
  position: "absolute",
  top: 0,
  left: 0,
  zIndex: -1,
  opacity: 0.4,
};

const center = {
  lat: 7.8731, // Sri Lanka's latitude
  lng: 80.7718, // Sri Lanka's longitude
};

const PassengerHomepage = () => {
  const [selectedRoute, setSelectedRoute] = useState("");
  const [journeyDate, setJourneyDate] = useState("");

  const findBuses = () => {
    console.log({ selectedRoute, journeyDate });
  };

const busRoutes = [
    "Colombo - Jaffna",
    "Kandy - Galle",
    "Gampaha - Anuradhapura",
    "Negombo - Badulla",
    "Matara - Batticaloa"
  ];

  return (
    <div className="passenger-homepage">
      <Navbar1 />
      <div className="map-container"> 
        <LoadScript googleMapsApiKey={import.meta.env.VITE_API_GOOGLE_MAPS_KEY}>
          <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={7} />
        </LoadScript>
      </div>

      <div className="main-content" >
        <div className="booking-container " >
          <div className="booking-form w-full   ">

            <select 
             id="busRoute"
             value={selectedRoute}
             onChange={(e) => setSelectedRoute(e.target.value)}
             className="route-dropdown"
            >
             <option value="">Select a route</option>
          {busRoutes.map((route, index) => (
            <option key={index} value={route}>
              {route}
            </option>
          ))}
            </select>
            
            
            
            <input 
              type="date" 
              value={journeyDate} 
              onChange={(e) => setJourneyDate(e.target.value)} 
              min={new Date().toISOString().split('T')[0]}
              required
              placeholder="Journey Date"
            />
            
            
            
            <button onClick={findBuses}>Find Buses</button>
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
            <div className="route-card">
              <h3>Colombo - Anuradhapura</h3>
              <p>Cultural Triangle Route</p>
              <button>View Schedule</button>
            </div>
            <div className="route-card">
              <h3>Colombo - Batticaloa</h3>
              <p>East Coast Express</p>
              <button>View Schedule</button>
            </div>
            <div className="route-card">
              <h3>Negombo - Colombo</h3>
              <p>Airport Transfer Route</p>
              <button>View Schedule</button>
            </div>
            <div className="route-card">
              <h3>Colombo - Trincomalee</h3>
              <p>Luxury Service Available</p>
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
            <li>Colombo - Anuradhapura</li>
            <li>Kurunegala - Colombo</li>
          </ul>
        </div>
      </div>

      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-section">
            <h3>About Us</h3>
            <p>Sri Lanka's premier online bus booking platform. Book your journey across the island with ease and convenience.</p>
          </div>
          
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#">Home</a></li>
              <li><a href="#">Bus Routes</a></li>
              <li><a href="#">My Bookings</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Bus Operators</h3>
            <ul>
              <li><a href="#">Sri Lanka Transport Board</a></li>
              <li><a href="#">Luxury Bus Services</a></li>
              <li><a href="#">Express Services</a></li>
              <li><a href="#">Register as Operator</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Contact Us</h3>
            <p>Email: support@busbooking.lk</p>
            <p>Phone: +94 11 234 5678</p>
            <p>Office Hours: 8am - 8pm (Daily)</p>
            <div className="social-icons">
              <a href="#" className="social-icon">FB</a>
              <a href="#" className="social-icon">IG</a>
              <a href="#" className="social-icon">TW</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Bus Booking System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PassengerHomepage;