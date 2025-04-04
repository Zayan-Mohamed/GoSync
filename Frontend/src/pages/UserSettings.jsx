import { useState, useEffect } from "react";
import useAuthStore from "../store/authStore";
import API from "../services/authService";
import AdminLayout from "../layouts/AdminLayout";
import BookingLayout from "../layouts/BookingLayout";

const UserSettings = () => {
  const { user, isAuthenticated, updateUserState } = useAuthStore();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "", // Added password field
    newPassword: "", // Added new password field for updating
  });

  // Load user details into form when the page loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        password: "", // Reset password field
        newPassword: "", // Reset newPassword field
      });
    }
  }, [user]);

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedData = { ...formData };
      
      // If a new password is provided, include it in the request body
      if (formData.newPassword) {
        updatedData.password = formData.newPassword;
      }
      
      const { data } = await API.put("/api/auth/update", updatedData);
      updateUserState(data.user);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    }
  };

  if (!isAuthenticated) {
    return <p className="text-center text-red-500">Please log in to access settings.</p>;
  }

  // Conditional Layout Rendering based on user.role
  const Layout = user?.role === "admin" ? AdminLayout : BookingLayout;

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">User Settings</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              disabled // Prevent changing email directly
            />
          </div>
          <div>
            <label className="block text-gray-700">Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Enter new password (optional)"
            />
          </div>
          <button type="submit" className="w-full bg-deepOrange text-white p-2 rounded-lg">
            Save Changes
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default UserSettings;
