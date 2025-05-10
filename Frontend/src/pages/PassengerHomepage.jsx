import React, { useState, useEffect, useRef } from "react";
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
  const [topRoutes, setTopRoutes] = useState([]);
  const { fetchStops } = useStopStore();
  const [bookingFormData, setBookingFormData] = useState(null);
  const bookingFormRef = useRef(null);

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

  // Fetch top routes from analytics
  useEffect(() => {
    const fetchTopRoutes = async () => {
      try {
        const response = await axios.get(`${API_URI}/api/routes/route-analytics`);
        // Only process and set the top routes if we have valid data
        if (response.data && Array.isArray(response.data.topRoutes)) {
          // Use data directly from the response since stopCount is already calculated in backend
          setTopRoutes(response.data.topRoutes.slice(0, 4).map(route => ({
            ...route,
            estimatedDuration: route.estimatedDuration || '2-3'
          })));
        } else {
          setTopRoutes([]); // Set empty array if no valid data
        }
      } catch (error) {
        console.error("Error fetching top routes:", error);
        setTopRoutes([]); // Set empty array on error
      }
    };

    fetchTopRoutes();
  }, [API_URI]);

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

  const handleViewSchedule = (routeName) => {
    // Split the route name by "to" or "-" and trim any whitespace
    const parts = routeName.split(/\s*(?:to|-)\s*/i);
    if (parts.length === 2) {
      const [fromLocation, toLocation] = parts;
      setBookingFormData({
        fromLocation: fromLocation.trim(),
        toLocation: toLocation.trim(),
        journeyDate: new Date().toISOString().split('T')[0] // Set to current date by default
      });
      
      // Scroll to booking form
      bookingFormRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  return (
    <div className="passenger-homepage bg-[#F5F5F5]">
      <Navbar1 />
      
      {/* Hero Section with Map Background */}
      <div className="relative min-h-[600px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <MapContainer
            center={[7.8731, 80.7718]}
            zoom={8}
            className="h-full w-full"
            zoomControl={false}
            dragging={false}
            doubleClickZoom={false}
            scrollWheelZoom={false}
            touchZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              opacity={0.6}
            />
          </MapContainer>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-[#F5F5F5]"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-[#212121] mb-4">
              Your Journey Starts Here
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Find and book bus tickets for your next adventure across Sri Lanka
            </p>
          </div>
          
          <div ref={bookingFormRef}>
            <BookingForm isVisible={true} initialValues={bookingFormData} />
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-[#FFE082] to-[#FFC107] shadow-lg transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-[#E65100] mb-2">500+</div>
              <div className="text-[#212121] font-medium">Daily Routes</div>
            </div>
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-[#FFE082] to-[#FFC107] shadow-lg transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-[#E65100] mb-2">1M+</div>
              <div className="text-[#212121] font-medium">Happy Passengers</div>
            </div>
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-[#FFE082] to-[#FFC107] shadow-lg transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-[#E65100] mb-2">100+</div>
              <div className="text-[#212121] font-medium">Bus Partners</div>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Routes Section */}
      <div className="py-16 bg-gradient-to-b from-white to-[#F5F5F5]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#212121] mb-4">Popular Bus Routes</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Discover the most traveled routes across Sri Lanka with our reliable bus service</p>
          </div>

          {topRoutes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {topRoutes.map((route, index) => (
                <div 
                  key={route.routeId || `route-${index}`} 
                  className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Decorative Elements */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E65100] to-[#FF8F00]"></div>
                  <div className="absolute top-0 right-0 w-16 h-16">
                    <div className="absolute transform rotate-45 bg-[#FFE082] w-20 h-20 -right-10 -top-10"></div>
                    <span className="absolute top-1 right-2 text-[#E65100]">🚌</span>
                  </div>

                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-[#212121] mb-2 line-clamp-2 min-h-[3.5rem]">{route.routeName}</h3>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-gray-600">
                        <span className="w-8 h-8 rounded-full bg-[#FFE082] flex items-center justify-center flex-shrink-0">
                          <span role="img" aria-label="bus stop">🚏</span>
                        </span>
                        <span className="ml-3 text-sm">{route.stopCount} stops on route</span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <span className="w-8 h-8 rounded-full bg-[#FFE082] flex items-center justify-center flex-shrink-0">
                          <span role="img" aria-label="clock">⏱️</span>
                        </span>
                        <span className="ml-3 text-sm">{route.estimatedDuration || '2-3'} hours journey</span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <span className="w-8 h-8 rounded-full bg-[#FFE082] flex items-center justify-center flex-shrink-0">
                          <span role="img" aria-label="people">👥</span>
                        </span>
                        <span className="ml-3 text-sm">{route.bookingCount} monthly travelers</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleViewSchedule(route.routeName)}
                      className="w-full py-3 px-4 bg-gradient-to-r from-[#E65100] to-[#FF8F00] text-white rounded-lg
                        hover:from-[#FF8F00] hover:to-[#FFC107] transition-all duration-300
                        flex items-center justify-center group-hover:shadow-lg"
                    >
                      <span>View Schedule</span>
                      <svg 
                        className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Popular Route Badge */}
                  {route.bookingCount > 1000 && (
                    <div className="absolute top-4 left-4 px-3 py-1 bg-[#E65100] text-white text-xs font-semibold rounded-full">
                      Popular Route
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-full flex items-center justify-center p-12">
              <div className="animate-pulse space-y-8 w-full max-w-md">
                <div className="h-32 bg-gray-200 rounded-xl"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#212121] mb-12">Why Choose GoSync?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#FFE082] rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#E65100]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Updates</h3>
              <p className="text-gray-600">Track your bus location and get instant updates about your journey</p>
            </div>
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#FFE082] rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#E65100]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Booking</h3>
              <p className="text-gray-600">Safe and secure payment options for your peace of mind</p>
            </div>
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#FFE082] rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#E65100]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">Our customer service team is always here to help you</p>
            </div>
          </div>
        </div>
      </div>

      {/* Promotions Section */}
      <div className="py-16 bg-[#F5F5F5]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#212121] mb-12">Special Offers & Promotions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {promotionsAndDiscounts.length > 0 ? (
              promotionsAndDiscounts
                .filter((notif) => !notif.expiredAt || new Date(notif.expiredAt) > new Date())
                .map((notif) => (
                  <div key={notif.notificationId} 
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                    <div className="h-2 bg-gradient-to-r from-[#E65100] to-[#FF8F00]"></div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-3 py-1 bg-[#FFE082] text-[#E65100] text-sm font-semibold rounded-full">
                          HOT DEAL
                        </span>
                        <span className="text-sm text-gray-500">
                          Valid until: {new Date(notif.expiredAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-[#212121] mb-3 capitalize">
                        {notif.type}
                      </h3>
                      <p className="text-gray-600 mb-4">{notif.message}</p>
                      <div className="bg-[#F5F5F5] p-3 rounded-lg mb-4">
                        <span className="text-sm text-gray-600">Use code: </span>
                        <span className="font-bold text-[#E65100]">2550</span>
                      </div>
                      <button className="w-full py-2.5 px-4 bg-gradient-to-r from-[#E65100] to-[#FF8F00] text-white rounded-lg hover:from-[#FF8F00] hover:to-[#FFC107] transition-all duration-300 flex items-center justify-center group">
                        <span>Claim Offer</span>
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="col-span-full text-center text-gray-500">
                No promotions available at the moment.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scheduled Messages Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#212121] mb-12">Limited Time Offers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {scheduledMessages.length > 0 ? (
              scheduledMessages
                .filter((msg) => !msg.expiredAt || new Date(msg.expiredAt) > new Date())
                .map((msg) => (
                  <div key={msg._id || `message-${msg.notificationId}`} 
                    className="bg-gradient-to-br from-[#FFE082] to-[#FFC107] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group p-0.5">
                    <div className="bg-white rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-3 py-1 bg-[#E65100] text-white text-sm font-semibold rounded-full">
                          FLASH SALE
                        </span>
                        <span className="text-sm text-gray-500">
                          Valid until: {new Date(msg.expiredAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-[#212121] mb-3 capitalize">
                        {msg.type}
                      </h3>
                      <p className="text-gray-600 mb-4">{msg.message}</p>
                      <div className="bg-[#F5F5F5] p-3 rounded-lg mb-4 flex items-center justify-between">
                        <span className="text-sm text-gray-600">Use code: </span>
                        <span className="font-bold text-[#E65100] text-lg">2550</span>
                      </div>
                      <button className="w-full py-2.5 px-4 bg-gradient-to-r from-[#E65100] to-[#FF8F00] text-white rounded-lg hover:from-[#FF8F00] hover:to-[#FFC107] transition-all duration-300 flex items-center justify-center group">
                        <span>Claim Offer</span>
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="col-span-full text-center text-gray-500">
                No scheduled offers available at the moment.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Partners Section */}
      <div className="py-16 bg-[#F5F5F5]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#212121] mb-12">Our Trusted Partners</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {partners.map((partner) => (
              <div key={partner.id} 
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-h-16 object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/logos/default-partner.png";
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile App Promo Section */}
      {/* <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-[#E65100] rounded-lg shadow-lg p-6 md:p-8 flex flex-col md:flex-row items-center">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Download Our Mobile App</h2>
              <p className="text-white text-lg">Book tickets, track buses, and get exclusive app-only discounts!</p>
            </div>
            <div className="flex-shrink-0">
              <a href="/download" className="block">
                <img src="/images/app-promo.png" alt="Download App" className="w-full max-w-[200px] mx-auto" />
              </a>
            </div>
          </div>
        </div>
      </div> */}

      <Footer1 />
    </div>
  );
};

export default PassengerHomepage;
