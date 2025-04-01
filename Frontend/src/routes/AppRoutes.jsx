import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "../pages/Login";
import Register from "../pages/Register";
import AdminDashboard from "../pages/AdminDashboard";
import PassengerHomepage from "../pages/PassengerHomepage";
import ProtectedRoute from "../components/ProtectedRoute";
import SplashScreen from "../pages/SplashScreen";
import CurrentRoutes from "../pages/CurrentRoutes";
import InsertBus from "../pages/InsertBus";
import BusList from "../pages/BusList";
import UserSettings from "../pages/UserSettings";
import Notification from "../pages/Notification";
import AddNotification from "../pages/AddNotification";
import UpdateNotification from "../pages/UpdateNotification";
import SeatSelection from "../pages/SeatSelection";
import ShedTable from "../pages/shedTable";
import AddMessage from "../pages/AddMessage";
import BusSearchResults from "../pages/BusSearchResults";
import Payment from "../components/Payment";
import BookingSummary from "../components/BookingSummary";
import AddStop from "../pages/AddStop.jsx";
import StopList from "../pages/StopList.jsx";

const AppRoutes = () => {

  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    setTimeout(() => setShowSplash(false), 3000);
  }, []);

  return (
    <Router>
      {showSplash ? (
        <SplashScreen />
      ) : (
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        

        {/* ✅ Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/bus-management" element={<BusList />} />
          <Route path="/add-bus" element={<InsertBus />} />

          <Route path="/notification-management" element={<Notification />} />
          <Route path="/add-notification" element={<AddNotification />} />
          <Route path="/update-notification/:id" element={<UpdateNotification />} />
          
          <Route path="/current-routes" element={<CurrentRoutes />} />
          
            <Route path="/notification-management" element={<Notification />} />
            
            <Route path="/add-notification" element={<AddNotification/>} />
            <Route path="/update-notification/:id" element={<UpdateNotification />} />
            <Route path="/Schedule-notification" element={<ShedTable/>} />
            <Route path="/add-message" element={<AddMessage/>} />
            <Route path="/add-stop" element={<AddStop/>} />
            <Route path="/stop-management" element={<StopList/>} />
        </Route>
        

        <Route element={<ProtectedRoute allowedRoles={["passenger"]} />}>
          <Route path="/passenger" element={<PassengerHomepage />} />
          <Route path="/seat-selection" element={<SeatSelection />} />
          <Route path="/passenger" element={<PassengerHomepage />} />
          <Route path="/bus-search-results" element={<BusSearchResults />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/booking-summary" element={<BookingSummary />} />
          <Route path="/booking-confirmation" element={<div>Booking Confirmed</div>} />
        </Route>
        <Route path="/settings" element={<UserSettings/>} />
       
        {/* ✅ Catch-all for unauthorized access */}
        <Route path="/unauthorized" element={<h1>Access Denied</h1>} />
        <Route path="/" element={<AdminDashboard />} />
      </Routes>
      )}
    </Router>
  );
};

export default AppRoutes;