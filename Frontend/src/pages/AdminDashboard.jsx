import AdminLayout from "../layouts/AdminLayout";
import ChartComponent from "../components/ChartComponent";
import CardComponent from "../components/CardComponent";

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
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
