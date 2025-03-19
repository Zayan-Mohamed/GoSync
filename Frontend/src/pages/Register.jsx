import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/authService";
import { Link } from "react-router-dom";
import gosyncLogo from "/assets/GoSync.png"; // Ensure the logo is in the correct directory

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/users/register", form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-lightYellow">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <img src={gosyncLogo} alt="GoSync Logo" className="mx-auto w-32 mb-4" />
        <h2 className="text-2xl font-bold text-darkCharcoal text-center mb-6">Create Your GoSync Account</h2>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-brightYellow"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-brightYellow"
            required
          />
          <input
            type="tel"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-brightYellow"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-brightYellow"
            required
          />
          <button
            type="submit"
            className="w-full p-3 bg-deepOrange text-white font-bold rounded-md hover:bg-sunsetOrange transition"
          >
            Register
          </button>
        </form>
        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-brightYellow font-medium">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
