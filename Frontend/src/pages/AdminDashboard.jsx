import AdminLayout from "../layouts/AdminLayout";
import ChartComponent from "../components/ChartComponent";
import CardComponent from "../components/CardComponent";
import useAuthStore from "../store/authStore";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return <Navigate to="/login" replace />; // Redirect to login if not authenticated
    }
  }, [isAuthenticated, user]);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mt-4 mb-6">
        <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
      </div>
      <div className="flex items-center justify-center mb-4">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      </div>
      <div className="grid grid-cols-3 gap-6 mt-6">
        <CardComponent title="Total Users" value="1,500" />
        <CardComponent title="Revenue" value="$12,000" />
        <CardComponent title="Active Sessions" value="250" />
      </div>
      <div className="mt-8">
        <ChartComponent />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
