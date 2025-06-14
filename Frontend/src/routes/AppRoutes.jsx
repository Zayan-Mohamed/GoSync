import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
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
import ShedTable from "../pages/ShedTable";
import AddMessage from "../pages/AddMessage";
import BusSearchResults from "../pages/BusSearchResults";
import BusOperatorsList from "../pages/BusOperatorsList";
import Payment from "../components/Payment";
import BookingSummary from "../components/BookingSummary";
import AddStop from "../pages/AddStop.jsx";
import StopList from "../pages/StopList.jsx";
import AddRoute from "../pages/AddRoute.jsx";
import ManageRouteStops from "../pages/ManageRouteStops.jsx";
import BookingHistory from "../pages/BookingHistory.jsx";
import Reserved from "../pages/Reserved";
import CancelTicket from "../pages/CancelTicket";
import AddBusOperators from "../pages/addBusOperators.jsx";
import BusAssignmentPage from "../pages/BusAssignmentPage.jsx";
import ScheduleManagement from "../pages/ScheduleManagement.jsx";
import AddSchedule from "../pages/AddSchedule.jsx";
import EditSchedule from "../pages/EditSchedule.jsx";
import ScheduleAnalytics from "../pages/ScheduleAnalytics.jsx";
import ScheduleArchives from "../pages/ScheduleArchives.jsx";
import BusSchedules from "../pages/BusSchedules.jsx";

import SeatManagement from "../pages/SeatManagement.jsx";
import AddSeat from "../pages/AddSeat.jsx";
import EditSeat from "../pages/EditSeat.jsx";
import BulkEditSeats from "../pages/BulkEditSeats.jsx";
import SeatAnalytics from "../pages/SeatAnalytics.jsx";
import BookingManagement from "../pages/BookingManagement.jsx";
import AddBooking from "../pages/AddBooking.jsx";
import BookingAnalytics from "../pages/BookingAnalytics.jsx";
import UpdateMessage from "../pages/UpdateMessage.jsx";
import AnalyticsPage from "../pages/AnalyticsPage.jsx";
import StopAnalytics from "../pages/StopAnalytics.jsx";
import RouteAnalytics from "../pages/RouteAnalytics.jsx";
import Notices from "../pages/Notices.jsx";
import AddNotice from "../pages/AddNotice.jsx";
import EditNotice from "../pages/EditNotice.jsx";
import Analytics from "../pages/Analytics.jsx";
import BusAnalytics from '../pages/BusAnalytics';
import BusMaintenance from "../pages/BusMaintenance";

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
          <Route path="/bus-analytics" element={<BusAnalytics />} />
          <Route path="/bus-assign" element={<BusAssignmentPage />} />
          <Route path="/busop-man" element={<BusOperatorsList />} />
          <Route path="/stop-analytics" element={<StopAnalytics />} />
          <Route path="/route-analytics" element={<RouteAnalytics />} />
         <Route path="/bus-maintenance" element={<BusMaintenance />} />
 

            <Route path="/notification-management" element={<Notification />} />
            <Route path="/add-notification" element={<AddNotification />} />
            <Route
              path="/update-notification/:id"
              element={<UpdateNotification />}
            />
             <Route path="/notification-analytics" element={<AnalyticsPage />} />
             <Route path="/update-message/:id" element={<UpdateMessage />} />
            <Route path="/current-routes" element={<CurrentRoutes />} />
            <Route path="/Schedule-notification" element={<ShedTable />} />
            <Route path="/add-message" element={<AddMessage />} />
            <Route path="/add-stop" element={<AddStop />} />
            <Route path="/stop-management" element={<StopList />} />
            <Route
              path="/schedule-management"
              element={<ScheduleManagement />}
            />
            <Route path="/add-schedule" element={<AddSchedule />} />
            <Route
              path="/edit-schedule/:scheduleID"
              element={<EditSchedule />}
            />
            <Route path="/schedule-analytics" element={<ScheduleAnalytics />} />
            <Route path="/schedule-archives" element={<ScheduleArchives />} />
            <Route path="/add-route" element={<AddRoute />} />
            <Route path="/seat-management" element={<SeatManagement />} />
            <Route path="/add-seat" element={<AddSeat />} />
            <Route path="/edit-seat/:seatId" element={<EditSeat />} />
            <Route path="/bulk-edit-seats" element={<BulkEditSeats />} />
            <Route path="/seat-analytics" element={<SeatAnalytics />} />
            <Route path="/booking-management" element={<BookingManagement />} />
            <Route path="/add-booking" element={<AddBooking />} />
            <Route path="/booking-analytics" element={<BookingAnalytics />} />

            <Route path="/add-routes" element={<AddRoute />} />
            <Route path="/route-stops" element={<ManageRouteStops />} />
            <Route path="/add-operorator" element={<AddBusOperators />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/add-notice" element={<AddNotice />} />
            <Route path="/edit-notice/:id" element={<EditNotice />} />
            <Route path="/view-notice/:id" element={<EditNotice />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["passenger"]} />}>
            <Route path="/passenger" element={<PassengerHomepage />} />
            <Route path="/seat-selection" element={<SeatSelection />} />
            <Route path="/bus-search-results" element={<BusSearchResults />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/booking-summary" element={<BookingSummary />} />
            <Route path="/booking-history" element={<BookingHistory />} />
            <Route path="/reserved" element={<Reserved />} />
            <Route path="/cancel-ticket" element={<CancelTicket />} />
            <Route path="/bus-schedules" element={<BusSchedules />} />
            <Route
              path="/booking-confirmation"
              element={<div>Booking Confirmed</div>}
            />
          </Route>
          <Route path="/settings" element={<UserSettings />} />

          {/* ✅ Catch-all for unauthorized access */}
          <Route path="/unauthorized" element={<h1>Access Denied</h1>} />
          <Route path="/" element={<AdminDashboard />} />
        </Routes>
      )}
    </Router>
  );
};

export default AppRoutes;
