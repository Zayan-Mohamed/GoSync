import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/authService";
import { Link } from "react-router-dom";
import gosyncLogo from "/assets/GoSync-Logo.png"; // Ensure the logo is in the correct directory

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    color: "bg-gray-300",
    label: "Weak",
  });
  const [criteria, setCriteria] = useState({
    length: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });

  const navigate = useNavigate();

  const checkPasswordStrength = (password) => {
    let strength = { score: 0, color: "bg-gray-300", label: "Weak" };
    let newCriteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[^A-Za-z0-9]/.test(password),
    };

    strength.score = Object.values(newCriteria).filter(Boolean).length;

    switch (strength.score) {
      case 1:
        strength.color = "bg-red-500";
        strength.label = "Weak";
        break;
      case 2:
        strength.color = "bg-yellow-500";
        strength.label = "Medium";
        break;
      case 3:
        strength.color = "bg-green-500";
        strength.label = "Strong";
        break;
      case 4:
        strength.color = "bg-blue-500";
        strength.label = "Very Strong";
        break;
      default:
        strength.color = "bg-gray-300";
        strength.label = "Weak";
    }

    setCriteria(newCriteria);
    return strength;
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setForm({ ...form, password });
    setPasswordStrength(checkPasswordStrength(password));
  };

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
    <div className="flex justify-center items-center min-h-screen bg-lightYellow px-4">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <img src={gosyncLogo} alt="GoSync Logo" className="mx-auto w-24 mb-3" />
        <h2 className="text-xl font-bold text-darkCharcoal text-center mb-4">
          Create Your GoSync Account
        </h2>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brightYellow"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brightYellow"
            required
          />
          <input
            type="tel"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brightYellow"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handlePasswordChange}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brightYellow"
            required
          />

          {/* Password Strength Indicator */}
          <div className="w-full h-1.5 bg-gray-300 rounded-md overflow-hidden">
            <div
              className={`h-full ${passwordStrength.color} transition-all duration-300`}
              style={{ width: `${passwordStrength.score * 25}%` }}
            />
          </div>
          <p
            className={`text-xs font-bold ${passwordStrength.color.replace("bg-", "text-")}`}
          >
            {passwordStrength.label}
          </p>

          {/* Password Strength Criteria (Compact View) */}
          <div className="text-sm mt-2 grid grid-cols-2 gap-1">
            <p
              className={`flex items-center ${criteria.length ? "text-green-500" : "text-gray-500"}`}
            >
              {criteria.length ? "✅" : "❌"} 8+ characters
            </p>
            <p
              className={`flex items-center ${criteria.uppercase ? "text-green-500" : "text-gray-500"}`}
            >
              {criteria.uppercase ? "✅" : "❌"} 1 uppercase letter
            </p>
            <p
              className={`flex items-center ${criteria.number ? "text-green-500" : "text-gray-500"}`}
            >
              {criteria.number ? "✅" : "❌"} 1 number
            </p>
            <p
              className={`flex items-center ${criteria.specialChar ? "text-green-500" : "text-gray-500"}`}
            >
              {criteria.specialChar ? "✅" : "❌"} 1 special character
            </p>
          </div>

          <button
            type="submit"
            className="w-full p-2 bg-deepOrange text-white font-bold rounded-md hover:bg-sunsetOrange transition"
          >
            Register
          </button>
        </form>

        <p className="text-center text-xs mt-3">
          Already have an account?{" "}
          <Link to="/login" className="text-brightYellow font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
