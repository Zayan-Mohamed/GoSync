import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/authService";

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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form className="p-6 bg-white shadow-md rounded-lg" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-4">Register</h2>
        {error && <p className="text-red-500">{error}</p>}
        <input type="text" placeholder="Name" className="p-2 border rounded w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input type="email" placeholder="Email" className="p-2 border rounded w-full mt-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input type="tel" placeholder="Phone" className="p-2 border rounded w-full mt-2" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <input type="password" placeholder="Password" className="p-2 border rounded w-full mt-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <button type="submit" className="mt-4 p-2 bg-green-500 text-white rounded w-full">Register</button>
      </form>
    </div>
  );
};

export default Register;
