import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/PassengerHomepage.css";
import Navbar1 from "../components/Navbar1";
import Footer1 from "../components/Footer1";
import BookingForm from "../components/BookingForm";
import useStopStore from "../store/stopStore.js";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const PassengerHomepage = () => {
  const [promotionsAndDiscounts, setPromotionsAndDiscounts] = useState([]);
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const { fetchStops } = useStopStore();

  const API_URI = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchStops();
  }, [fetchStops]);

  useEffect(() => {
    const fetchPromotionsAndDiscounts = async () => {
      try {
        const response = await axios.get(`${API_URI}/api/notifications`);
        const filteredNotifications = response.data
          .filter(
            (notif) =>
              (notif.type === "promotions" || notif.type === "discounts") &&
              (!notif.expiredAt || new Date(notif.expiredAt) > new Date())
          );
        setPromotionsAndDiscounts(filteredNotifications);
        console.log(filteredNotifications); // Check if data is fetched correctly
      } catch (error) {
        console.error("Error fetching promotions:", error);
      }
    };

    fetchPromotionsAndDiscounts();
  }, [API_URI]); // Empty dependency array to run once after initial render

  useEffect(() => {
    const fetchScheduledMessages = async () => {
      try {
        const response = await axios.get(`${API_URI}/api/shed/messages`);
        const filteredNotifications = response.data.data
          .filter(
            (msg) =>
              (msg.type === "promotions" || msg.type === "discounts") &&
              (!msg.expiredAt || new Date(msg.expiredAt) > new Date())
          );
        setScheduledMessages(filteredNotifications);
        console.log(filteredNotifications); // Check if data is fetched correctly
      } catch (error) {
        console.error("Error fetching scheduled messages:", error);
      }
    };

    fetchScheduledMessages();
  }, [API_URI]); // Empty dependency array to run once after initial render

  // Popular routes data
  const popularRoutes = [
    {
      id: 1,
      name: "Colombo - Kandy",
      description: "Daily Express & Luxury Services",
      duration: "3-4 hours",
      frequency: "Every 15-30 mins",
    },
    {
      id: 2,
      name: "Colombo - Galle",
      description: "Southern Expressway Routes",
      duration: "1.5-2 hours",
      frequency: "Every 20-40 mins",
    },
    {
      id: 3,
      name: "Colombo - Jaffna",
      description: "A/C & Non-A/C Services",
      duration: "8-10 hours",
      frequency: "Hourly",
    },
    {
      id: 4,
      name: "Kandy - Nuwara Eliya",
      description: "Hill Country Express",
      duration: "2-3 hours",
      frequency: "Every 30-60 mins",
    },
  ];

  // Partners data
  const partners = [
    { id: 1, name: "SLTB", logo: "/logos/sltb.png" },
    { id: 2, name: "Private Bus Association", logo: "/logos/pba.png" },
    { id: 3, name: "Intercity Express", logo: "/logos/intercity.jpeg" },
    { id: 4, name: "Lanka Ashok Leyland", logo: "/logos/lal.png" },
    { id: 5, name: "Tourism Board", logo: "/logos/tourism-board.png" },
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
              style={{ height: "100%", width: "100%" }}
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
              {popularRoutes.map((route) => (
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

          {/* Promotions & Discounts Cards */}
          <div className="cards-container">
            <h2 className="section-title">Promotions & Discounts</h2>
            <div className="cards-grid">
              {promotionsAndDiscounts.length > 0 ? (
                promotionsAndDiscounts
                  .filter((notif) => !notif.expiredAt || new Date(notif.expiredAt) > new Date())
                  .map((notif) => (
                    <div key={notif.notificationId} className="card promo-card">
                      <div className="promo-badge">HOT DEAL</div>
                      <h3>{notif.type}</h3>
                      <p>{notif.message}</p>
                      <div className="promo-code">
                        <span>Use code: </span>
                        <strong>2550</strong>
                      </div>
                      <div className="promo-valid">
                        Valid until: {new Date(notif.expiredAt).toLocaleDateString()}
                      </div>
                      <button className="card-button">Claim Offer</button>
                    </div>
                  ))
              ) : (
                <p>No promotions or discounts available at the moment.</p>
              )}
            </div>
          </div>

          {/* Scheduled Messages Section */}
          <div className="cards-container">
            <div className="cards-grid">
              {scheduledMessages.length > 0 ? (
                scheduledMessages
                  .filter((msg) => !msg.expiredAt || new Date(msg.expiredAt) > new Date())
                  .map((msg) => (
                    <div key={msg._id} className="card promo-card">
                      <div className="promo-badge">HOT DEAL </div>
                      <h3>{msg.type}</h3>
                      <p>{msg.message}</p>
                      <div className="promo-code">
                        <span>Use code: </span>
                        <strong>2550</strong>
                      </div>
                      <div className="promo-valid">
                        Valid until: {new Date(msg.expiredAt).toLocaleDateString()}
                      </div>
                      <button className="card-button">Claim Offer</button>
                    </div>
                  ))
              ) : (
                <p>No scheduled messages available at the moment.</p>
              )}
            </div>
          </div>
        </section>

        {/* Partners Section */}
        <section className="partners-section">
          <h2 className="section-title">Our Trusted Partners</h2>
          <div className="partners-grid">
            {partners.map((partner) => (
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
