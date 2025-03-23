import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "../pages/Login";
import Register from "../pages/Register";
import AdminDashboard from "../pages/AdminDashboard";
import PassengerHomepage from "../pages/PassengerHomepage";
import ProtectedRoute from "../components/ProtectedRoute";
import SplashScreen from "../pages/SplashScreen";
import UserSettings from "../pages/UserSettings";
import Notification from "../pages/Notification";
import AddNotification from "../pages/AddNotification";
import UpdateNotification from "../pages/UpdateNotification";
import SeatSelection from "../pages/SeatSelection";

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

          <Route path="/notification-management" element={<Notification />} />
          <Route path="/add-notification" element={<AddNotification />} />
          <Route path="/update-notification/:id" element={<UpdateNotification />} />
          
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["passenger"]} />}>
          <Route path="/passenger" element={<PassengerDashboard />} />
          <Route path="/seat-selection" element={<SeatSelection />} />
          <Route path="/passenger" element={<PassengerHomepage />} />
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