import React, { useState, useEffect } from "react";
import { Bus } from "lucide-react";
import "../styles/PassengerHomepage.css";
import Navbar1 from "../components/Navbar1";
import { useNavigate } from "react-router-dom";
import Footer1 from "../components/Footer1";
import BookingForm from "../components/BookingForm";
import useStopStore from "../store/stopStore.js";
import useBookingStore from "../store/bookingStore.js";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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

  // Popular routes data
  const popularRoutes = [
    {
      id: 1,
      name: "Colombo - Kandy",
      description: "Daily Express & Luxury Services",
      duration: "3-4 hours",
      frequency: "Every 15-30 mins"
    },
    {
      id: 2,
      name: "Colombo - Galle",
      description: "Southern Expressway Routes",
      duration: "1.5-2 hours",
      frequency: "Every 20-40 mins"
    },
    {
      id: 3,
      name: "Colombo - Jaffna",
      description: "A/C & Non-A/C Services",
      duration: "8-10 hours",
      frequency: "Hourly"
    },
    {
      id: 4,
      name: "Kandy - Nuwara Eliya",
      description: "Hill Country Express",
      duration: "2-3 hours",
      frequency: "Every 30-60 mins"
    }
  ];

  // Promotions data
  const promotions = [
    {
      id: 1,
      title: "Early Bird Special",
      description: "Book before 9 AM and get 15% off",
      code: "EARLY15",
      validUntil: "2023-12-31"
    },
    {
      id: 2,
      title: "Weekend Getaway",
      description: "20% discount on all weekend travels",
      code: "WEEKEND20",
      validUntil: "2023-12-31"
    },
    {
      id: 3,
      title: "Student Discount",
      description: "25% off for students with valid ID",
      code: "STUDENT25",
      validUntil: "2024-06-30"
    },
    {
      id: 4,
      title: "Family Package",
      description: "Buy 3 tickets, get 1 free",
      code: "FAMILY4",
      validUntil: "2024-03-31"
    }
  ];

  // Partners data
  const partners = [
    { id: 1, name: "SLTB", logo: "/logos/sltb.png" },
    { id: 2, name: "Private Bus Association", logo: "/logos/pba.png" },
    { id: 3, name: "Intercity Express", logo: "/logos/intercity.png" },
    { id: 4, name: "Lanka Ashok Leyland", logo: "/logos/lal.png" },
    { id: 5, name: "Tourism Board", logo: "/logos/tourism-board.png" }
  ];

  return (
    <div className="passenger-homepage">
      <Navbar1 />
      
      <div className="main-content">
        <BookingForm isVisible={true} />
        
        {/* Map Section with Cards */}
        <section className="map-section">
          <div className="map-background">
            <MapContainer 
              center={[7.8731, 80.7718]} // Center of Sri Lanka
              zoom={8} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              dragging={false}
              doubleClickZoom={false}
              scrollWheelZoom={false}
              touchZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                opacity={0.5}
              />
            </MapContainer>
          </div>
          
          
            {/* Popular Routes Cards */}
            <div className="cards-container">
              <h2 className="section-title">Popular Bus Routes</h2>
              <div className="cards-grid">
                {popularRoutes.map(route => (
                  <div key={route.id} className="card">
                    <h3>{route.name}</h3>
                    <p>{route.description}</p>
                    <div className="card-details">
                      <span>⏱️ {route.duration}</span>
                      <span>🔄 {route.frequency}</span>
                    </div>
                    <button className="card-button">View Schedule</button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Promotions Cards */}
            <div className="cards-container">
              <h2 className="section-title">Promotions & Discounts</h2>
              <div className="cards-grid">
                {promotions.map(promo => (
                  <div key={promo.id} className="card promo-card">
                    <div className="promo-badge">HOT DEAL</div>
                    <h3>{promo.title}</h3>
                    <p>{promo.description}</p>
                    <div className="promo-code">
                      <span>Use code: </span>
                      <strong>{promo.code}</strong>
                    </div>
                    <div className="promo-valid">Valid until: {promo.validUntil}</div>
                    <button className="card-button">Claim Offer</button>
                  </div>
                ))}
              </div>
            </div>
          
        </section>
        
        {/* Partners Section */}
        <section className="partners-section">
          <h2 className="section-title">Our Trusted Partners</h2>
          <div className="partners-grid">
            {partners.map(partner => (
              <div key={partner.id} className="partner-logo">
                <img 
                  src={partner.logo} 
                  alt={partner.name} 
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "/logos/default-partner.png";
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
      
      <Footer1 />
    </div>
  );
};

export default PassengerHomepage;