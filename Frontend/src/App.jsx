import { BrowserRouter as Router, Routes, Route, Navigate  } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import PassengerDashboard from "./pages/PassengerDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ✅ Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["passenger"]} />}>
          <Route path="/passenger" element={<PassengerDashboard />} />
        </Route>

        {/* ✅ Catch-all for unauthorized access */}
        <Route path="/unauthorized" element={<h1>Access Denied</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
