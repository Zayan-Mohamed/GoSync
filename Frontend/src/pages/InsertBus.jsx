import { useState, useEffect } from "react";
import { getBuses, addBus, deleteBus } from "../services/busService"; // Import API functions
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import axios from "axios";

const InsertBus = () => {
  const [formData, setFormData] = useState({
    busNumber: "",
    busType: "",
    capacity: "",
    status: "Active", // Default value for status
    routeId: "",
    price: "",
    operatorName: "",
    operatorPhone: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post("http://localhost:5000/api/buses", formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setSuccess("Bus data submitted successfully!");
      setFormData({
        busNumber: "",
        busType: "",
        capacity: "",
        status: "Active",
        routeId: "",
        price: "",
        operatorName: "",
        operatorPhone: "",
      });
    } catch (err) {
      setError("There was an error submitting the form. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-[#F5F5F5] min-h-screen">
        <Navbar />
        <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Bus Registration Form</h2>
      
      {/* Success and error messages */}
      {success && <div className="text-green-500 mb-4">{success}</div>}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700">Bus Number</label>
          <input
            type="text"
            name="busNumber"
            value={formData.busNumber}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700">Bus Type</label>
          <select
            type="text"
            name="busType"
            value={formData.busType}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md"
            >
               <option value="AC">Luxury (AC)</option>       
               <option value="Semi-Luxury">Semi-Luxury (Non-AC) </option>
               <option value="Non-AC">Non - AC</option>
            </select>
          
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700">Capacity</label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700">Route ID</label>
          <input
            type="text"
            name="routeId"
            value={formData.routeId}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700">Price</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700">Operator Name</label>
          <input
            type="text"
            name="operatorName"
            value={formData.operatorName}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700">Operator Phone</label>
          <input
            type="text"
            name="operatorPhone"
            value={formData.operatorPhone}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 focus:outline-none"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
      </div>
    </div>
  );
};

export default InsertBus;
